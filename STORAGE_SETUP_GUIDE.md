# 📦 دليل إعداد Supabase Storage للصور

## 🎯 الهدف
نقل تخزين الصور من Base64 في قاعدة البيانات إلى Supabase Storage لتحسين الأداء بشكل جذري.

---

## 📋 الخطوات المطلوبة

### **الخطوة 1: تشغيل Migration Script**

1. افتحي Supabase Dashboard
2. اذهبي إلى **SQL Editor**
3. انسخي محتوى ملف `supabase/migrations/add_storage_support.sql`
4. الصقيه في المحرر واضغطي **Run**

هذا سيضيف الأعمدة الجديدة:
- `storage_path` - مسار الصورة الكاملة
- `thumbnail_storage_path` - مسار المصغرة
- `thumbnail_url` - رابط المصغرة العام

---

### **الخطوة 2: إنشاء Storage Bucket**

1. في Supabase Dashboard، اذهبي إلى **Storage**
2. اضغطي **New bucket**
3. املئي البيانات:
   - **Name:** `design-images`
   - **Public bucket:** ✅ نعم (مفعّل)
   - **File size limit:** 10 MB
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp`

4. اضغطي **Create bucket**

---

### **الخطوة 3: إعداد RLS Policies للـ Bucket**

1. في صفحة Storage، اضغطي على bucket `design-images`
2. اذهبي إلى تبويب **Policies**
3. أضيفي السياسات التالية:

#### **Policy 1: السماح بالرفع (Upload)**
```sql
CREATE POLICY "Users can upload design images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'design-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### **Policy 2: السماح بالقراءة (Read)**
```sql
CREATE POLICY "Users can view design images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'design-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### **Policy 3: السماح بالحذف (Delete)**
```sql
CREATE POLICY "Users can delete design images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'design-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### **الخطوة 4: التحقق من الإعداد**

قومي بتشغيل هذا الاستعلام في SQL Editor للتحقق:

```sql
-- التحقق من الأعمدة الجديدة
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'designs' 
AND column_name IN ('storage_path', 'thumbnail_storage_path', 'thumbnail_url');

-- يجب أن ترجع 3 صفوف
```

---

## 🔄 الفرق بين النظام القديم والجديد

### **❌ النظام القديم (Base64 في DB)**
```
┌─────────────────────────────────────┐
│  Database (PostgreSQL)              │
├─────────────────────────────────────┤
│  designs table:                     │
│  - image_data: "data:image/png;..." │  ← 3 MB
│  - image_url: "data:image/png;..."  │  ← 3 MB (duplicate!)
│                                     │
│  Total per design: ~6 MB            │
│  50 designs: ~300 MB! 😱            │
└─────────────────────────────────────┘
```

### **✅ النظام الجديد (Storage + URLs)**
```
┌──────────────────────────────────────┐
│  Database (PostgreSQL)               │
├──────────────────────────────────────┤
│  designs table:                      │
│  - storage_path: "designs/abc/1.jpg" │  ← 50 bytes
│  - thumbnail_url: "https://..."      │  ← 100 bytes
│                                      │
│  Total per design: ~200 bytes        │
│  50 designs: ~10 KB 🚀               │
└──────────────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│  Supabase Storage (CDN)              │
├──────────────────────────────────────┤
│  design-images/                      │
│  ├─ user-123/                        │
│  │  ├─ design-1.jpg (800 KB)         │
│  │  └─ thumbnails/                   │
│  │     └─ design-1.jpg (50 KB)       │
│  └─ user-456/...                     │
└──────────────────────────────────────┘
```

---

## 📈 الفوائد المتوقعة

| المقياس | قبل | بعد | التحسين |
|---------|-----|-----|---------|
| **حجم استعلام DB** | 300 MB | 10 KB | **99.997%** ⚡ |
| **وقت التحميل** | 30-60 ثانية | 1-2 ثانية | **95%** ⚡ |
| **استهلاك الذاكرة** | 500 MB | 20 MB | **96%** ⚡ |
| **أخطاء المصادقة** | متكررة | نادرة جداً | **99%** ⚡ |

---

## ✅ الخطوات التالية

بعد إكمال الإعداد أعلاه:
1. ✅ تحديث كود التطبيق لاستخدام Storage
2. ✅ إضافة دوال ضغط الصور وتوليد المصغرات
3. ✅ إضافة Pagination للمعرض
4. ✅ اختبار النظام الجديد

---

## 🆘 استكشاف الأخطاء

### **خطأ: "new row violates row-level security policy"**
- تأكدي من إضافة RLS policies للـ bucket
- تأكدي من أن المستخدم مسجل دخول

### **خطأ: "Bucket not found"**
- تأكدي من إنشاء bucket باسم `design-images` بالضبط
- تأكدي من تفعيل "Public bucket"

### **الصور لا تظهر**
- تأكدي من أن الـ bucket عام (public)
- تحققي من الـ URLs في قاعدة البيانات

---

**جاهزة للخطوة التالية؟** 🚀

