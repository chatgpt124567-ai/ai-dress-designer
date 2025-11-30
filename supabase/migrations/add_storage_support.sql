-- ============================================
-- Migration: Add Storage Support for Images
-- ============================================
-- This migration adds support for storing images in Supabase Storage
-- instead of Base64 strings in the database
-- ============================================

-- 1. Add new columns for storage-based images
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 2. Add comments to new columns
COMMENT ON COLUMN designs.storage_path IS 'Path to full-size image in Supabase Storage (e.g., designs/user-id/design-id.jpg)';
COMMENT ON COLUMN designs.thumbnail_storage_path IS 'Path to thumbnail image in Supabase Storage (e.g., designs/user-id/thumbnails/design-id.jpg)';
COMMENT ON COLUMN designs.thumbnail_url IS 'Public URL to thumbnail image for fast loading in gallery';

-- 3. Create index on storage_path for faster lookups
CREATE INDEX IF NOT EXISTS idx_designs_storage_path 
ON designs(storage_path) 
WHERE storage_path IS NOT NULL;

-- 4. Create a storage bucket for design images (if not exists)
-- Note: This needs to be run in Supabase Dashboard or via API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('design-images', 'design-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- 5. Add RLS policies for storage bucket
-- Note: These need to be configured in Supabase Dashboard under Storage > Policies

-- Policy: Users can upload their own design images
-- CREATE POLICY "Users can upload design images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'design-images' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Policy: Users can view their own design images
-- CREATE POLICY "Users can view their design images"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'design-images' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Policy: Users can delete their own design images
-- CREATE POLICY "Users can delete their design images"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'design-images' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- 6. Create a function to clean up storage when design is deleted
CREATE OR REPLACE FUNCTION delete_design_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete full-size image from storage
  IF OLD.storage_path IS NOT NULL THEN
    PERFORM storage.delete_object('design-images', OLD.storage_path);
  END IF;
  
  -- Delete thumbnail from storage
  IF OLD.thumbnail_storage_path IS NOT NULL THEN
    PERFORM storage.delete_object('design-images', OLD.thumbnail_storage_path);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to auto-delete images when design is deleted
DROP TRIGGER IF EXISTS cleanup_design_images ON designs;
CREATE TRIGGER cleanup_design_images
  BEFORE DELETE ON designs
  FOR EACH ROW
  EXECUTE FUNCTION delete_design_images();

-- ============================================
-- Migration Complete!
-- ============================================
-- Next steps:
-- 1. Create 'design-images' bucket in Supabase Dashboard
-- 2. Set bucket to public
-- 3. Configure RLS policies for the bucket
-- 4. Update application code to use storage instead of base64
-- ============================================

