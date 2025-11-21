# إعداد قاعدة بيانات Supabase - خطوات سريعة

## 📌 ملخص سريع

تم تطبيق نظام مصادقة كامل مع Supabase. يجب عليك تنفيذ أكواد SQL في قاعدة البيانات لإكمال الإعداد.

## 🚀 خطوات الإعداد (5 دقائق)

### الخطوة 1️⃣: افتحي Supabase Dashboard

1. اذهبي إلى: **https://supabase.com/dashboard**
2. سجلي دخولك
3. اختاري المشروع: **ugszpeinlqlxhejplqdh**

### الخطوة 2️⃣: افتحي SQL Editor

من القائمة الجانبية، اضغطي على:
```
🗄️ SQL Editor
```

### الخطوة 3️⃣: نفذي أكواد SQL

1. **انسخي** كل محتوى ملف `supabase-schema.sql`
2. **الصقيه** في SQL Editor
3. **اضغطي** زر **Run** (أو Ctrl+Enter)
4. **انتظري** رسالة "Success ✅"

### الخطوة 4️⃣: تحققي من الجداول

من القائمة الجانبية، اضغطي على:
```
📊 Table Editor
```

يجب أن تشاهدي جدولين جديدين:
- ✅ **profiles** (الملفات الشخصية)
- ✅ **designs** (التصاميم المحفوظة)

### الخطوة 5️⃣: شغلي التطبيق

```bash
npm run dev
```

افتحي المتصفح على: **http://localhost:3000**

## ✨ جاهز!

الآن يمكنك:
- ✅ إنشاء حساب جديد: `/auth/signup`
- ✅ تسجيل الدخول: `/auth/login`
- ✅ إنشاء تصاميم محمية: `/design`

---

## 📋 أكواد SQL المطلوبة

إذا لم تجدي ملف `supabase-schema.sql`، إليك الأكواد:

<details>
<summary>اضغطي هنا لعرض أكواد SQL</summary>

```sql
-- انسخي هذا الكود بالكامل والصقيه في Supabase SQL Editor

-- 1. إنشاء جدول الملفات الشخصية
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. إنشاء جدول التصاميم
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

-- 3. إنشاء فهارس
CREATE INDEX IF NOT EXISTS designs_user_id_idx ON public.designs(user_id);
CREATE INDEX IF NOT EXISTS designs_created_at_idx ON public.designs(created_at DESC);
CREATE INDEX IF NOT EXISTS designs_is_favorite_idx ON public.designs(is_favorite) WHERE is_favorite = true;

-- 4. تفعيل Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- 5. سياسات الأمان للملفات الشخصية
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. سياسات الأمان للتصاميم
CREATE POLICY "Users can view their own designs"
  ON public.designs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own designs"
  ON public.designs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own designs"
  ON public.designs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own designs"
  ON public.designs FOR DELETE
  USING (auth.uid() = user_id);

-- 7. دالة تحديث updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Triggers لتحديث updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_designs
  BEFORE UPDATE ON public.designs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 9. دالة إنشاء ملف شخصي تلقائياً
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

-- 10. Trigger لإنشاء ملف شخصي عند التسجيل
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

</details>

---

## 🆘 مشاكل شائعة

### ❌ خطأ: "relation does not exist"
**الحل:** لم يتم تنفيذ أكواد SQL. ارجعي للخطوة 3.

### ❌ خطأ: "Invalid API key"
**الحل:** تحققي من ملف `.env.local` وتأكدي من وجود:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ugszpeinlqlxhejplqdh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ❌ لا يتم إنشاء الملف الشخصي تلقائياً
**الحل:** تأكدي من تنفيذ Trigger `on_auth_user_created` (الخطوة 10 في أكواد SQL).

---

## 📚 مزيد من المعلومات

راجعي ملف `AUTHENTICATION_GUIDE.md` للحصول على دليل شامل.

---

**بالتوفيق! 🌟**

