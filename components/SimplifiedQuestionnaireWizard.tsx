'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { QuestionnaireAnswers } from '@/types';
import Button from './Button';
import ProgressBar from './ProgressBar';
import QuestionStep from './QuestionStep';
import SkirtPreviewModal from './SkirtPreviewModal';
import MultiEmbellishmentPlacementModal from './MultiEmbellishmentPlacementModal';
import TransparentPartsPlacementModal from './TransparentPartsPlacementModal';

interface SimplifiedQuestionnaireWizardProps {
  onSubmit: (answers: QuestionnaireAnswers) => void;
  loading?: boolean;
  initialAnswers?: QuestionnaireAnswers;
  onAnswersChange?: (answers: QuestionnaireAnswers) => void;
}

const STORAGE_STEP_KEY = 'ai_dress_designer_simplified_current_step';

export default function SimplifiedQuestionnaireWizard({
  onSubmit,
  loading = false,
  initialAnswers,
  onAnswersChange
}: SimplifiedQuestionnaireWizardProps) {
  const { t, direction } = useLanguage();
  // تم تحديث عدد الأسئلة إلى 10 بعد إضافة سؤال أسلوب التصميم
  const totalSteps = 10; // 10 أسئلة لقسم تصميم باستخدام قماشك الخاص
  const containerRef = useRef<HTMLDivElement>(null);

  // تهيئة الخطوة الحالية بقيمة افتراضية لتجنب مشاكل الـ hydration
  const [currentStep, setCurrentStep] = useState(1);

  // متابعة ما إذا تم تحميل الخطوة المحفوظة لمنع التحديثات غير الضرورية
  const [hasLoadedSavedStep, setHasLoadedSavedStep] = useState(false);

  // حالة نافذة معاينة شكل التنورة
  const [skirtPreviewModalOpen, setSkirtPreviewModalOpen] = useState(false);
  const [selectedSkirtForPreview, setSelectedSkirtForPreview] = useState<string>('');

  // حالة نافذة تحديد أماكن الزينة المتعددة
  const [multiEmbellishmentModalOpen, setMultiEmbellishmentModalOpen] = useState(false);

  // حالة نافذة تحديد أماكن الأجزاء الشفافة
  const [transparentPartsModalOpen, setTransparentPartsModalOpen] = useState(false);

  // Load saved step from localStorage after component mounts (client-side only)
  useEffect(() => {
    if (hasLoadedSavedStep) return;

    try {
      const saved = localStorage.getItem(STORAGE_STEP_KEY);
      if (saved) {
        const step = parseInt(saved, 10);
        if (step >= 1 && step <= totalSteps) {
          setCurrentStep(step);
          console.log('✅ Restored saved simplified step:', step);
        }
      }
      setHasLoadedSavedStep(true);
    } catch (error) {
      console.error('Error loading saved simplified step:', error);
      setHasLoadedSavedStep(true);
    }
  }, [hasLoadedSavedStep, totalSteps]);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    if (!hasLoadedSavedStep) return;

    try {
      localStorage.setItem(STORAGE_STEP_KEY, currentStep.toString());
      console.log('💾 Saved simplified current step:', currentStep);
    } catch (error) {
      console.error('Error saving simplified current step:', error);
    }
  }, [currentStep, hasLoadedSavedStep]);

  const [answers, setAnswers] = useState<QuestionnaireAnswers>(
    initialAnswers || {
      dressType: '',
      dressLength: '',
      skirtShape: '',
      necklineType: '',
      sleeveType: '',
      fabricType: 'custom', // Required field - set to 'custom' for own fabric workflow
      hasTransparentParts: 'no',
      embellishments: [],
      primaryColor: '',
      hasAdditionalColors: 'no',
    }
  );

  // Notify parent of answer changes
  useEffect(() => {
    if (onAnswersChange) {
      onAnswersChange(answers);
    }
  }, [answers, onAnswersChange]);

  const updateAnswer = (key: keyof QuestionnaireAnswers, value: string | string[], customValue?: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [key]: value };
      if (customValue !== undefined) {
        const customKey = `${key}Custom` as keyof QuestionnaireAnswers;
        updated[customKey] = customValue as any;
      }
      return updated;
    });
  };

  // Scroll to top when step changes
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // دالة فتح نافذة معاينة شكل التنورة
  const handleSkirtPreview = (skirtType: string) => {
    setSelectedSkirtForPreview(skirtType);
    setSkirtPreviewModalOpen(true);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      // التحقق من الأجزاء الشفافة في السؤال 6
      if (currentStep === 6) {
        // إذا اختار المستخدم "نعم" للأجزاء الشفافة ولم يحدد المواقع بعد
        if (answers.transparentParts === 'yes') {
          const selectedLocations = answers.transparentPartsLocation?.split(',').filter(Boolean) || [];
          if (selectedLocations.length === 0) {
            setTransparentPartsModalOpen(true);
            return; // لا تنتقل حتى يتم تحديد المواقع
          }
        }
      }

      // التحقق من الزينة المتعددة في السؤال 7 (الإضافات والزينة)
      if (currentStep === 7) {
        const selectedEmbs = Array.isArray(answers.embellishments)
          ? answers.embellishments
          : (answers.embellishments ? [answers.embellishments] : []);
        // استبعاد 'other' و 'belt' و 'none' - لا تحتاج لتحديد مكان
        const activeEmbs = selectedEmbs.filter(e => e !== 'other' && e !== 'belt' && e !== 'none');

        // إذا تم اختيار أي زينة وأماكنها غير محددة، عرض نافذة التحديد
        if (activeEmbs.length >= 1) {
          const allPlacementsFilled = activeEmbs.every(
            (emb) => answers.embellishmentPlacements?.[emb] && answers.embellishmentPlacements[emb].trim() !== ''
          );

          if (!allPlacementsFilled) {
            setMultiEmbellishmentModalOpen(true);
            return; // لا تنتقل حتى يتم إكمال النافذة
          }
        }
      }

      setCurrentStep(currentStep + 1);
      scrollToTop();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollToTop();
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
    scrollToTop();
  };

  const handleSubmit = () => {
    // Clear saved step when submitting
    try {
      localStorage.removeItem(STORAGE_STEP_KEY);
      console.log('✅ Cleared saved simplified step on submit');
    } catch (error) {
      console.error('Error clearing saved simplified step:', error);
    }
    onSubmit(answers);
  };

  const renderQuestion = () => {
    switch (currentStep) {
      case 1: // Dress Type
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section1.title')}
            questionText={t('questionnaire.section1.q1.question')}
            questionType="radio"
            options={[
              { value: 'evening', labelKey: 'questionnaire.section1.q1.options.evening' },
              { value: 'wedding', labelKey: 'questionnaire.section1.q1.options.wedding' },
              { value: 'engagement', labelKey: 'questionnaire.section1.q1.options.engagement' },
              { value: 'party', labelKey: 'questionnaire.section1.q1.options.party' },
              { value: 'other', labelKey: 'questionnaire.section1.q1.options.other', hasCustomInput: true },
            ]}
            value={answers.dressType}
            customValue={answers.dressTypeCustom}
            onChange={(value, customValue) => updateAnswer('dressType', value as string, customValue)}
            onAutoAdvance={handleNext}
          />
        );

      case 2: // Dress Length
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section1.title')}
            questionText={t('questionnaire.section1.q3.question')}
            questionType="radio"
            options={[
              { value: 'knee', labelKey: 'questionnaire.section1.q3.options.knee' },
              { value: 'floor', labelKey: 'questionnaire.section1.q3.options.floor' },
              { value: 'train', labelKey: 'questionnaire.section1.q3.options.train' },
              { value: 'other', labelKey: 'questionnaire.section1.q3.options.other', hasCustomInput: true },
            ]}
            value={answers.dressLength}
            customValue={answers.dressLengthCustom}
            onChange={(value, customValue) => updateAnswer('dressLength', value as string, customValue)}
            onAutoAdvance={handleNext}
          />
        );

      case 3: // شكل التنورة - نسخة من السؤال 5 في قسم ابتكري تصميمك
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section2.title')}
            questionText={t('questionnaire.section2.q4.question')}
            questionType="radio"
            options={[
              // خيارات محدثة من قسم ابتكري تصميمك الخاص (السؤال 5)
              { value: 'straight', labelKey: 'questionnaire.section2.q4.options.straight' },
              { value: 'tight', labelKey: 'questionnaire.section2.q4.options.tight' },
              { value: 'pleated', labelKey: 'questionnaire.section2.q4.options.pleated' },
              { value: 'puffy', labelKey: 'questionnaire.section2.q4.options.puffy' },
              { value: 'layered', labelKey: 'questionnaire.section2.q4.options.layered' },
              { value: 'mermaidTail', labelKey: 'questionnaire.section2.q4.options.mermaidTail' },
              { value: 'overskirt', labelKey: 'questionnaire.section2.q4.options.overskirt' },
              { value: 'peplum', labelKey: 'questionnaire.section2.q4.options.peplum' },
              { value: 'sideDrape', labelKey: 'questionnaire.section2.q4.options.sideDrape' },
              { value: 'other', labelKey: 'questionnaire.section2.q4.options.other', hasCustomInput: true },
            ]}
            value={answers.skirtShape}
            customValue={answers.skirtShapeCustom}
            onChange={(value, customValue) => updateAnswer('skirtShape', value as string, customValue)}
            onAutoAdvance={handleNext}
            enableSkirtPreview={true}
            onSkirtPreview={handleSkirtPreview}
            skirtPreviewOptions={['sideDrape', 'peplum', 'overskirt', 'mermaidTail', 'layered']}
          />
        );

      case 4: // Neckline Type
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section3.title')}
            questionText={t('questionnaire.section3.q5.question')}
            questionType="radio"
            options={[
              { value: 'vNeck', labelKey: 'questionnaire.section3.q5.options.vNeck' },
              { value: 'round', labelKey: 'questionnaire.section3.q5.options.round' },
              { value: 'sweetheart', labelKey: 'questionnaire.section3.q5.options.sweetheart' },
              { value: 'offShoulder', labelKey: 'questionnaire.section3.q5.options.offShoulder' },
              { value: 'high', labelKey: 'questionnaire.section3.q5.options.high' },
              { value: 'oneShoulder', labelKey: 'questionnaire.section3.q5.options.oneShoulder' },
              { value: 'strapless', labelKey: 'questionnaire.section3.q5.options.strapless' },
              { value: 'square', labelKey: 'questionnaire.section3.q5.options.square' },
              { value: 'other', labelKey: 'questionnaire.section3.q5.options.other', hasCustomInput: true },
            ]}
            value={answers.necklineType}
            customValue={answers.necklineTypeCustom}
            onChange={(value, customValue) => updateAnswer('necklineType', value as string, customValue)}
            onAutoAdvance={handleNext}
          />
        );

      case 5: // Sleeve Type
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section3.title')}
            questionText={t('questionnaire.section3.q6.question')}
            questionType="radio"
            options={[
              { value: 'sleeveless', labelKey: 'questionnaire.section3.q6.options.sleeveless' },
              { value: 'short', labelKey: 'questionnaire.section3.q6.options.short' },
              { value: 'long', labelKey: 'questionnaire.section3.q6.options.long' },
              { value: 'sheer', labelKey: 'questionnaire.section3.q6.options.sheer' },
              { value: 'puff', labelKey: 'questionnaire.section3.q6.options.puff' },
              { value: 'offShoulder', labelKey: 'questionnaire.section3.q6.options.offShoulder' },
              { value: 'lace', labelKey: 'questionnaire.section3.q6.options.lace' },
              { value: 'other', labelKey: 'questionnaire.section3.q6.options.other', hasCustomInput: true },
            ]}
            value={answers.sleeveType}
            customValue={answers.sleeveTypeCustom}
            onChange={(value, customValue) => updateAnswer('sleeveType', value as string, customValue)}
            onAutoAdvance={handleNext}
          />
        );

      case 6: // Transparent Parts
        const selectedTransparentLocations = answers.transparentPartsLocation?.split(',').filter(Boolean) || [];
        const transparentLocationLabels: { [key: string]: { ar: string; en: string } } = {
          sleeves: { ar: 'الأكمام', en: 'Sleeves' },
          back: { ar: 'الظهر', en: 'Back' },
          chest: { ar: 'الصدر', en: 'Chest' },
          sides: { ar: 'الجوانب', en: 'Sides' },
          waist: { ar: 'الخصر', en: 'Waist' },
          neckline: { ar: 'خط العنق', en: 'Neckline' },
          skirt: { ar: 'التنورة', en: 'Skirt' },
          hem: { ar: 'الذيل/الحاشية', en: 'Hem/Train' },
        };

        return (
          <div className="space-y-6">
            <QuestionStep
              sectionTitle={t('questionnaire.section5.title')}
              questionText={t('questionnaire.section5.q9.question')}
              questionType="yesno"
              value={answers.transparentParts || ''}
              onChange={(value) => {
                updateAnswer('transparentParts', value as string);
                // إذا اختار "لا"، امسح المواقع المحددة
                if (value === 'no') {
                  setAnswers(prev => ({ ...prev, transparentPartsLocation: '' }));
                }
              }}
              placeholder={t('questionnaire.section5.q9.placeholder')}
              onAutoAdvance={handleNext}
            />

            {/* عرض المواقع المختارة إذا كانت موجودة */}
            {answers.transparentParts === 'yes' && selectedTransparentLocations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-accent-gold/10 border-2 border-accent-gold rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-primary text-sm">
                    {direction === 'rtl' ? 'أماكن الأجزاء الشفافة:' : 'Transparent Parts Locations:'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransparentPartsModalOpen(true)}
                    className="text-xs"
                  >
                    {t('common.edit')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTransparentLocations.map(loc => (
                    <span key={loc} className="px-3 py-1 bg-accent-gold/20 text-primary rounded-full text-sm">
                      {direction === 'rtl'
                        ? transparentLocationLabels[loc]?.ar || loc
                        : transparentLocationLabels[loc]?.en || loc}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        );

      case 7: // الزينة والإضافات - نسخة من السؤال 8 في قسم ابتكري تصميمك
        // استخراج الإضافات المحددة
        const selectedEmbellishments = Array.isArray(answers.embellishments)
          ? answers.embellishments
          : (answers.embellishments ? [answers.embellishments] : []);
        const activeEmbellishments = selectedEmbellishments.filter(e => e !== 'other' && e !== 'belt' && e !== 'none');

        return (
          <div className="space-y-6">
            {/* تلميح حول الاختيار المتعدد */}
            <div className="text-sm text-accent-gold bg-accent-gold/10 px-4 py-2 rounded-lg">
              {t('questionnaire.section6.q9.multiSelectHint')}
            </div>

            <QuestionStep
              sectionTitle={t('questionnaire.section6.title')}
              questionText={t('questionnaire.section6.q9.question')}
              questionType="checkbox"
              options={[
                // خيارات محدثة من قسم ابتكري تصميمك الخاص (السؤال 8)
                { value: 'sequins', labelKey: 'questionnaire.section6.q9.options.sequins' },
                { value: 'stones', labelKey: 'questionnaire.section6.q9.options.stones' },
                { value: 'pearls', labelKey: 'questionnaire.section6.q9.options.pearls' },
                { value: 'embroideryBeads', labelKey: 'questionnaire.section6.q9.options.embroideryBeads' },
                { value: 'decorativeLace', labelKey: 'questionnaire.section6.q9.options.decorativeLace' },
                { value: '3dFlowers', labelKey: 'questionnaire.section6.q9.options.3dFlowers' },
                { value: 'feathers', labelKey: 'questionnaire.section6.q9.options.feathers' },
                { value: 'bow', labelKey: 'questionnaire.section6.q9.options.bow' },
                { value: 'ruffles', labelKey: 'questionnaire.section6.q9.options.ruffles' },
                { value: 'belt', labelKey: 'questionnaire.section6.q9.options.belt' },
                { value: 'other', labelKey: 'questionnaire.section6.q9.options.other', hasCustomInput: true },
              ]}
              value={selectedEmbellishments}
              customValue={answers.embellishmentsCustom}
              onChange={(value, customValue) => updateAnswer('embellishments', value, customValue)}
              // لا يوجد انتقال تلقائي للاختيار المتعدد - المستخدم يضغط التالي
            />

            {/* عرض ملخص الأماكن إذا تم تحديد أي إضافة */}
            {activeEmbellishments.length > 0 &&
             Object.keys(answers.embellishmentPlacements || {}).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-accent-gold/10 border-2 border-accent-gold rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-primary text-sm">
                    {direction === 'rtl' ? 'أماكن الإضافات:' : 'Embellishment Placements:'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMultiEmbellishmentModalOpen(true)}
                    className="text-xs"
                  >
                    {t('common.edit')}
                  </Button>
                </div>
                {activeEmbellishments.map(emb => (
                  answers.embellishmentPlacements?.[emb] && (
                    <p key={emb} className="text-sm text-gray-600">
                      <span className="font-medium text-accent-gold">
                        {t(`questionnaire.section6.q9.options.${emb}`)}:
                      </span>{' '}
                      {answers.embellishmentPlacements[emb]}
                    </p>
                  )
                ))}
              </motion.div>
            )}
          </div>
        );

      case 8: // أسلوب التصميم - نسخة من السؤال 9 في قسم ابتكري تصميمك
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section8.title')}
            questionText={t('questionnaire.section8.q14.question')}
            questionType="radio"
            options={[
              // خيارات مطابقة للسؤال 9 من قسم ابتكري تصميمك الخاص
              { value: 'classic', labelKey: 'questionnaire.section8.q14.options.classic' },
              { value: 'modern', labelKey: 'questionnaire.section8.q14.options.modern' },
              { value: 'romantic', labelKey: 'questionnaire.section8.q14.options.romantic' },
              { value: 'glamorous', labelKey: 'questionnaire.section8.q14.options.glamorous' },
              { value: 'boho', labelKey: 'questionnaire.section8.q14.options.boho' },
              { value: 'dramatic', labelKey: 'questionnaire.section8.q14.options.dramatic' },
              { value: 'minimalist', labelKey: 'questionnaire.section8.q14.options.minimalist' },
              { value: 'other', labelKey: 'questionnaire.section8.q14.options.other', hasCustomInput: true },
            ]}
            value={answers.designStyle || ''}
            customValue={answers.designStyleCustom}
            onChange={(value, customValue) => updateAnswer('designStyle', value as string, customValue)}
            onAutoAdvance={handleNext}
          />
        );

      case 9: // مقاس الجسم
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section6.title')}
            questionText={t('questionnaire.section6.q10.question')}
            questionType="radio"
            options={[
              { value: 'xs', labelKey: 'questionnaire.section6.q10.options.xs' },
              { value: 's', labelKey: 'questionnaire.section6.q10.options.s' },
              { value: 'm', labelKey: 'questionnaire.section6.q10.options.m' },
              { value: 'l', labelKey: 'questionnaire.section6.q10.options.l' },
              { value: 'xl', labelKey: 'questionnaire.section6.q10.options.xl' },
              { value: 'xxl', labelKey: 'questionnaire.section6.q10.options.xxl' },
              { value: 'other', labelKey: 'questionnaire.section6.q10.options.other', hasCustomInput: true },
            ]}
            value={answers.bodyType || ''}
            customValue={answers.bodyTypeCustom}
            onChange={(value, customValue) => updateAnswer('bodyType', value as string, customValue)}
            onAutoAdvance={handleNext}
          />
        );

      case 10: // تفاصيل إضافية
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section9.title')}
            questionText={t('questionnaire.section9.q16.question')}
            questionType="textarea"
            value={answers.additionalDetails || ''}
            onChange={(value) => updateAnswer('additionalDetails', value as string)}
            placeholder={t('questionnaire.section9.q16.placeholder')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="luxury-card p-4 md:p-6 lg:p-8">
      {/* Progress Bar */}
      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepClick={handleStepClick}
      />

      {/* Question Content */}
      <AnimatePresence mode="wait">
        <div key={currentStep} className="min-h-[300px] md:min-h-[400px]">
          {renderQuestion()}
        </div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className={cn('flex gap-3 md:gap-4 mt-6 md:mt-8', direction === 'rtl' ? 'flex-row-reverse' : '')}>
        {currentStep > 1 && (
          <Button
            variant="ghost"
            size="lg"
            onClick={handlePrevious}
            disabled={loading}
            className="flex-1 text-sm md:text-base"
          >
            {t('common.previous')}
          </Button>
        )}

        {currentStep < totalSteps ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleNext}
            disabled={loading}
            className="flex-1 text-sm md:text-base"
          >
            {t('common.next')}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 text-sm md:text-base"
          >
            {loading ? t('design.prompt.generating') : t('common.submit')}
          </Button>
        )}
      </div>

      {/* نافذة تحديد أماكن الزينة المتعددة */}
      <MultiEmbellishmentPlacementModal
        isOpen={multiEmbellishmentModalOpen}
        onClose={() => setMultiEmbellishmentModalOpen(false)}
        selectedEmbellishments={
          (Array.isArray(answers.embellishments) ? answers.embellishments : (answers.embellishments ? [answers.embellishments] : []))
            .filter(e => e !== 'other' && e !== 'belt' && e !== 'none')
        }
        embellishmentPlacements={answers.embellishmentPlacements || {}}
        onPlacementsChange={(placements) => {
          setAnswers(prev => ({
            ...prev,
            embellishmentPlacements: placements
          }));
          if (onAnswersChange) {
            onAnswersChange({
              ...answers,
              embellishmentPlacements: placements
            });
          }
        }}
        onConfirm={() => {
          // بعد تأكيد الأماكن، الانتقال للخطوة التالية
          setCurrentStep(currentStep + 1);
          scrollToTop();
        }}
      />

      {/* نافذة معاينة شكل التنورة */}
      <SkirtPreviewModal
        isOpen={skirtPreviewModalOpen}
        onClose={() => setSkirtPreviewModalOpen(false)}
        skirtType={selectedSkirtForPreview}
        skirtNameAr={selectedSkirtForPreview ? t(`questionnaire.section2.q4.options.${selectedSkirtForPreview}`) : ''}
        skirtNameEn={selectedSkirtForPreview ? t(`questionnaire.section2.q4.options.${selectedSkirtForPreview}`) : ''}
      />

      {/* نافذة تحديد أماكن الأجزاء الشفافة */}
      <TransparentPartsPlacementModal
        isOpen={transparentPartsModalOpen}
        onClose={() => setTransparentPartsModalOpen(false)}
        selectedLocations={answers.transparentPartsLocation?.split(',').filter(Boolean) || []}
        onLocationsChange={(locations) => {
          const locationString = locations.join(',');
          setAnswers(prev => ({
            ...prev,
            transparentPartsLocation: locationString
          }));
          if (onAnswersChange) {
            onAnswersChange({
              ...answers,
              transparentPartsLocation: locationString
            });
          }
        }}
        onConfirm={() => {
          // بعد تأكيد الأماكن، الانتقال للخطوة التالية
          setCurrentStep(currentStep + 1);
          scrollToTop();
        }}
      />
    </div>
  );
}


