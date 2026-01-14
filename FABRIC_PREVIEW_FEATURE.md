# ميزة معاينة الأقمشة البصرية - Fabric Preview Feature

## نظرة عامة | Overview

تم إضافة ميزة معاينة بصرية للأقمشة في السؤال رقم 2 من استبيان "ابتكري تصميمك". تتيح هذه الميزة للمستخدمات معاينة صور الأقمشة قبل اختيارها.

A visual fabric preview feature has been added to Question 2 of the "Create Your Design" questionnaire. This feature allows users to preview fabric images before selecting them.

## المكونات المضافة | Added Components

### 1. FabricPreviewModal.tsx
مكون نافذة منبثقة لعرض صور الأقمشة مع:
- تأثير ضبابي على الخلفية
- رسوم متحركة سلسة للفتح والإغلاق
- دعم RTL/LTR
- إمكانية الإغلاق بالضغط على Escape أو النقر خارج النافذة
- صورة احتياطية عند عدم توفر صورة القماش

A modal component for displaying fabric images with:
- Backdrop blur effect
- Smooth open/close animations
- RTL/LTR support
- Close on Escape key or click outside
- Fallback placeholder image

### 2. التعديلات على QuestionStep.tsx
- إضافة أيقونة معلومات (Info icon) بجانب كل خيار قماش
- دعم خاصية `enableFabricPreview` لتفعيل المعاينة
- دعم callback `onFabricPreview` لفتح النافذة المنبثقة

Modifications to QuestionStep.tsx:
- Added info icon next to each fabric option
- Support for `enableFabricPreview` prop
- Support for `onFabricPreview` callback

### 3. التعديلات على QuestionnaireWizard.tsx
- دمج `FabricPreviewModal` في الاستبيان
- إضافة state management للنافذة المنبثقة
- تفعيل المعاينة في السؤال رقم 2

Modifications to QuestionnaireWizard.tsx:
- Integration of `FabricPreviewModal`
- Added state management for modal
- Enabled preview in Question 2

## الترجمات | Translations

تم إضافة المفاتيح التالية في `ar.json` و `en.json`:

```json
"fabricPreview": {
  "title": "معاينة القماش" / "Fabric Preview",
  "imageAlt": "صورة قماش {{fabricName}}" / "{{fabricName}} fabric sample",
  "close": "إغلاق" / "Close"
}
```

## الصور المطلوبة | Required Images

يجب إضافة الصور التالية في `public/fabric-samples/`:

1. satin.jpg - ساتان
2. silk.jpg - حرير
3. chiffon.jpg - شيفون
4. tulle.jpg - تول
5. lace.jpg - دانتيل
6. velvet.jpg - مخمل
7. organza.jpg - أورغانزا
8. crepe.jpg - كريب

**المواصفات المطلوبة:**
- الصيغة: JPG, PNG, أو WebP
- الحجم الموصى به: 800x600 بكسل (نسبة 4:3)
- الجودة: عالية، صورة قريبة واضحة لنسيج القماش
- حجم الملف: محسّن للويب (< 500KB لكل صورة)

## كيفية الاستخدام | How to Use

1. المستخدمة تصل إلى السؤال رقم 2 (نوع القماش)
2. تظهر أيقونة معلومات ذهبية بجانب كل خيار قماش
3. عند النقر على الأيقونة، تفتح نافذة منبثقة تعرض صورة القماش
4. يمكن إغلاق النافذة بالنقر على زر الإغلاق، أو الضغط على Escape، أو النقر خارج النافذة

## الميزات التقنية | Technical Features

- ✅ دعم كامل للغة العربية والإنجليزية
- ✅ دعم RTL/LTR
- ✅ رسوم متحركة سلسة باستخدام Framer Motion
- ✅ تصميم متجاوب (Mobile-first)
- ✅ إمكانية الوصول (Accessibility)
- ✅ صورة احتياطية عند عدم توفر الصورة
- ✅ تحسين الأداء مع Next.js Image component

## الاختبار | Testing

للاختبار:
1. افتح الاستبيان
2. انتقل إلى السؤال رقم 2
3. انقر على أيقونة المعلومات بجانب أي قماش
4. تحقق من:
   - فتح النافذة المنبثقة بسلاسة
   - عرض الصورة بشكل صحيح
   - إمكانية الإغلاق بجميع الطرق
   - التصميم المتجاوب على الهاتف المحمول
   - دعم RTL في النسخة العربية

## ملاحظات | Notes

- الميزة لا تؤثر على عملية اختيار الإجابة
- يمكن للمستخدمة معاينة أي قماش دون الحاجة لاختياره
- الصور الاحتياطية (placeholder.svg) تظهر تلقائياً عند عدم توفر صورة القماش

