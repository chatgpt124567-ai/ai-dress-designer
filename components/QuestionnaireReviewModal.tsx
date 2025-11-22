'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Edit } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { QuestionnaireAnswers } from '@/types';
import Button from './Button';

interface QuestionnaireReviewModalProps {
  isOpen: boolean;
  answers: QuestionnaireAnswers;
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
}

export default function QuestionnaireReviewModal({
  isOpen,
  answers,
  onConfirm,
  onEdit,
  onClose,
}: QuestionnaireReviewModalProps) {
  const { t, direction } = useLanguage();

  // Helper function to safely get translated text with fallback
  const getTranslation = (key: string, fallback: string = '-'): string => {
    try {
      const translation = t(key);
      // If translation returns the key itself, it means translation is missing
      return translation === key ? fallback : translation;
    } catch (error) {
      console.warn(`Translation missing for key: ${key}`);
      return fallback;
    }
  };

  const reviewItems = [
    {
      question: getTranslation('questionnaire.section1.q1.question', 'نوع الفستان'),
      answer: answers.dressType
        ? getTranslation(`questionnaire.section1.q1.options.${answers.dressType}`, answers.dressType)
        : '-',
      custom: answers.dressTypeCustom,
    },
    {
      question: getTranslation('questionnaire.section1.q2.question', 'طول الفستان'),
      answer: answers.dressLength
        ? getTranslation(`questionnaire.section1.q2.options.${answers.dressLength}`, answers.dressLength)
        : '-',
      custom: answers.dressLengthCustom,
    },
    {
      question: getTranslation('questionnaire.section2.q4.question', 'شكل التنورة'),
      answer: answers.skirtShape
        ? getTranslation(`questionnaire.section2.q4.options.${answers.skirtShape}`, answers.skirtShape)
        : '-',
      custom: answers.skirtShapeCustom,
    },
    {
      question: getTranslation('questionnaire.section3.q5.question', 'نوع فتحة الرقبة'),
      answer: answers.necklineType
        ? getTranslation(`questionnaire.section3.q5.options.${answers.necklineType}`, answers.necklineType)
        : '-',
      custom: answers.necklineTypeCustom,
    },
    {
      question: getTranslation('questionnaire.section3.q6.question', 'نوع الأكمام'),
      answer: answers.sleeveType
        ? getTranslation(`questionnaire.section3.q6.options.${answers.sleeveType}`, answers.sleeveType)
        : '-',
      custom: answers.sleeveTypeCustom,
    },
    {
      question: getTranslation('questionnaire.section5.q8.question', 'نوع القماش'),
      answer: answers.fabricType
        ? getTranslation(`questionnaire.section5.q8.options.${answers.fabricType}`, answers.fabricType)
        : '-',
      custom: answers.fabricTypeCustom,
    },
    {
      question: getTranslation('questionnaire.section5.q9.question', 'أجزاء شفافة'),
      answer: answers.hasTransparentParts
        ? getTranslation(`common.${answers.hasTransparentParts}`, answers.hasTransparentParts)
        : '-',
      custom: answers.transparentPartsLocation,
    },
    {
      question: getTranslation('questionnaire.section6.q9.question', 'الزينة والإضافات'),
      answer: Array.isArray(answers.embellishments) && answers.embellishments.length > 0
        ? answers.embellishments.map(e =>
            getTranslation(`questionnaire.section6.q9.options.${e}`, e)
          ).join(direction === 'rtl' ? '، ' : ', ')
        : '-',
      custom: answers.embellishmentsCustom,
      placement: answers.embellishmentPlacement,
    },
    {
      question: getTranslation('questionnaire.section6.q10.question', 'مقاس الجسم'),
      answer: answers.bodySize
        ? getTranslation(`questionnaire.section6.q10.options.${answers.bodySize}`, answers.bodySize.toUpperCase())
        : '-',
    },
    {
      question: getTranslation('questionnaire.section6.q11.question', 'درجة اللمعان'),
      answer: answers.shineLevel
        ? getTranslation(`questionnaire.section6.q11.options.${answers.shineLevel}`, answers.shineLevel)
        : '-',
      custom: answers.shineLevelCustom,
    },
    {
      question: getTranslation('questionnaire.section7.q12.question', 'اللون الأساسي'),
      answer: answers.primaryColor || '-',
    },
    {
      question: getTranslation('questionnaire.section9.q16.question', 'ملاحظات إضافية'),
      answer: answers.additionalNotes || '-',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl md:max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 md:w-7 md:h-7 text-accent-gold" />
                <h2 className="text-xl md:text-2xl font-headline font-bold text-primary">
                  {t('questionnaire.review.title')}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <p className="text-sm md:text-base text-neutral-600 mb-4 md:mb-6">
                {t('questionnaire.review.subtitle')}
              </p>

              <div className="space-y-3 md:space-y-4">
                {reviewItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 md:p-4 bg-muted-beige/30 rounded-lg border border-gray-200"
                  >
                    <p className="text-xs md:text-sm font-medium text-accent-gold mb-1 md:mb-2">
                      {item.question}
                    </p>
                    <p className={cn(
                      "text-sm md:text-base text-primary",
                      direction === 'rtl' ? 'text-right' : 'text-left'
                    )}>
                      {item.answer}
                    </p>
                    {item.custom && (
                      <p className="text-xs md:text-sm text-neutral-500 mt-1 italic">
                        {item.custom}
                      </p>
                    )}
                    {item.placement && (
                      <p className="text-xs md:text-sm text-neutral-500 mt-1">
                        <span className="font-medium">
                          {getTranslation('questionnaire.section6.q10.placementLabel', 'موضع الزينة')}:
                        </span> {item.placement}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className={cn(
              "flex gap-3 md:gap-4 p-4 md:p-6 border-t border-gray-200 bg-gray-50",
              direction === 'rtl' ? 'flex-row-reverse' : ''
            )}>
              <Button
                variant="ghost"
                size="lg"
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4 md:w-5 md:h-5" />
                {t('questionnaire.review.editButton')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={onConfirm}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                {t('questionnaire.review.confirmButton')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

