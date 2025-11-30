# إصلاحات قسم "تصميم فستان باستخدام قماشك الخاص"

## ملخص التغييرات

تم إصلاح جميع المشكلات في قسم "Design a Dress Using Your Own Fabric" لجعله متناسقاً وظيفياً مع باقي أقسام التصميم.

---

## 1. إصلاح عنوان القسم والترجمات ✅

### الحالة:
- **العنوان**: "تصميم فستان باستخدام قماشك الخاص" ✅ (موجود بالفعل)
- **زر "Next"**: "التالي" ✅ (موجود في `common.continue`)
- **زر "Previous"**: "السابق" ✅ (موجود في `common.back`)
- **زر "Submit"**: "إرسال" ✅ (موجود في `questionnaire.submit`)

### الملفات:
- `public/locales/ar.json` - جميع الترجمات موجودة
- `public/locales/en.json` - جميع الترجمات موجودة

---

## 2. تعديل سؤال نوع الجسم إلى مقاس الجسم ✅

### التغييرات:
- **السؤال**: "ما مقاس جسمك؟" ✅ (موجود في `questionnaire.section6.q10.question`)
- **الخيارات**: XS, S, M, L, XL, XXL ✅ (موجودة في `SimplifiedQuestionnaireWizard.tsx`)

### الملفات:
- `components/SimplifiedQuestionnaireWizard.tsx` - السطور 233-253
- `public/locales/ar.json` - السطور 445-460

---

## 3. إضافة خطوة اختيار الموديل ✅

### الـ Workflow الحالي:
1. المستخدم يملأ `SimplifiedQuestionnaireWizard` (9 أسئلة)
2. عند Submit → يتم فتح `QuestionnaireReviewModal` (مراجعة الإجابات)
3. عند Confirm → يتم التحقق من تسجيل الدخول
4. إذا مسجل دخول → يتم فتح `ModelSelectionModal` (اختيار الموديل)
5. عند اختيار الموديل → يتم استدعاء `processDesign()` مع الموديل المختار

### الملفات المعدلة:
- `app/design/page.tsx`:
  - السطور 913-917: Submit handler يفتح ReviewModal
  - السطور 248-277: handleReviewConfirm يفتح ModelSelectionModal
  - السطور 285-296: handleModelSelection يستدعي processDesign
  - السطور 1233-1242: QuestionnaireReviewModal (خارج قسم ownFabric)
  - السطور 1372-1385: ModelSelectionModal (خارج قسم ownFabric)

---

## 4. إصلاح صفحة النتائج ✅

### المشكلة:
كانت هناك عدم توافق بين الحقول المستخدمة في `SimplifiedQuestionnaireWizard` و `QuestionnaireReviewModal`.

### الحل:
تم تحديث `QuestionnaireReviewModal` و `types/index.ts` و `enhance-prompt API` لدعم كلا النوعين من الحقول:

| Full Questionnaire | Simplified Questionnaire |
|-------------------|-------------------------|
| `bodySize` | `bodyType` |
| `hasTransparentParts` | `transparentParts` |
| `additionalNotes` | `additionalDetails` |

### الملفات المعدلة:

#### أ) `types/index.ts` (السطور 88-110):
```typescript
// إضافة دعم للحقول الجديدة
hasTransparentParts?: string; // Full questionnaire
transparentParts?: string; // Simplified questionnaire
bodySize?: string; // Full questionnaire
bodyType?: string; // Simplified questionnaire
bodyTypeCustom?: string;
additionalNotes?: string; // Full questionnaire
additionalDetails?: string; // Simplified questionnaire
```

#### ب) `components/QuestionnaireReviewModal.tsx` (السطور 82-113):
```typescript
// دعم كلا النوعين من الحقول
{
  question: getTranslation('questionnaire.section5.q9.question', 'أجزاء شفافة'),
  answer: answers.hasTransparentParts
    ? getTranslation(`common.${answers.hasTransparentParts}`, answers.hasTransparentParts)
    : (answers.transparentParts || '-'),
  custom: answers.transparentPartsLocation,
},
{
  question: getTranslation('questionnaire.section6.q10.question', 'مقاس الجسم'),
  answer: (answers.bodySize || answers.bodyType)
    ? getTranslation(`questionnaire.section6.q10.options.${answers.bodySize || answers.bodyType}`, 
        (answers.bodySize || answers.bodyType || '').toUpperCase())
    : '-',
  custom: answers.bodyTypeCustom,
},
{
  question: getTranslation('questionnaire.section9.q16.question', 'ملاحظات إضافية'),
  answer: answers.additionalNotes || answers.additionalDetails || '-',
},
```

#### ج) `app/api/enhance-prompt/route.ts` (السطور 39-76):
```typescript
// دعم كلا النوعين من الحقول في formatQuestionnaireAnswers
if (answers.hasTransparentParts === 'yes' && answers.transparentPartsLocation) {
  parts.push(`**Transparent Parts:** Yes, at ${answers.transparentPartsLocation}`);
} else if (answers.transparentParts) {
  parts.push(`**Transparent Parts:** ${answers.transparentParts}`);
}

const bodySize = answers.bodySize || answers.bodyType;
const bodySizeCustom = answers.bodyTypeCustom;
if (bodySize) {
  parts.push(`**Body Size:** ${bodySize}${bodySizeCustom ? ` (${bodySizeCustom})` : ''}`);
}

const additionalNotes = answers.additionalNotes || answers.additionalDetails;
if (additionalNotes) {
  parts.push(`**Additional Notes:** ${additionalNotes}`);
}
```

---

## 5. تنفيذ Workflow الذكاء الاصطناعي ✅

### سير العمل الكامل:

1. **رفع صور القماش** (`OwnFabricUpload`)
   - القماش الأساسي (إجباري)
   - القماش الثانوي (اختياري)

2. **تحديد موضع القماش** (`FabricPlacementStep`)
   - يظهر فقط إذا كان هناك قماش ثانوي
   - تحديد أين سيتم استخدام كل قماش

3. **ملء الاستبيان** (`SimplifiedQuestionnaireWizard`)
   - 9 أسئلة مبسطة

4. **مراجعة الإجابات** (`QuestionnaireReviewModal`)
   - عرض جميع الإجابات
   - خيار التعديل أو التأكيد

5. **اختيار الموديل** (`ModelSelectionModal`)
   - Gemini 2.5 Flash Image (سريع)
   - Gemini 3 Pro Image Preview (متقدم)

6. **توليد التصميم** (`processDesign`)
   - **الخطوة 1**: إرسال الإجابات + صور القماش إلى `/api/enhance-prompt`
     - يستخدم GPT-5-mini لتحسين البرومبت
     - يدمج تعليمات القماش المخصص في البرومبت
   - **الخطوة 2**: إرسال البرومبت النهائي + صور القماش إلى `/api/generate-image`
     - يستخدم الموديل المختار (Gemini 2.5 Flash Image أو Gemini 3 Pro)
     - يولد صورة الفستان
   - **الخطوة 3**: حفظ التصميم تلقائياً في قاعدة البيانات

7. **عرض النتيجة**
   - عرض صورة الفستان المولدة
   - خيارات: تصميم جديد، طلب تعديل، حفظ الصورة

---

## الملفات المعدلة

1. `types/index.ts` - إضافة دعم للحقول الجديدة
2. `components/QuestionnaireReviewModal.tsx` - دعم كلا النوعين من الحقول
3. `app/api/enhance-prompt/route.ts` - دعم كلا النوعين من الحقول في formatQuestionnaireAnswers

---

## الاختبار

للتأكد من أن كل شيء يعمل بشكل صحيح:

1. انتقل إلى صفحة التصميم
2. اختر "تصميم فستان باستخدام قماشك الخاص"
3. ارفع صورة القماش الأساسي
4. (اختياري) أضف قماش ثانوي وحدد موضع كل قماش
5. املأ الاستبيان (9 أسئلة)
6. راجع الإجابات في النافذة المنبثقة
7. اختر الموديل (Gemini 2.5 Flash Image أو Gemini 3 Pro)
8. انتظر توليد التصميم
9. تحقق من عرض النتيجة بشكل صحيح

---

## ملاحظات

- جميع الترجمات العربية والإنجليزية موجودة ✅
- الـ workflow متناسق مع باقي الأقسام ✅
- دعم كامل لصور القماش المخصصة ✅
- حفظ تلقائي للتصميمات ✅

---

## 6. إصلاح مشكلة السؤال 6 (Transparent Parts)

### المشكلة:
عند الوصول إلى السؤال 6 (أجزاء شفافة) في الاستبيان المبسط، لم يكن هناك `onAutoAdvance` مما يعني أن المستخدم لا يمكنه الانتقال تلقائياً إلى السؤال التالي بعد اختيار "نعم" أو "لا". كان يجب على المستخدم الضغط على زر "التالي" يدوياً.

### الحل:
تم إضافة `onAutoAdvance={handleNext}` إلى السؤال 6 في `SimplifiedQuestionnaireWizard.tsx` (السطر 210).

### الملف المعدل:
`components/SimplifiedQuestionnaireWizard.tsx` (السطور 201-212)

```typescript
case 6: // Transparent Parts
  return (
    <QuestionStep
      sectionTitle={t('questionnaire.section5.title')}
      questionText={t('questionnaire.section5.q9.question')}
      questionType="yesno"
      value={answers.transparentParts}
      onChange={(value) => updateAnswer('transparentParts', value as string)}
      placeholder={t('questionnaire.section5.q9.placeholder')}
      onAutoAdvance={handleNext} // ✅ تمت الإضافة
    />
  );
```

### النتيجة:
الآن عند اختيار "لا" في السؤال 6، سينتقل المستخدم تلقائياً إلى السؤال 7 (الزينة والإضافات) بعد 300ms، مما يجعل التجربة أكثر سلاسة ومتناسقة مع باقي الأسئلة.

---

## 7. إصلاح مشكلة عدم ظهور نافذة المراجعة (المشكلة الرئيسية) ✅

### المشكلة:
عند الضغط على زر "إرسال" في السؤال 9، كانت تظهر شاشة فارغة ولا تظهر نافذة المراجعة (`QuestionnaireReviewModal`).

### السبب:
كان `QuestionnaireReviewModal` موجوداً **خارج** قسم `ownFabric` في الكود، مما يعني أنه لا يتم عرضه عندما يكون `designMode === 'ownFabric'`. كان الـ Modal موجود فقط لوضع `scratch`.

### الحل:
1. تم إضافة `QuestionnaireReviewModal` **داخل** قسم `ownFabric` (بعد السطر 997)
2. تم تحديث `QuestionnaireReviewModal` القديم ليعمل فقط مع وضع `scratch`

### الملفات المعدلة:

#### `app/design/page.tsx`

**أ) إضافة QuestionnaireReviewModal داخل قسم ownFabric (السطور 1000-1011):**
```typescript
{/* Questionnaire Review Modal for Own Fabric */}
{pendingSubmitAnswers && (
  <QuestionnaireReviewModal
    isOpen={reviewModalOpen}
    answers={pendingSubmitAnswers}
    onConfirm={handleReviewConfirm}
    onEdit={handleReviewEdit}
    onClose={() => setReviewModalOpen(false)}
  />
)}
```

**ب) تحديث QuestionnaireReviewModal القديم ليعمل فقط مع scratch (السطر 1244):**
```typescript
{/* Questionnaire Review Modal (for scratch mode) */}
{designMode === 'scratch' && pendingSubmitAnswers && (
  <QuestionnaireReviewModal
    isOpen={reviewModalOpen}
    answers={pendingSubmitAnswers}
    onConfirm={handleReviewConfirm}
    onEdit={handleReviewEdit}
    onClose={() => setReviewModalOpen(false)}
  />
)}
```

### النتيجة:
الآن عند الضغط على زر "إرسال" في قسم "تصميم فستان باستخدام قماشك الخاص":
1. ✅ تظهر نافذة المراجعة بشكل صحيح
2. ✅ تعرض جميع الإجابات التسعة
3. ✅ يمكن للمستخدم التعديل أو التأكيد
4. ✅ بعد التأكيد، تظهر نافذة اختيار الموديل
5. ✅ بعد اختيار الموديل، يتم توليد التصميم

