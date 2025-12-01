'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { QuestionnaireAnswers } from '@/types';
import Button from './Button';
import ProgressBar from './ProgressBar';
import QuestionStep from './QuestionStep';

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
  const totalSteps = 9; // 9 questions for own fabric workflow
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with default value (1) to avoid hydration mismatch
  const [currentStep, setCurrentStep] = useState(1);

  // Track if we've loaded the saved step to prevent unnecessary updates
  const [hasLoadedSavedStep, setHasLoadedSavedStep] = useState(false);

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
      dressTypeCustom: '',
      dressLength: '',
      dressLengthCustom: '',
      skirtShape: '',
      skirtShapeCustom: '',
      necklineType: '',
      necklineTypeCustom: '',
      sleeveType: '',
      sleeveTypeCustom: '',
      fabricType: '', // Required field - not used in simplified wizard but needed for type
      transparentParts: '',
      embellishments: [],
      embellishmentsCustom: '',
      bodyType: '',
      bodyTypeCustom: '',
      additionalDetails: '',
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

  const handleNext = () => {
    if (currentStep < totalSteps) {
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

      case 3: // Skirt Shape
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section2.title')}
            questionText={t('questionnaire.section2.q4.question')}
            questionType="radio"
            options={[
              { value: 'wide', labelKey: 'questionnaire.section2.q4.options.wide' },
              { value: 'tight', labelKey: 'questionnaire.section2.q4.options.tight' },
              { value: 'layered', labelKey: 'questionnaire.section2.q4.options.layered' },
              { value: 'pleated', labelKey: 'questionnaire.section2.q4.options.pleated' },
              { value: 'puffy', labelKey: 'questionnaire.section2.q4.options.puffy' },
              { value: 'straight', labelKey: 'questionnaire.section2.q4.options.straight' },
              { value: 'mermaidTail', labelKey: 'questionnaire.section2.q4.options.mermaidTail' },
              { value: 'other', labelKey: 'questionnaire.section2.q4.options.other', hasCustomInput: true },
            ]}
            value={answers.skirtShape}
            customValue={answers.skirtShapeCustom}
            onChange={(value, customValue) => updateAnswer('skirtShape', value as string, customValue)}
            onAutoAdvance={handleNext}
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
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section5.title')}
            questionText={t('questionnaire.section5.q9.question')}
            questionType="yesno"
            value={answers.transparentParts || ''}
            onChange={(value) => updateAnswer('transparentParts', value as string)}
            placeholder={t('questionnaire.section5.q9.placeholder')}
            onAutoAdvance={handleNext}
          />
        );

      case 7: // Embellishments
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section6.title')}
            questionText={t('questionnaire.section6.q9.question')}
            questionType="checkbox"
            options={[
              { value: 'handEmbroidery', labelKey: 'questionnaire.section6.q9.options.handEmbroidery' },
              { value: 'beads', labelKey: 'questionnaire.section6.q9.options.beads' },
              { value: 'sequins', labelKey: 'questionnaire.section6.q9.options.sequins' },
              { value: 'decorativeLace', labelKey: 'questionnaire.section6.q9.options.decorativeLace' },
              { value: '3dFlowers', labelKey: 'questionnaire.section6.q9.options.3dFlowers' },
              { value: 'stones', labelKey: 'questionnaire.section6.q9.options.stones' },
              { value: 'pearls', labelKey: 'questionnaire.section6.q9.options.pearls' },
              { value: 'none', labelKey: 'questionnaire.section6.q9.options.none' },
              { value: 'other', labelKey: 'questionnaire.section6.q9.options.other', hasCustomInput: true },
            ]}
            value={answers.embellishments}
            customValue={answers.embellishmentsCustom}
            onChange={(value, customValue) => updateAnswer('embellishments', value as string[], customValue)}
          />
        );

      case 8: // Body Size
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

      case 9: // Additional Details
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section6.title')}
            questionText={t('questionnaire.section6.q11.question')}
            questionType="textarea"
            value={answers.additionalDetails || ''}
            onChange={(value) => updateAnswer('additionalDetails', value as string)}
            placeholder={t('questionnaire.section6.q11.placeholder')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} onStepClick={handleStepClick} />

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: direction === 'rtl' ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction === 'rtl' ? 50 : -50 }}
          transition={{ duration: 0.3 }}
        >
          {renderQuestion()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex gap-4 mt-8">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={loading}
            className="flex-1"
          >
            {t('common.back')}
          </Button>
        )}

        {currentStep < totalSteps ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={loading}
            className="flex-1"
          >
            {t('common.continue')}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1"
          >
            {loading ? t('design.form.generating') : t('questionnaire.submit')}
          </Button>
        )}
      </div>
    </div>
  );
}


