-- ============================================
-- Database Updates for AI Dress Designer
-- ============================================
-- تحديثات قاعدة البيانات لمصمم ياسمين الشام الذكي
-- ============================================

-- ============================================
-- Part 1: Update designs table for embellishment placement
-- الجزء الأول: تحديث جدول designs لإضافة موضع الزينة
-- ============================================

-- Add embellishment_placement column to designs table
-- إضافة عمود موضع الزينة إلى جدول التصاميم
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS embellishment_placement TEXT;

-- Add is_favorite column to designs table
-- إضافة عمود المفضلة إلى جدول التصاميم
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Add comment to embellishment_placement column
-- إضافة تعليق توضيحي لعمود موضع الزينة
COMMENT ON COLUMN designs.embellishment_placement IS 'Specific placement of embellishments on the dress (e.g., on the bodice, sleeves, hem)';

-- Add comment to is_favorite column
-- إضافة تعليق توضيحي لعمود المفضلة
COMMENT ON COLUMN designs.is_favorite IS 'Whether this design is marked as favorite by the user';

-- ============================================
-- Part 2: Update profiles table for user profile features
-- الجزء الثاني: تحديث جدول profiles لميزات البروفايل الشخصي
-- ============================================

-- Add full_name column to profiles table
-- إضافة عمود الاسم الكامل إلى جدول الملفات الشخصية
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add avatar_url column to profiles table
-- إضافة عمود رابط صورة البروفايل إلى جدول الملفات الشخصية
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add preferred_language column to profiles table
-- إضافة عمود اللغة المفضلة إلى جدول الملفات الشخصية
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'ar';

-- Add comments to new columns
-- إضافة تعليقات توضيحية للأعمدة الجديدة
COMMENT ON COLUMN profiles.full_name IS 'User full name';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user profile picture';
COMMENT ON COLUMN profiles.preferred_language IS 'User preferred language (ar or en)';

-- ============================================
-- Part 3: Create indexes for better performance
-- الجزء الثالث: إنشاء فهارس لتحسين الأداء
-- ============================================

-- Create index on designs.is_favorite for faster filtering
-- إنشاء فهرس على is_favorite لتسريع الفلترة
CREATE INDEX IF NOT EXISTS idx_designs_is_favorite 
ON designs(user_id, is_favorite) 
WHERE is_favorite = true;

-- Create index on designs.created_at for faster sorting
-- إنشاء فهرس على created_at لتسريع الترتيب
CREATE INDEX IF NOT EXISTS idx_designs_created_at 
ON designs(user_id, created_at DESC);

-- ============================================
-- Part 4: Update Row Level Security (RLS) policies
-- الجزء الرابع: تحديث سياسات أمان الصفوف (RLS)
-- ============================================

-- Ensure RLS is enabled on designs table
-- التأكد من تفعيل RLS على جدول التصاميم
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
-- حذف السياسات الموجودة إن وجدت (لإعادة إنشائها)
DROP POLICY IF EXISTS "Users can view their own designs" ON designs;
DROP POLICY IF EXISTS "Users can insert their own designs" ON designs;
DROP POLICY IF EXISTS "Users can update their own designs" ON designs;
DROP POLICY IF EXISTS "Users can delete their own designs" ON designs;

-- Policy: Users can view their own designs
-- سياسة: المستخدمات يمكنهن عرض تصاميمهن الخاصة فقط
CREATE POLICY "Users can view their own designs"
ON designs FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own designs
-- سياسة: المستخدمات يمكنهن إضافة تصاميم جديدة
CREATE POLICY "Users can insert their own designs"
ON designs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own designs
-- سياسة: المستخدمات يمكنهن تحديث تصاميمهن الخاصة فقط
CREATE POLICY "Users can update their own designs"
ON designs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own designs
-- سياسة: المستخدمات يمكنهن حذف تصاميمهن الخاصة فقط
CREATE POLICY "Users can delete their own designs"
ON designs FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- Part 5: Ensure profiles RLS policies
-- الجزء الخامس: التأكد من سياسات RLS للملفات الشخصية
-- ============================================

-- Ensure RLS is enabled on profiles table
-- التأكد من تفعيل RLS على جدول الملفات الشخصية
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
-- حذف السياسات الموجودة إن وجدت
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Policy: Users can view their own profile
-- سياسة: المستخدمات يمكنهن عرض ملفهن الشخصي
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
-- سياسة: المستخدمات يمكنهن تحديث ملفهن الشخصي
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- Verification Queries (للتحقق من التحديثات)
-- ============================================

-- Check if columns were added successfully
-- التحقق من إضافة الأعمدة بنجاح
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'designs' 
-- AND column_name IN ('embellishment_placement', 'is_favorite');

-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('full_name', 'avatar_url', 'preferred_language');

