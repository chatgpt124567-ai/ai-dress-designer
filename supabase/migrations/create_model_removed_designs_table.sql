-- ============================================
-- Migration: Create Model Removed Designs Table
-- ============================================
-- This migration creates a table for storing designs where the fashion model
-- has been replaced with a mannequin using AI
-- ============================================

-- 1. Create model_removed_designs table
CREATE TABLE IF NOT EXISTS public.model_removed_designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Original image information
  original_image_url TEXT NOT NULL,
  
  -- Result image information
  result_image_url TEXT NOT NULL,
  result_storage_path TEXT,
  result_thumbnail_url TEXT,
  result_thumbnail_storage_path TEXT,
  
  -- Processing details
  model_used TEXT NOT NULL, -- e.g., 'google/gemini-3.1-flash-image-preview' or 'google/gemini-2.0-flash-001'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add comments to columns
COMMENT ON TABLE model_removed_designs IS 'Stores designs where fashion models have been replaced with mannequins using AI';
COMMENT ON COLUMN model_removed_designs.original_image_url IS 'URL or Base64 of the original uploaded image with fashion model';
COMMENT ON COLUMN model_removed_designs.result_image_url IS 'Public URL of the AI-processed image with mannequin';
COMMENT ON COLUMN model_removed_designs.result_storage_path IS 'Storage path of result full-size image';
COMMENT ON COLUMN model_removed_designs.result_thumbnail_url IS 'Public URL of result image thumbnail';
COMMENT ON COLUMN model_removed_designs.result_thumbnail_storage_path IS 'Storage path of result thumbnail';
COMMENT ON COLUMN model_removed_designs.model_used IS 'AI model used for processing (gemini-3.1-flash-image-preview or gemini-2.0-flash-001)';

-- 3. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_model_removed_designs_user_id 
ON model_removed_designs(user_id);

CREATE INDEX IF NOT EXISTS idx_model_removed_designs_created_at 
ON model_removed_designs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_model_removed_designs_model_used 
ON model_removed_designs(model_used);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE model_removed_designs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Users can only view their own model removed designs
CREATE POLICY "Users can view their own model removed designs"
ON model_removed_designs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own model removed designs
CREATE POLICY "Users can insert their own model removed designs"
ON model_removed_designs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own model removed designs
CREATE POLICY "Users can update their own model removed designs"
ON model_removed_designs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own model removed designs
CREATE POLICY "Users can delete their own model removed designs"
ON model_removed_designs
FOR DELETE
USING (auth.uid() = user_id);

-- 6. Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_model_removed_designs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_model_removed_designs_updated_at
BEFORE UPDATE ON model_removed_designs
FOR EACH ROW
EXECUTE FUNCTION update_model_removed_designs_updated_at();

-- 7. Storage cleanup is handled by client-side code
-- The storage.delete_object function doesn't exist in Supabase by default
-- So we handle deletion in the application code instead

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_delete_model_removed_design_images ON model_removed_designs;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS delete_model_removed_design_images();

-- ============================================
-- Verification Query (للتحقق من إنشاء الجدول)
-- ============================================
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'model_removed_designs';

