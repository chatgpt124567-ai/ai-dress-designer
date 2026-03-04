-- ============================================
-- Migration: Add model_used column to designs table
-- ============================================
-- This migration adds a column to track which AI model was used
-- to generate each design
-- ============================================

-- 1. Add model_used column to designs table
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS model_used TEXT DEFAULT 'google/gemini-3.1-flash-image-preview';

-- 2. Add comment to model_used column
COMMENT ON COLUMN designs.model_used IS 'AI model used for design generation (e.g., google/gemini-3.1-flash-image-preview or google/gemini-3-pro-image-preview)';

-- 3. Update existing rows to have default model
UPDATE designs 
SET model_used = 'google/gemini-3.1-flash-image-preview'
WHERE model_used IS NULL;

-- 4. Make model_used NOT NULL after setting defaults
ALTER TABLE designs 
ALTER COLUMN model_used SET NOT NULL;

-- ============================================
-- Verification Query
-- ============================================
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'designs' 
-- AND column_name = 'model_used';

