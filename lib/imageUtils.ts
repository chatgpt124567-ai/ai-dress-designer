/**
 * Image Utilities for AI Dress Designer
 * Handles image compression, thumbnail generation, and storage upload
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Convert base64 data URL to Blob
 */
export function base64ToBlob(base64: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  
  // Get MIME type
  const mimeMatch = base64.match(/data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  
  // Convert to binary
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Compress image to reduce file size
 * @param base64Image - Base64 data URL of the image
 * @param maxWidth - Maximum width (default: 1920px)
 * @param quality - JPEG quality 0-1 (default: 0.85)
 * @returns Compressed base64 data URL
 */
export async function compressImage(
  base64Image: string,
  maxWidth: number = 1920,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    // Ensure proper data URL format - raw base64 strings won't load as image src
    img.src = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
  });
}

/**
 * Generate thumbnail from base64 image
 * @param base64Image - Base64 data URL of the image
 * @param maxWidth - Maximum thumbnail width (default: 400px)
 * @param quality - JPEG quality 0-1 (default: 0.75)
 * @returns Thumbnail base64 data URL
 */
export async function generateThumbnail(
  base64Image: string,
  maxWidth: number = 400,
  quality: number = 0.75
): Promise<string> {
  return compressImage(base64Image, maxWidth, quality);
}

/**
 * Upload image to Supabase Storage
 * @param userId - User ID for folder organization
 * @param designId - Design ID for file naming
 * @param base64Image - Base64 data URL of the image
 * @param isThumbnail - Whether this is a thumbnail (affects path)
 * @returns Storage path and public URL
 */
export async function uploadImageToStorage(
  userId: string,
  designId: string,
  base64Image: string,
  isThumbnail: boolean = false
): Promise<{ path: string; url: string }> {
  const supabase = createClient();
  
  // Convert base64 to blob
  const blob = base64ToBlob(base64Image);
  
  // Generate file path
  const folder = isThumbnail ? 'thumbnails' : 'full';
  const fileName = `${designId}.jpg`;
  const filePath = `${userId}/${folder}/${fileName}`;
  
  // Upload to storage
  const { data, error } = await supabase.storage
    .from('design-images')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true, // Overwrite if exists
    });
  
  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('design-images')
    .getPublicUrl(filePath);
  
  return {
    path: filePath,
    url: urlData.publicUrl,
  };
}

/**
 * Delete image from Supabase Storage
 * @param path - Storage path of the image
 */
export async function deleteImageFromStorage(path: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase.storage
    .from('design-images')
    .remove([path]);
  
  if (error) {
    console.error('Storage delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Process and upload design image (full + thumbnail)
 * @param userId - User ID
 * @param designId - Design ID
 * @param base64Image - Original base64 image
 * @returns Object with storage paths and URLs
 */
export async function processAndUploadDesignImage(
  userId: string,
  designId: string,
  base64Image: string
): Promise<{
  fullImagePath: string;
  fullImageUrl: string;
  thumbnailPath: string;
  thumbnailUrl: string;
}> {
  try {
    // 1. Compress full image
    const compressedImage = await compressImage(base64Image, 1920, 0.85);
    
    // 2. Generate thumbnail
    const thumbnail = await generateThumbnail(base64Image, 400, 0.75);
    
    // 3. Upload both to storage
    const [fullImageResult, thumbnailResult] = await Promise.all([
      uploadImageToStorage(userId, designId, compressedImage, false),
      uploadImageToStorage(userId, designId, thumbnail, true),
    ]);
    
    return {
      fullImagePath: fullImageResult.path,
      fullImageUrl: fullImageResult.url,
      thumbnailPath: thumbnailResult.path,
      thumbnailUrl: thumbnailResult.url,
    };
  } catch (error) {
    console.error('Error processing and uploading image:', error);
    throw error;
  }
}

