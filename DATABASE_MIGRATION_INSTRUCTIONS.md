# تعليمات تطبيق Database Migration

## ⚠️ مهم جداً: يجب تطبيق هذا الـ Migration لحل خطأ Auto-save

الخطأ الذي تراه:
```
Auto-save error: {}
```

السبب: عمود `model_used` غير موجود في جدول `designs` في قاعدة البيانات.

---

## 🔧 الحل: تطبيق Migration

### الطريقة الأولى: عبر Supabase Dashboard (الأسهل) ✅

1. **افتح Supabase Dashboard:**
   - اذهب إلى: https://supabase.com/dashboard
   - اختر مشروعك

2. **افتح SQL Editor:**
   - من القائمة الجانبية، اضغط على **SQL Editor**

3. **انسخ والصق الكود التالي:**
   ```sql
   -- Add model_used column to designs table
   ALTER TABLE designs 
   ADD COLUMN IF NOT EXISTS model_used TEXT DEFAULT 'google/gemini-3.1-flash-image-preview';

   -- Add comment to model_used column
   COMMENT ON COLUMN designs.model_used IS 'AI model used for design generation (e.g., google/gemini-3.1-flash-image-preview or google/gemini-3-pro-image-preview)';

   -- Update existing rows to have default model
   UPDATE designs 
   SET model_used = 'google/gemini-3.1-flash-image-preview'
   WHERE model_used IS NULL;

   -- Make model_used NOT NULL after setting defaults
   ALTER TABLE designs 
   ALTER COLUMN model_used SET NOT NULL;
   ```

4. **اضغط Run (أو Ctrl+Enter)**

5. **تحقق من النجاح:**
   - يجب أن ترى رسالة "Success. No rows returned"

---

### الطريقة الثانية: عبر Supabase CLI

إذا كان لديك Supabase CLI مثبت:

```bash
npx supabase db push
```

---

## ✅ التحقق من نجاح التطبيق

بعد تطبيق الـ migration، قم بما يلي:

1. **أعد تحميل الصفحة** في المتصفح
2. **جرب إنشاء تصميم جديد**
3. **تحقق من عدم ظهور خطأ "Auto-save error"**

---

## 📋 ملفات Migration الأخرى (اختيارية)

إذا لم تكن قد طبقت migrations السابقة، قد تحتاج أيضاً إلى:

### 1. Migration للتصاميم المعدلة:
الملف: `supabase/migrations/create_modified_designs_table.sql`

### 2. Migration لدعم Storage:
الملف: `supabase/migrations/add_storage_support.sql`

---

## 🆘 إذا واجهت مشاكل

### خطأ: "column already exists"
- هذا يعني أن العمود موجود بالفعل
- لا داعي للقلق، يمكنك تجاهل هذا الخطأ

### خطأ: "permission denied"
- تأكد من أنك مسجل دخول كـ Owner للمشروع في Supabase

### خطأ آخر
- تحقق من أن اسم الجدول `designs` موجود في قاعدة البيانات
- تحقق من أن لديك صلاحيات الكتابة على قاعدة البيانات

---

## 📞 الدعم

إذا استمرت المشكلة بعد تطبيق الـ migration، أخبرني بالخطأ الذي تراه.

