'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkipForward, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { BatchDesignQuestionnaireAnswers } from '@/types';
import Button from './Button';
import ProgressBar from './ProgressBar';

interface BatchDesignQuestionnaireProps {
  onSubmit: (answers: BatchDesignQuestionnaireAnswers) => void;
  onBack?: () => void;
  loading?: boolean;
}

// أنواع الأسئلة مع حقل النص المخصص
type QuestionId = 'dressTypes' | 'dressLengths' | 'embellishments' | 'designStyles' | 'backStyles';
type CustomFieldId = 'dressTypesCustom' | 'dressLengthsCustom' | 'embellishmentsCustom' | 'designStylesCustom' | 'backStylesCustom';

interface QuestionConfig {
  id: QuestionId;
  customFieldId: CustomFieldId;
  sectionTitleKey: string;
  questionKey: string;
  options: Array<{
    value: string;
    labelKey: string;
  }>;
}

const MAX_SELECTIONS = 5;

export default function BatchDesignQuestionnaire({
  onSubmit,
  onBack,
  loading = false,
}: BatchDesignQuestionnaireProps) {
  const { t, direction } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [answers, setAnswers] = useState<BatchDesignQuestionnaireAnswers>({
    dressTypes: [],
    dressLengths: [],
    embellishments: [],
    designStyles: [],
    backStyles: [],
  });

  // حالة النص المخصص لكل سؤال
  const [customTexts, setCustomTexts] = useState<Record<CustomFieldId, string>>({
    dressTypesCustom: '',
    dressLengthsCustom: '',
    embellishmentsCustom: '',
    designStylesCustom: '',
    backStylesCustom: '',
  });

  // تكوين الأسئلة الخمسة مع خيار "وصف آخر"
  const questions: QuestionConfig[] = [
    {
      id: 'dressTypes',
      customFieldId: 'dressTypesCustom',
      sectionTitleKey: 'questionnaire.section1.title',
      questionKey: 'questionnaire.section1.q1.question',
      options: [
        { value: 'evening', labelKey: 'questionnaire.section1.q1.options.evening' },
        { value: 'wedding', labelKey: 'questionnaire.section1.q1.options.wedding' },
        { value: 'engagement', labelKey: 'questionnaire.section1.q1.options.engagement' },
        { value: 'party', labelKey: 'questionnaire.section1.q1.options.party' },
        { value: 'other', labelKey: 'questionnaire.section1.q1.options.other' },
      ],
    },
    {
      id: 'dressLengths',
      customFieldId: 'dressLengthsCustom',
      sectionTitleKey: 'questionnaire.section1.title',
      questionKey: 'questionnaire.section1.q2.question',
      options: [
        { value: 'knee', labelKey: 'questionnaire.section1.q2.options.knee' },
        { value: 'long', labelKey: 'questionnaire.section1.q2.options.long' },
        { value: 'floor', labelKey: 'questionnaire.section1.q2.options.floor' },
        { value: 'train', labelKey: 'questionnaire.section1.q2.options.train' },
        { value: 'other', labelKey: 'questionnaire.section1.q2.options.other' },
      ],
    },
    {
      id: 'embellishments',
      customFieldId: 'embellishmentsCustom',
      sectionTitleKey: 'questionnaire.section6.title',
      questionKey: 'questionnaire.section6.q9.question',
      options: [
        { value: 'sequins', labelKey: 'questionnaire.section6.q9.options.sequins' },
        { value: 'stones', labelKey: 'questionnaire.section6.q9.options.stones' },
        { value: 'pearls', labelKey: 'questionnaire.section6.q9.options.pearls' },
        { value: 'embroideryBeads', labelKey: 'questionnaire.section6.q9.options.embroideryBeads' },
        { value: 'decorativeLace', labelKey: 'questionnaire.section6.q9.options.decorativeLace' },
        { value: '3dFlowers', labelKey: 'questionnaire.section6.q9.options.3dFlowers' },
        { value: 'feathers', labelKey: 'questionnaire.section6.q9.options.feathers' },
        { value: 'bow', labelKey: 'questionnaire.section6.q9.options.bow' },
        { value: 'ruffles', labelKey: 'questionnaire.section6.q9.options.ruffles' },
        { value: 'other', labelKey: 'questionnaire.section6.q9.options.other' },
      ],
    },
    {
      id: 'designStyles',
      customFieldId: 'designStylesCustom',
      sectionTitleKey: 'questionnaire.section8.title',
      questionKey: 'questionnaire.section8.q14.question',
      options: [
        { value: 'classic', labelKey: 'questionnaire.section8.q14.options.classic' },
        { value: 'modern', labelKey: 'questionnaire.section8.q14.options.modern' },
        { value: 'romantic', labelKey: 'questionnaire.section8.q14.options.romantic' },
        { value: 'glamorous', labelKey: 'questionnaire.section8.q14.options.glamorous' },
        { value: 'boho', labelKey: 'questionnaire.section8.q14.options.boho' },
        { value: 'dramatic', labelKey: 'questionnaire.section8.q14.options.dramatic' },
        { value: 'minimalist', labelKey: 'questionnaire.section8.q14.options.minimalist' },
        { value: 'other', labelKey: 'questionnaire.section8.q14.options.other' },
      ],
    },
    {
      id: 'backStyles',
      customFieldId: 'backStylesCustom',
      sectionTitleKey: 'questionnaire.section4.title',
      questionKey: 'questionnaire.section4.q7.question',
      options: [
        { value: 'covered', labelKey: 'questionnaire.section4.q7.options.covered' },
        { value: 'openBack', labelKey: 'questionnaire.section4.q7.options.openBack' },
        { value: 'deepV', labelKey: 'questionnaire.section4.q7.options.deepV' },
        { value: 'keyhole', labelKey: 'questionnaire.section4.q7.options.keyhole' },
        { value: 'illusion', labelKey: 'questionnaire.section4.q7.options.illusion' },
        { value: 'laceBack', labelKey: 'questionnaire.section4.q7.options.laceBack' },
        { value: 'lowBack', labelKey: 'questionnaire.section4.q7.options.lowBack' },
        { value: 'crossBack', labelKey: 'questionnaire.section4.q7.options.crossBack' },
        { value: 'bowBack', labelKey: 'questionnaire.section4.q7.options.bowBack' },
        { value: 'corsetBack', labelKey: 'questionnaire.section4.q7.options.corsetBack' },
        { value: 'other', labelKey: 'questionnaire.section4.q7.options.other' },
      ],
    },
  ];

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // التنقل المباشر إلى سؤال محدد
  const handleStepClick = (step: number) => {
    if (step >= 1 && step <= totalSteps && step !== currentStep) {
      setCurrentStep(step);
      scrollToTop();
    }
  };

  const handleOptionToggle = (questionId: QuestionId, value: string) => {
    setAnswers((prev) => {
      const currentValues = prev[questionId] || [];
      if (currentValues.includes(value)) {
        // إذا كان الخيار "other" وتم إلغاء تحديده، امسح النص المخصص
        if (value === 'other') {
          const customFieldId = questions.find(q => q.id === questionId)?.customFieldId;
          if (customFieldId) {
            setCustomTexts(prev => ({ ...prev, [customFieldId]: '' }));
          }
        }
        return { ...prev, [questionId]: currentValues.filter((v) => v !== value) };
      }
      if (currentValues.length >= MAX_SELECTIONS) {
        return prev; // لا تضف المزيد إذا وصلنا للحد الأقصى
      }
      return { ...prev, [questionId]: [...currentValues, value] };
    });
  };

  // معالجة تغيير النص المخصص
  const handleCustomTextChange = (customFieldId: CustomFieldId, value: string) => {
    setCustomTexts(prev => ({ ...prev, [customFieldId]: value }));
  };

  const handleSkip = () => {
    // تخطي السؤال الحالي (ترك الإجابة فارغة)
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      scrollToTop();
    } else {
      handleSubmit();
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      scrollToTop();
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollToTop();
    } else if (onBack) {
      onBack();
    }
  };

  const handleSubmit = () => {
    // دمج الإجابات مع النصوص المخصصة
    const finalAnswers: BatchDesignQuestionnaireAnswers = {
      ...answers,
      dressTypesCustom: customTexts.dressTypesCustom || undefined,
      dressLengthsCustom: customTexts.dressLengthsCustom || undefined,
      embellishmentsCustom: customTexts.embellishmentsCustom || undefined,
      designStylesCustom: customTexts.designStylesCustom || undefined,
      backStylesCustom: customTexts.backStylesCustom || undefined,
    };
    onSubmit(finalAnswers);
  };

  const currentQuestion = questions[currentStep - 1];
  const currentAnswers = answers[currentQuestion.id] || [];
  const isOtherSelected = currentAnswers.includes('other');
  const currentCustomText = customTexts[currentQuestion.customFieldId] || '';

  return (
    <div ref={containerRef} className="luxury-card p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* شريط التقدم مع إمكانية التنقل المباشر */}
      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepClick={handleStepClick}
      />

      {/* عنوان الميزة */}
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-primary mb-2">
          {direction === 'rtl' ? '5 تصاميم دفعة واحدة' : '5 Designs at Once'}
        </h2>
        <p className="text-sm text-neutral-600">
          {direction === 'rtl'
            ? `اختاري ما يصل إلى ${MAX_SELECTIONS} خيارات لكل سؤال، أو تخطي للانتقال للسؤال التالي`
            : `Select up to ${MAX_SELECTIONS} options per question, or skip to move on`}
        </p>
      </div>

      {/* السؤال الحالي */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: direction === 'rtl' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction === 'rtl' ? 20 : -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[300px] md:min-h-[350px]"
        >
          {/* عنوان القسم */}
          <div className="mb-4">
            <span className="text-xs font-medium text-accent-gold uppercase tracking-wide">
              {t(currentQuestion.sectionTitleKey)}
            </span>
          </div>

          {/* نص السؤال */}
          <h3 className="text-lg md:text-xl font-semibold text-primary mb-2">
            {t(currentQuestion.questionKey)}
          </h3>

          {/* تلميح الاختيار المتعدد */}
          <p className="text-sm text-accent-gold bg-accent-gold/10 px-3 py-2 rounded-lg mb-4">
            {direction === 'rtl'
              ? `يمكنك اختيار حتى ${MAX_SELECTIONS} خيارات (${currentAnswers.length}/${MAX_SELECTIONS})`
              : `You can select up to ${MAX_SELECTIONS} options (${currentAnswers.length}/${MAX_SELECTIONS})`}
          </p>

          {/* خيارات السؤال */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((option) => {
              const isSelected = currentAnswers.includes(option.value);
              const isDisabled = !isSelected && currentAnswers.length >= MAX_SELECTIONS;

              return (
                <motion.button
                  key={option.value}
                  onClick={() => !isDisabled && handleOptionToggle(currentQuestion.id, option.value)}
                  whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                  disabled={isDisabled}
                  className={cn(
                    'relative p-4 rounded-xl border-2 text-start transition-all',
                    isSelected
                      ? 'border-accent-gold bg-accent-gold/10 shadow-md'
                      : 'border-gray-200 hover:border-accent-gold/50 bg-white',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* مربع الاختيار */}
                    <div
                      className={cn(
                        'w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0',
                        isSelected ? 'bg-accent-gold border-accent-gold' : 'border-gray-300'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {/* نص الخيار */}
                    <span className={cn('font-medium', isSelected ? 'text-primary' : 'text-gray-700')}>
                      {t(option.labelKey)}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* حقل النص المخصص عند اختيار "وصف آخر" */}
          <AnimatePresence>
            {isOtherSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {direction === 'rtl' ? 'يرجى وصف ما تريدينه:' : 'Please describe what you want:'}
                </label>
                <textarea
                  value={currentCustomText}
                  onChange={(e) => handleCustomTextChange(currentQuestion.customFieldId, e.target.value)}
                  placeholder={direction === 'rtl' ? 'اكتبي وصفك هنا...' : 'Type your description here...'}
                  className={cn(
                    'w-full p-3 border-2 rounded-xl resize-none transition-all',
                    'border-accent-gold/50 focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20',
                    'bg-white text-gray-800 placeholder-gray-400',
                    'min-h-[100px]',
                    direction === 'rtl' ? 'text-right' : 'text-left'
                  )}
                  dir={direction}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* أزرار التنقل */}
      <div className={cn('flex gap-3 mt-6', direction === 'rtl' ? 'flex-row-reverse' : '')}>
        {/* زر الرجوع */}
        <Button
          variant="ghost"
          size="lg"
          onClick={handlePrevious}
          disabled={loading}
          className="flex-1"
        >
          {direction === 'rtl' ? (
            <>
              <ChevronRight className="w-4 h-4 ml-1" />
              {currentStep === 1 && onBack ? t('common.back') : t('common.previous')}
            </>
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-1" />
              {currentStep === 1 && onBack ? t('common.back') : t('common.previous')}
            </>
          )}
        </Button>

        {/* زر التخطي */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleSkip}
          disabled={loading}
          className="flex-1 text-gray-600 border-gray-300 hover:border-gray-400"
        >
          <SkipForward className="w-4 h-4 mr-1" />
          {direction === 'rtl' ? 'تخطي' : 'Skip'}
        </Button>

        {/* زر التالي/الإرسال */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleNext}
          disabled={loading}
          className="flex-1"
        >
          {currentStep < totalSteps ? (
            direction === 'rtl' ? (
              <>
                {t('common.next')}
                <ChevronLeft className="w-4 h-4 mr-1" />
              </>
            ) : (
              <>
                {t('common.next')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )
          ) : loading ? (
            direction === 'rtl' ? 'جاري التوليد...' : 'Generating...'
          ) : (
            direction === 'rtl' ? 'توليد التصاميم' : 'Generate Designs'
          )}
        </Button>
      </div>
    </div>
  );
}

