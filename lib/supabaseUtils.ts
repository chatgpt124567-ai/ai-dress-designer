/**
 * Supabase Utilities with Retry Logic
 * Handles authentication errors and implements exponential backoff
 */

import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Execute a Supabase query with retry logic
 * @param queryFn - Function that executes the Supabase query
 * @param config - Retry configuration
 * @returns Query result
 */
export async function withRetry<T>(
  queryFn: (supabase: SupabaseClient) => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const supabase = createClient();
      
      // Refresh session before query if needed
      if (attempt > 0) {
        await supabase.auth.refreshSession();
      }

      return await queryFn(supabase);
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error);
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      console.warn(`Query failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      console.log(`Retrying in ${delay}ms...`);

      await sleep(delay);
      
      // Exponential backoff with max delay cap
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError || new Error('Query failed after retries');
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : '';

  // Retryable error patterns
  const retryablePatterns = [
    'AuthRetryableFetchError',
    'Failed to fetch',
    'Network request failed',
    'timeout',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'auth session missing',
  ];

  return retryablePatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase()) ||
    errorName.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Fetch designs with retry logic and pagination
 */
export async function fetchDesignsWithRetry(
  userId: string,
  page: number = 0,
  pageSize: number = 12
) {
  return withRetry(async (supabase) => {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('designs')
      .select('id, image_url, thumbnail_url, enhanced_prompt, created_at, is_favorite, questionnaire_answers')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return data || [];
  });
}

/**
 * Delete design with retry logic
 */
export async function deleteDesignWithRetry(designId: string) {
  return withRetry(async (supabase) => {
    const { error } = await supabase
      .from('designs')
      .delete()
      .eq('id', designId);

    if (error) throw error;
  });
}

/**
 * Get user with retry logic
 */
export async function getUserWithRetry() {
  return withRetry(async (supabase) => {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    return user;
  });
}

