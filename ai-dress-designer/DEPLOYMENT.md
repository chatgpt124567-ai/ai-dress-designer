# دليل النشر - Deployment Guide

## 🚀 نشر التطبيق على Vercel

Vercel هي أفضل منصة لنشر تطبيقات Next.js (من نفس الشركة المطورة لـ Next.js).

### الخطوات:

#### 1. إنشاء حساب على Vercel
1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول باستخدام GitHub أو GitLab أو Bitbucket

#### 2. رفع المشروع على GitHub
```bash
# في مجلد المشروع
git init
git add .
git commit -m "Initial commit: AI Dress Designer"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

**مهم**: تأكد من أن `.env.local` في `.gitignore` (موجود بالفعل)

#### 3. استيراد المشروع في Vercel
1. اذهب إلى [vercel.com/new](https://vercel.com/new)
2. اختر "Import Git Repository"
3. اختر المشروع من GitHub
4. انقر "Import"

#### 4. إضافة متغيرات البيئة
في صفحة إعدادات المشروع:
1. اذهب إلى "Environment Variables"
2. أضف المتغيرات التالية:

```
OPENAI_API_KEY = sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_GEMINI_API_KEY = AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 5. النشر
1. انقر "Deploy"
2. انتظر 2-3 دقائق
3. سيكون التطبيق متاحاً على رابط مثل: `your-app.vercel.app`

---

## 🌐 نشر على منصات أخرى

### Netlify

#### الخطوات:
1. اذهب إلى [netlify.com](https://netlify.com)
2. سجل دخول وانقر "Add new site"
3. اختر "Import an existing project"
4. اختر المشروع من GitHub
5. أضف متغيرات البيئة في "Site settings" → "Environment variables"
6. انقر "Deploy"

**ملاحظة**: قد تحتاج إلى إضافة `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Railway

#### الخطوات:
1. اذهب إلى [railway.app](https://railway.app)
2. سجل دخول وانقر "New Project"
3. اختر "Deploy from GitHub repo"
4. اختر المشروع
5. أضف متغيرات البيئة
6. انقر "Deploy"

### Render

#### الخطوات:
1. اذهب إلى [render.com](https://render.com)
2. سجل دخول وانقر "New +"
3. اختر "Web Service"
4. اتصل بـ GitHub واختر المشروع
5. أضف متغيرات البيئة
6. انقر "Create Web Service"

---

## 🔧 إعدادات النشر

### Build Command
```bash
npm run build
```

### Start Command
```bash
npm start
```

### Node Version
```
18.x أو أحدث
```

---

## 📊 مراقبة الأداء

### Vercel Analytics
1. في لوحة تحكم Vercel
2. اذهب إلى "Analytics"
3. فعّل Analytics لمراقبة الأداء

### تكاليف API
1. راقب استخدام OpenAI في [platform.openai.com/usage](https://platform.openai.com/usage)
2. راقب استخدام Gemini في [Google Cloud Console](https://console.cloud.google.com)

---

## 🔒 الأمان في الإنتاج

### 1. حماية مفاتيح API
- ✅ استخدم متغيرات البيئة فقط
- ✅ لا تضع المفاتيح في الكود
- ✅ لا ترفع `.env.local` على Git

### 2. تحديد معدل الطلبات (Rate Limiting)
أضف Rate Limiting لحماية API:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // أضف Rate Limiting هنا
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### 3. مراقبة التكاليف
- ضع حد أقصى للإنفاق في OpenAI
- راقب الاستخدام يومياً
- فعّل تنبيهات الفواتير

---

## 🐛 استكشاف أخطاء النشر

### خطأ: "Build failed"
**الحل**:
- تحقق من أن جميع المكتبات مثبتة
- تحقق من عدم وجود أخطاء TypeScript
- شغّل `npm run build` محلياً للتأكد

### خطأ: "API not working in production"
**الحل**:
- تحقق من إضافة متغيرات البيئة في المنصة
- تحقق من صحة المفاتيح
- راجع Logs في لوحة التحكم

### خطأ: "Timeout"
**الحل**:
- زد من Timeout في إعدادات المنصة
- Vercel: 10 ثوانٍ (مجاني)، 60 ثانية (Pro)

---

## 📈 تحسينات الإنتاج

### 1. Caching
أضف Caching للبرومبتات المتشابهة

### 2. CDN
استخدم CDN للصور (Vercel يوفر هذا تلقائياً)

### 3. Compression
فعّل Compression للصور والملفات

### 4. Monitoring
استخدم أدوات مثل:
- Vercel Analytics
- Google Analytics
- Sentry (لتتبع الأخطاء)

---

## ✅ Checklist قبل النشر

- [ ] اختبار التطبيق محلياً
- [ ] التأكد من عدم وجود أخطاء TypeScript
- [ ] إضافة متغيرات البيئة في المنصة
- [ ] اختبار API Routes
- [ ] التأكد من `.env.local` في `.gitignore`
- [ ] إضافة README واضح
- [ ] اختبار التطبيق على أجهزة مختلفة
- [ ] إعداد مراقبة التكاليف

---

**حظاً موفقاً في النشر! 🚀**

