# نماذج Google Gemini المتاحة - Available Gemini Models

## 🎯 النموذج المستخدم في التطبيق

التطبيق يستخدم **`gemini-2.5-flash`** لكل من:
- ✅ تحسين البرومبت (Prompt Enhancement)
- ✅ توليد الصور (Image Generation)

---

## 📋 النماذج المتاحة في Gemini API

### 1. **gemini-2.5-flash** ⭐ (المستخدم حالياً)

**المميزات**:
- ✅ أحدث نموذج من Google (الإصدار 2.5)
- ✅ سريع جداً (Flash)
- ✅ يدعم توليد الصور
- ✅ يدعم معالجة النصوص المتقدمة
- ✅ مجاني مع حصة سخية

**الاستخدام**:
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

**الحدود**:
- 15 طلب/دقيقة (مجاناً)
- 1500 طلب/يوم (مجاناً)

---

### 2. **gemini-2.0-flash-exp** (نموذج تجريبي سابق)

**الحالة**: متوفر ولكن `gemini-2.5-flash` أحدث وأفضل

**البديل الموصى به**: استخدم `gemini-2.5-flash` للحصول على أحدث التحسينات

---

### 3. **gemini-1.5-flash** ❌ (غير متوفر في v1beta)

**الحالة**: غير متوفر في API version v1beta

**الخطأ**:
```
[404 Not Found] models/gemini-1.5-flash is not found for API version v1beta
```

**البديل**: استخدم `gemini-2.5-flash` بدلاً منه

---

### 4. **gemini-1.5-pro**

**المميزات**:
- ✅ نموذج احترافي
- ✅ جودة عالية جداً
- ⚠️ أبطأ من Flash
- ⚠️ أغلى من Flash

**الاستخدام**:
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
```

**متى تستخدمه**:
- عندما تحتاج جودة أعلى
- عندما السرعة ليست أولوية
- للمهام المعقدة جداً

---

### 5. **gemini-pro**

**الحالة**: نموذج قديم، يُفضل استخدام `gemini-1.5-pro` أو `gemini-2.5-flash`

---

## 🔄 كيفية تغيير النموذج

### الخيار 1: gemini-2.5-flash (الحالي) ⭐

**الأفضل لـ**: السرعة والتوازن بين الجودة والتكلفة

```typescript
// في app/api/enhance-prompt/route.ts
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// في app/api/generate-image/route.ts
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

---

### الخيار 2: gemini-1.5-pro

**الأفضل لـ**: الجودة القصوى (أبطأ وأغلى)

```typescript
// في app/api/enhance-prompt/route.ts
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// في app/api/generate-image/route.ts
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
```

---

## 💰 التسعير والحدود

### الحصة المجانية:

| النموذج | الطلبات/دقيقة | الطلبات/يوم | التكلفة |
|---------|---------------|-------------|---------|
| gemini-2.5-flash | 15 | 1500 | مجاني |
| gemini-2.0-flash-exp | 15 | 1500 | مجاني |
| gemini-1.5-pro | 2 | 50 | مجاني |

### الخطة المدفوعة:

راجع: https://ai.google.dev/pricing

---

## 🧪 اختبار النماذج المتاحة

### طريقة 1: استخدام API

```bash
curl https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY
```

### طريقة 2: من خلال SDK

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

async function listModels() {
  const models = await genAI.listModels();
  console.log('Available models:');
  for (const model of models) {
    console.log(`- ${model.name}`);
  }
}

listModels();
```

---

## ❓ الأسئلة الشائعة

### س: لماذا لا يعمل gemini-1.5-flash؟

**ج**: النموذج غير متوفر في API version v1beta. استخدم `gemini-2.0-flash-exp` بدلاً منه.

### س: هل gemini-2.5-flash مجاني؟

**ج**: نعم، مع حصة مجانية سخية (15 طلب/دقيقة، 1500 طلب/يوم). راجع التسعير للتأكد من الحدود الحالية.

### س: أيهما أفضل: Flash أم Pro؟

**ج**: 
- **Flash**: أسرع، أرخص، جودة جيدة جداً - **مناسب لمعظم الحالات**
- **Pro**: أبطأ، أغلى، جودة ممتازة - **للمهام المعقدة جداً**

### س: هل يمكنني استخدام نموذج مختلف لكل API؟

**ج**: نعم! يمكنك استخدام:
- `gemini-2.5-flash` لتحسين البرومبت (سريع وحديث)
- `gemini-1.5-pro` لتوليد الصور (جودة أعلى)

---

## 🔗 موارد إضافية

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Available Models](https://ai.google.dev/models/gemini)
- [Pricing](https://ai.google.dev/pricing)
- [API Reference](https://ai.google.dev/api)

---

**آخر تحديث**: 2025-11-17
**النموذج الموصى به**: `gemini-2.5-flash` ⭐

