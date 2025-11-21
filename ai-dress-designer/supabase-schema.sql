-- ============================================
-- Yasmine Al-Sham Smart Designer - Database Schema
-- ============================================
-- هذا الملف يحتوي على جميع الجداول والسياسات اللازمة لنظام المصادقة
-- قومي بنسخ هذا الكود ولصقه في Supabase SQL Editor
-- ============================================

-- 1. إنشاء جدول الملفات الشخصية للمستخدمات (User Profiles)
-- هذا الجدول يخزن معلومات إضافية عن المستخدمات
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. إنشاء جدول التصاميم المحفوظة (Saved Designs)
-- هذا الجدول يخزن جميع التصاميم التي أنشأتها المستخدمات
CREATE TABLE IF NOT EXISTS public.designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  original_description TEXT NOT NULL,
  enhanced_prompt TEXT NOT NULL,
  image_url TEXT,
  image_data TEXT,
  questionnaire_answers JSONB,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. إنشاء فهارس (Indexes) لتحسين الأداء
CREATE INDEX IF NOT EXISTS designs_user_id_idx ON public.designs(user_id);
CREATE INDEX IF NOT EXISTS designs_created_at_idx ON public.designs(created_at DESC);
CREATE INDEX IF NOT EXISTS designs_is_favorite_idx ON public.designs(is_favorite) WHERE is_favorite = true;

-- 4. تفعيل Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- 5. سياسات الأمان للملفات الشخصية (Profiles Policies)

-- السماح للمستخدمات بقراءة ملفاتهن الشخصية فقط
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- السماح للمستخدمات بتحديث ملفاتهن الشخصية فقط
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- السماح بإنشاء ملف شخصي عند التسجيل
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. سياسات الأمان للتصاميم (Designs Policies)

-- السماح للمستخدمات بقراءة تصاميمهن فقط
CREATE POLICY "Users can view their own designs"
  ON public.designs
  FOR SELECT
  USING (auth.uid() = user_id);

-- السماح للمستخدمات بإنشاء تصاميم جديدة
CREATE POLICY "Users can create their own designs"
  ON public.designs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- السماح للمستخدمات بتحديث تصاميمهن فقط
CREATE POLICY "Users can update their own designs"
  ON public.designs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- السماح للمستخدمات بحذف تصاميمهن فقط
CREATE POLICY "Users can delete their own designs"
  ON public.designs
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. إنشاء دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. إنشاء Triggers لتحديث updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_designs
  BEFORE UPDATE ON public.designs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 9. إنشاء دالة لإنشاء ملف شخصي تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. إنشاء Trigger لإنشاء ملف شخصي عند التسجيل
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- انتهى! الآن قاعدة البيانات جاهزة للاستخدام
-- ============================================

