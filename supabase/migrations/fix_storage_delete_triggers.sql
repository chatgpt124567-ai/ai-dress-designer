-- ============================================
-- Migration: Fix Storage Delete Triggers
-- ============================================
-- This migration removes triggers that use the non-existent 
-- storage.delete_object function in Supabase.
-- Storage cleanup is now handled by client-side code.
-- ============================================

-- Run this SQL in your Supabase SQL Editor to fix the deletion errors

-- 1. Drop the trigger for designs table
DROP TRIGGER IF EXISTS cleanup_design_images ON designs;

-- 2. Drop the function for designs
DROP FUNCTION IF EXISTS delete_design_images();

-- 3. Drop the trigger for modified_designs table
DROP TRIGGER IF EXISTS cleanup_modified_design_images ON modified_designs;

-- 4. Drop the function for modified_designs
DROP FUNCTION IF EXISTS delete_modified_design_images();

-- 5. Drop the trigger for model_removed_designs table
DROP TRIGGER IF EXISTS trigger_delete_model_removed_design_images ON model_removed_designs;

-- 6. Drop the function for model_removed_designs
DROP FUNCTION IF EXISTS delete_model_removed_design_images();

-- ============================================
-- Verification (run this after applying the fix)
-- ============================================
-- SELECT tgname FROM pg_trigger WHERE tgname LIKE '%design%';
-- This should return empty or only update triggers, not delete triggers


