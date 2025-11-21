'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { QuestionnaireAnswers } from '@/types';
import Button from '@/components/Button';

interface Design {
  id: string;
  image_url: string;
  enhanced_prompt: string;
  created_at: string;
  questionnaire_answers?: QuestionnaireAnswers | null;
}

interface DesignDetailsModalProps {
  design: Design | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export default function DesignDetailsModal({
  design,
  onClose,
  onDelete,
}: DesignDetailsModalProps) {
  const { t, direction } = useLanguage();

  if (!design) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(design.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `design-${design.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = () => {
    if (confirm(t('profile.designs.confirmDelete'))) {
      onDelete(design.id);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(direction === 'rtl' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format questionnaire answers for display
  const getFormattedAnswers = () => {
    if (!design.questionnaire_answers) return [];

    const answers = design.questionnaire_answers;
    const formatted: { label: string; value: string }[] = [];

    const addAnswer = (questionKey: string, value: string | undefined, customValue?: string) => {
      if (value) {
        formatted.push({
          label: t(`${questionKey}.question`),
          value: customValue || t(`${questionKey}.options.${value}`) || value
        });
      }
    };

    // Add all answers with correct translation keys
    addAnswer('questionnaire.section1.q1', answers.dressType, answers.dressTypeCustom);
    addAnswer('questionnaire.section1.q2', answers.dressLength, answers.dressLengthCustom);
    addAnswer('questionnaire.section2.q3', answers.waistShape, answers.waistShapeCustom);
    addAnswer('questionnaire.section2.q4', answers.skirtShape, answers.skirtShapeCustom);
    addAnswer('questionnaire.section3.q5', answers.necklineType, answers.necklineTypeCustom);
    addAnswer('questionnaire.section3.q6', answers.sleeveType, answers.sleeveTypeCustom);
    addAnswer('questionnaire.section5.q8', answers.fabricType, answers.fabricTypeCustom);

    // Transparent parts (yes/no question)
    if (answers.hasTransparentParts) {
      formatted.push({
        label: t('questionnaire.section5.q9.question'),
        value: t(`common.${answers.hasTransparentParts}`)
      });
    }

    if (answers.transparentPartsLocation) {
      formatted.push({
        label: t('questionnaire.section5.q9.placeholder'),
        value: answers.transparentPartsLocation
      });
    }

    // Embellishments (multi-select)
    if (answers.embellishments && answers.embellishments.length > 0) {
      formatted.push({
        label: t('questionnaire.section6.q10.question'),
        value: answers.embellishments.map(e =>
          t(`questionnaire.section6.q10.options.${e}`) || e
        ).join(', ') + (answers.embellishmentsCustom ? `, ${answers.embellishmentsCustom}` : '')
      });
    }

    if (answers.embellishmentPlacement) {
      formatted.push({
        label: t('questionnaire.section6.q10.placementLabel'),
        value: answers.embellishmentPlacement
      });
    }

    addAnswer('questionnaire.section6.q11', answers.shineLevel, answers.shineLevelCustom);

    // Primary color (text input)
    if (answers.primaryColor) {
      formatted.push({
        label: t('questionnaire.section7.q12.question'),
        value: answers.primaryColor
      });
    }

    // Additional colors (yes/no question)
    if (answers.hasAdditionalColors) {
      formatted.push({
        label: t('questionnaire.section7.q13.question'),
        value: t(`common.${answers.hasAdditionalColors}`)
      });
    }

    if (answers.additionalColors) {
      formatted.push({
        label: t('questionnaire.section7.q13.placeholder'),
        value: answers.additionalColors
      });
    }

    addAnswer('questionnaire.section8.q14', answers.designStyle, answers.designStyleCustom);

    // Additional notes
    if (answers.additionalNotes) {
      formatted.push({
        label: t('questionnaire.section9.q16.question'),
        value: answers.additionalNotes
      });
    }

    return formatted;
  };

  const formattedAnswers = getFormattedAnswers();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg sm:rounded-xl max-w-4xl w-full my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] flex flex-col"
          dir={direction}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg sm:text-2xl font-headline font-bold text-primary">
              {t('profile.designs.designDetails')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-500" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Image */}
              <div className="space-y-3 sm:space-y-4">
                <div className="w-full aspect-[3/4] relative rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={design.image_url}
                    alt="Design"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs sm:text-sm text-neutral-500 text-center">
                  {formatDate(design.created_at)}
                </p>
              </div>

              {/* Questionnaire Answers */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4">
                  {t('profile.designs.questionnaireAnswers')}
                </h3>

                {formattedAnswers.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {formattedAnswers.map((answer, index) => (
                      <div key={index} className="pb-2 sm:pb-3 border-b border-gray-100 last:border-0">
                        <p className="text-xs sm:text-sm font-medium text-neutral-600 mb-1">
                          {answer.label}
                        </p>
                        <p className="text-xs sm:text-sm text-primary break-words">
                          {answer.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm sm:text-base text-neutral-500 text-center py-6 sm:py-8">
                    {t('profile.designs.noAnswers')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
            <Button
              variant="ghost"
              size="lg"
              onClick={onClose}
              className="flex-1 text-sm sm:text-base py-2 sm:py-3"
            >
              {t('common.close')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleDownload}
              className="flex-1 text-sm sm:text-base py-2 sm:py-3"
            >
              <Download className={`w-4 h-4 sm:w-5 sm:h-5 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
              {t('profile.designs.download')}
            </Button>
            <Button
              variant="danger"
              size="lg"
              onClick={handleDelete}
              className="flex-1 text-sm sm:text-base py-2 sm:py-3"
            >
              <Trash2 className={`w-4 h-4 sm:w-5 sm:h-5 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
              {t('profile.designs.delete')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

