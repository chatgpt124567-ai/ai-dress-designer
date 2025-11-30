-- ============================================
-- Migration: Create Modified Designs Table
-- ============================================
-- This migration creates a separate table for storing modified/edited designs
-- ============================================

-- 1. Create modified_designs table
CREATE TABLE IF NOT EXISTS public.modified_designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Original image information
  original_image_url TEXT,
  original_storage_path TEXT,
  
  -- Modified image information
  modified_image_url TEXT NOT NULL,
  modified_storage_path TEXT,
  modified_thumbnail_url TEXT,
  modified_thumbnail_storage_path TEXT,
  
  -- Modification details
  modification_request TEXT NOT NULL,
  model_used TEXT NOT NULL, -- e.g., 'google/gemini-2.5-flash-image'
  
  -- Optional: Reference to original design if it was from our system
  original_design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add comments to columns
COMMENT ON TABLE modified_designs IS 'Stores modified/edited dress designs created from external images or existing designs';
COMMENT ON COLUMN modified_designs.original_image_url IS 'URL of the original uploaded image';
COMMENT ON COLUMN modified_designs.original_storage_path IS 'Storage path of original image if uploaded to our storage';
COMMENT ON COLUMN modified_designs.modified_image_url IS 'Public URL of the AI-modified image';
COMMENT ON COLUMN modified_designs.modified_storage_path IS 'Storage path of modified full-size image';
COMMENT ON COLUMN modified_designs.modified_thumbnail_url IS 'Public URL of modified image thumbnail';
COMMENT ON COLUMN modified_designs.modified_thumbnail_storage_path IS 'Storage path of modified thumbnail';
COMMENT ON COLUMN modified_designs.modification_request IS 'User description of requested modifications';
COMMENT ON COLUMN modified_designs.model_used IS 'AI model used for modification (gemini-2.5-flash-image or gemini-3-pro-image-preview)';
COMMENT ON COLUMN modified_designs.original_design_id IS 'Reference to original design if it was from our designs table';

-- 3. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_modified_designs_user_id 
ON modified_designs(user_id);

CREATE INDEX IF NOT EXISTS idx_modified_designs_created_at 
ON modified_designs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_modified_designs_model_used 
ON modified_designs(model_used);

CREATE INDEX IF NOT EXISTS idx_modified_designs_original_design_id 
ON modified_designs(original_design_id) 
WHERE original_design_id IS NOT NULL;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE modified_designs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Users can only view their own modified designs
CREATE POLICY "Users can view their own modified designs"
ON modified_designs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own modified designs
CREATE POLICY "Users can insert their own modified designs"
ON modified_designs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own modified designs
CREATE POLICY "Users can update their own modified designs"
ON modified_designs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own modified designs
CREATE POLICY "Users can delete their own modified designs"
ON modified_designs
FOR DELETE
USING (auth.uid() = user_id);

-- 6. Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_designs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_modified_designs_updated_at_trigger ON modified_designs;
CREATE TRIGGER update_modified_designs_updated_at_trigger
  BEFORE UPDATE ON modified_designs
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_designs_updated_at();

-- 7. Create function to clean up storage when modified design is deleted
CREATE OR REPLACE FUNCTION delete_modified_design_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete modified full-size image from storage
  IF OLD.modified_storage_path IS NOT NULL THEN
    PERFORM storage.delete_object('design-images', OLD.modified_storage_path);
  END IF;
  
  -- Delete modified thumbnail from storage
  IF OLD.modified_thumbnail_storage_path IS NOT NULL THEN
    PERFORM storage.delete_object('design-images', OLD.modified_thumbnail_storage_path);
  END IF;
  
  -- Delete original image from storage if it was uploaded to our storage
  IF OLD.original_storage_path IS NOT NULL THEN
    PERFORM storage.delete_object('design-images', OLD.original_storage_path);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger to auto-delete images when modified design is deleted
DROP TRIGGER IF EXISTS cleanup_modified_design_images ON modified_designs;
CREATE TRIGGER cleanup_modified_design_images
  BEFORE DELETE ON modified_designs
  FOR EACH ROW
  EXECUTE FUNCTION delete_modified_design_images();

-- 9. Grant permissions
GRANT ALL ON modified_designs TO authenticated;
GRANT ALL ON modified_designs TO service_role;

