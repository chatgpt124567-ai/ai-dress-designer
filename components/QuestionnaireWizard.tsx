'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { QuestionnaireAnswers } from '@/types';
import Button from './Button';
import ProgressBar from './ProgressBar';
import QuestionStep from './QuestionStep';
import CustomFabricModal from './CustomFabricModal';

interface QuestionnaireWizardProps {
  onSubmit: (answers: QuestionnaireAnswers) => void;
  loading?: boolean;
  initialAnswers?: QuestionnaireAnswers;
  onAnswersChange?: (answers: QuestionnaireAnswers) => void;
}

const STORAGE_STEP_KEY = 'ai_dress_designer_current_step';

export default function QuestionnaireWizard({
  onSubmit,
  loading = false,
  initialAnswers,
  onAnswersChange
}: QuestionnaireWizardProps) {
  const { t, direction } = useLanguage();
  const totalSteps = 11; // 11 questions total (Q2 combines Primary Color + Additional Colors)

  // Initialize with default value (1) to avoid hydration mismatch
  // The saved step will be loaded in useEffect after hydration
  const [currentStep, setCurrentStep] = useState(1);

  // Track if we've loaded the saved step to prevent unnecessary updates
  const [hasLoadedSavedStep, setHasLoadedSavedStep] = useState(false);

  // Custom Fabric Modal state
  const [customFabricModalOpen, setCustomFabricModalOpen] = useState(false);

  // Load saved step from localStorage after component mounts (client-side only)
  // This runs after hydration is complete, avoiding hydration mismatch
  useEffect(() => {
    // Only load once
    if (hasLoadedSavedStep) return;

    try {
      const saved = localStorage.getItem(STORAGE_STEP_KEY);
      if (saved) {
        const step = parseInt(saved, 10);
        if (step >= 1 && step <= totalSteps) {
          setCurrentStep(step);
          setHasLoadedSavedStep(true);
          console.log('✅ Restored saved step:', step);
        }
      }
    } catch (error) {
      console.error('Error loading saved step:', error);
    }
  }, [hasLoadedSavedStep, totalSteps]); // Dependencies to ensure it runs correctly

  // Initialize answers state with saved answers if available
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(initialAnswers || {
    dressType: '',
    dressLength: '',
    skirtShape: '',
    necklineType: '',
    sleeveType: '',
    fabricType: '',
    hasTransparentParts: '',
    embellishments: [],
    bodySize: '',
    primaryColor: '',
    hasAdditionalColors: '',
  });

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STEP_KEY, currentStep.toString());
      console.log('💾 Saved current step:', currentStep);
    } catch (error) {
      console.error('Error saving current step:', error);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      // Smooth scroll to top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Smooth scroll to top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      // Smooth scroll to top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      console.log('📍 Navigated to step:', step);
    }
  };

  const handleSubmit = () => {
    // Clear saved step when submitting
    try {
      localStorage.removeItem(STORAGE_STEP_KEY);
      console.log('🗑️ Cleared saved step on submit');
    } catch (error) {
      console.error('Error clearing saved step:', error);
    }
    onSubmit(answers);
  };

  const updateAnswer = (field: keyof QuestionnaireAnswers, value: string | string[], customValue?: string) => {
    const updatedAnswers = {
      ...answers,
      [field]: value,
      ...(customValue !== undefined && { [`${field}Custom`]: customValue }),
    };
    setAnswers(updatedAnswers);

    // Auto-save to localStorage via callback
    if (onAnswersChange) {
      onAnswersChange(updatedAnswers);
    }
  };

  // Define question configurations
  const getStepContent = () => {
    switch (currentStep) {
      case 1: // Section 1: Basics - Q1
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

      case 2: // Section 5: Fabric - Q8 (Fabric Type - MOVED TO POSITION 2)
        return (
          <div className="space-y-6">
            <QuestionStep
              sectionTitle={t('questionnaire.section5.title')}
              questionText={t('questionnaire.section5.q8.question')}
              questionType="radio"
              options={[
                { value: 'customFabric', labelKey: 'questionnaire.section5.q8.options.customFabric' },
                { value: 'satin', labelKey: 'questionnaire.section5.q8.options.satin' },
                { value: 'silk', labelKey: 'questionnaire.section5.q8.options.silk' },
                { value: 'chiffon', labelKey: 'questionnaire.section5.q8.options.chiffon' },
                { value: 'tulle', labelKey: 'questionnaire.section5.q8.options.tulle' },
                { value: 'lace', labelKey: 'questionnaire.section5.q8.options.lace' },
                { value: 'velvet', labelKey: 'questionnaire.section5.q8.options.velvet' },
                { value: 'organza', labelKey: 'questionnaire.section5.q8.options.organza' },
                { value: 'crepe', labelKey: 'questionnaire.section5.q8.options.crepe' },
                { value: 'other', labelKey: 'questionnaire.section5.q8.options.other', hasCustomInput: true },
              ]}
              value={answers.fabricType}
              customValue={answers.fabricTypeCustom}
              onChange={(value, customValue) => {
                updateAnswer('fabricType', value as string, customValue);
                // Open modal when customFabric is selected
                if (value === 'customFabric') {
                  setCustomFabricModalOpen(true);
                }
              }}
              onAutoAdvance={handleNext}
              disableAutoAdvanceFor={['customFabric']}
            />

            {/* Show custom fabric summary if configured */}
            {answers.fabricType === 'customFabric' && answers.customFabricImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-accent-gold/10 border-2 border-accent-gold rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-accent-gold">
                      <img src={answers.customFabricImage} alt="Custom Fabric" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-primary">{t('questionnaire.section5.q8.imageUploaded')}</p>
                      {answers.fabricPlacement && (
                        <p className="text-sm text-gray-600">
                          {t(`questionnaire.section5.q8.placementOptions.${answers.fabricPlacement}`)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomFabricModalOpen(true)}
                    className="text-sm"
                  >
                    {t('common.edit')}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        );

      case 3: // Section 7: Colors - Combined (Primary Color + Additional Colors) - MOVED FROM CASE 2
        return (
          <div className="space-y-6">
            {/* القسم الأول: اللون الأساسي */}
            <QuestionStep
              sectionTitle={t('questionnaire.section7.title')}
              questionText={t('questionnaire.section7.q12.question')}
              questionType="text"
              value={answers.primaryColor}
              onChange={(value) => updateAnswer('primaryColor', value as string)}
              placeholder={t('questionnaire.section7.q12.placeholder')}
            />

            {/* القسم الثاني: ألوان إضافية */}
            <QuestionStep
              sectionTitle=""
              questionText={t('questionnaire.section7.q13.question')}
              questionType="yesno"
              value={answers.hasAdditionalColors}
              onChange={(value) => updateAnswer('hasAdditionalColors', value as string)}
            />

            {/* الحقل الفرعي الشرطي */}
            {answers.hasAdditionalColors === 'yes' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  type="text"
                  value={answers.additionalColors || ''}
                  onChange={(e) => updateAnswer('additionalColors' as any, e.target.value)}
                  placeholder={t('questionnaire.section7.q13.placeholder')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 transition-all text-sm md:text-base"
                  dir={direction}
                />
              </motion.div>
            )}
          </div>
        );

      case 4: // Section 1: Basics - Q2 (Dress Length - moved from case 3)
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section1.title')}
            questionText={t('questionnaire.section1.q2.question')}
            questionType="radio"
            options={[
              { value: 'knee', labelKey: 'questionnaire.section1.q2.options.knee' },
              { value: 'long', labelKey: 'questionnaire.section1.q2.options.long' },
              { value: 'floor', labelKey: 'questionnaire.section1.q2.options.floor' },
              { value: 'train', labelKey: 'questionnaire.section1.q2.options.train' },
              { value: 'other', labelKey: 'questionnaire.section1.q2.options.other', hasCustomInput: true },
            ]}
            value={answers.dressLength}
            customValue={answers.dressLengthCustom}
            onChange={(value, customValue) => updateAnswer('dressLength', value as string, customValue)}
            onAutoAdvance={handleNext}
          />
        );

      case 5: // Section 2: Silhouette - Q4 (Skirt Shape - moved from case 4)
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

      case 6: // Section 3: Upper Body - Q5 (Neckline - moved from case 5)
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

      case 7: // Section 3: Upper Body - Q6 (Sleeves - moved from case 6)
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

      case 8: // Section 5: Fabric - Q9 (Transparent parts)
        return (
          <div className="space-y-6">
            <QuestionStep
              sectionTitle={t('questionnaire.section5.title')}
              questionText={t('questionnaire.section5.q9.question')}
              questionType="yesno"
              value={answers.hasTransparentParts}
              onChange={(value) => updateAnswer('hasTransparentParts', value as string)}
              onAutoAdvance={handleNext}
            />
            {answers.hasTransparentParts === 'yes' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  type="text"
                  value={answers.transparentPartsLocation || ''}
                  onChange={(e) => updateAnswer('transparentPartsLocation' as any, e.target.value)}
                  placeholder={t('questionnaire.section5.q9.placeholder')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 transition-all text-sm md:text-base"
                  dir={direction}
                />
              </motion.div>
            )}
          </div>
        );

      case 9: // Section 6: Embellishments - Q9 (Embellishments)
        return (
          <div className="space-y-6">
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
                { value: 'belt', labelKey: 'questionnaire.section6.q9.options.belt' },
                { value: 'embroideredFabric', labelKey: 'questionnaire.section6.q9.options.embroideredFabric' },
                { value: 'none', labelKey: 'questionnaire.section6.q9.options.none' },
                { value: 'other', labelKey: 'questionnaire.section6.q9.options.other', hasCustomInput: true },
              ]}
              value={answers.embellishments}
              customValue={answers.embellishmentsCustom}
              onChange={(value, customValue) => updateAnswer('embellishments', value, customValue)}
            />
            {/* Show embellishment placement field if any embellishment is selected (except 'none') */}
            {Array.isArray(answers.embellishments) &&
             answers.embellishments.length > 0 &&
             !answers.embellishments.includes('none') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <label className="block text-sm font-medium text-primary mb-2">
                  {t('questionnaire.section6.q9.placementLabel')}
                </label>
                <input
                  type="text"
                  value={answers.embellishmentPlacement || ''}
                  onChange={(e) => updateAnswer('embellishmentPlacement' as any, e.target.value)}
                  placeholder={t('questionnaire.section6.q9.placementPlaceholder')}
                  className={cn(
                    'w-full px-4 py-3 border-2 border-gray-200 rounded-lg',
                    'focus:border-accent-gold focus:outline-none',
                    'transition-colors',
                    direction === 'rtl' ? 'text-right' : 'text-left'
                  )}
                  dir={direction}
                />
              </motion.div>
            )}
          </div>
        );

      case 10: // Section 6: Body Size - Q10 (Body Size)
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
            ]}
            value={answers.bodySize}
            onChange={(value) => updateAnswer('bodySize', value as string)}
            onAutoAdvance={handleNext}
          />
        );

      case 11: // Section 9: Additional Notes - Q16 (Additional Notes)
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section9.title')}
            questionText={t('questionnaire.section9.q16.question')}
            questionType="textarea"
            value={answers.additionalNotes || ''}
            onChange={(value) => updateAnswer('additionalNotes' as any, value as string)}
            placeholder={t('questionnaire.section9.q16.placeholder')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="luxury-card p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-2">
          {t('questionnaire.title')}
        </h2>
        <p className="text-sm md:text-base text-neutral-600">
          {t('questionnaire.subtitle')}
        </p>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepClick={handleStepClick}
      />

      {/* Question Content */}
      <AnimatePresence mode="wait">
        <div key={currentStep} className="min-h-[300px] md:min-h-[400px]">
          {getStepContent()}
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

      {/* Custom Fabric Modal */}
      <CustomFabricModal
        isOpen={customFabricModalOpen}
        onClose={() => setCustomFabricModalOpen(false)}
        customFabricImage={answers.customFabricImage}
        fabricPlacement={answers.fabricPlacement}
        fabricPlacementDetails={answers.fabricPlacementDetails}
        onImageChange={(imageData) => updateAnswer('customFabricImage' as any, imageData)}
        onPlacementChange={(placement) => updateAnswer('fabricPlacement' as any, placement)}
        onPlacementDetailsChange={(details) => updateAnswer('fabricPlacementDetails' as any, details)}
        onRemoveImage={() => {
          updateAnswer('customFabricImage' as any, '');
          updateAnswer('fabricPlacement' as any, '');
          updateAnswer('fabricPlacementDetails' as any, '');
        }}
      />
    </div>
  );
}

