'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { QuestionnaireAnswers } from '@/types';
import Button from './Button';
import ProgressBar from './ProgressBar';
import QuestionStep from './QuestionStep';
import MultiFabricPlacementModal from './MultiFabricPlacementModal';
import MultiEmbellishmentPlacementModal from './MultiEmbellishmentPlacementModal';
import FabricPreviewModal from './FabricPreviewModal';
import SkirtPreviewModal from './SkirtPreviewModal';

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
  const totalSteps = 12; // 12 questions total (added back style question)

  // Initialize with default value (1) to avoid hydration mismatch
  // The saved step will be loaded in useEffect after hydration
  const [currentStep, setCurrentStep] = useState(1);

  // Track if we've loaded the saved step to prevent unnecessary updates
  const [hasLoadedSavedStep, setHasLoadedSavedStep] = useState(false);

  // Multi-Fabric Placement Modal state
  const [multiFabricModalOpen, setMultiFabricModalOpen] = useState(false);

  // Multi-Embellishment Placement Modal state
  const [multiEmbellishmentModalOpen, setMultiEmbellishmentModalOpen] = useState(false);

  // Fabric Preview Modal state
  const [fabricPreviewModalOpen, setFabricPreviewModalOpen] = useState(false);
  const [selectedFabricForPreview, setSelectedFabricForPreview] = useState<string>('');

  // Skirt Preview Modal state
  const [skirtPreviewModalOpen, setSkirtPreviewModalOpen] = useState(false);
  const [selectedSkirtForPreview, setSelectedSkirtForPreview] = useState<string>('');

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
          console.log('✅ Restored saved step:', step);
        }
      }
      // Always mark as loaded to prevent race conditions with auto-advance
      setHasLoadedSavedStep(true);
    } catch (error) {
      console.error('Error loading saved step:', error);
      setHasLoadedSavedStep(true);
    }
  }, [hasLoadedSavedStep, totalSteps]); // Dependencies to ensure it runs correctly

  // Initialize answers state with saved answers if available
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(initialAnswers || {
    dressType: '',
    dressLength: '',
    skirtShape: '',
    necklineType: '',
    backStyle: '', // Back design style
    sleeveType: '',
    fabricType: [], // Changed to array for multi-select
    fabricPlacements: {}, // Placements for each selected fabric
    hasTransparentParts: '',
    embellishments: [],
    embellishmentPlacements: {}, // Placements for each selected embellishment
    bodySize: '',
    primaryColor: '',
    hasAdditionalColors: '',
  });

  // Track if initial answers have been applied
  const [hasAppliedInitialAnswers, setHasAppliedInitialAnswers] = useState(false);

  // Apply initialAnswers when they become available (e.g., loaded from localStorage async)
  useEffect(() => {
    if (initialAnswers && !hasAppliedInitialAnswers) {
      // Check if initialAnswers has any meaningful data
      const hasData = initialAnswers.dressType || initialAnswers.dressLength ||
                      initialAnswers.skirtShape || initialAnswers.necklineType;
      if (hasData) {
        setAnswers(initialAnswers);
        setHasAppliedInitialAnswers(true);
        console.log('✅ Applied initial answers:', initialAnswers);
      }
    }
  }, [initialAnswers, hasAppliedInitialAnswers]);

  // Save current step to localStorage whenever it changes
  // Only save AFTER we've loaded the saved step to avoid overwriting it with the default value
  useEffect(() => {
    // Don't save until we've loaded the saved step from localStorage
    if (!hasLoadedSavedStep) return;

    try {
      localStorage.setItem(STORAGE_STEP_KEY, currentStep.toString());
      console.log('💾 Saved current step:', currentStep);
    } catch (error) {
      console.error('Error saving current step:', error);
    }
  }, [currentStep, hasLoadedSavedStep]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      // Check if we're on fabric step (step 2) and multiple fabrics are selected
      if (currentStep === 2) {
        const selectedFabrics = Array.isArray(answers.fabricType) ? answers.fabricType : (answers.fabricType ? [answers.fabricType] : []);
        // Filter out customFabric - it has its own modal
        const standardFabrics = selectedFabrics.filter(f => f !== 'customFabric' && f !== 'other');

        // If more than 1 standard fabric is selected and placements not all filled, show modal
        if (standardFabrics.length > 1) {
          const allPlacementsFilled = standardFabrics.every(
            (fabric) => answers.fabricPlacements?.[fabric] && answers.fabricPlacements[fabric].trim() !== ''
          );

          if (!allPlacementsFilled) {
            setMultiFabricModalOpen(true);
            return; // Don't advance until modal is completed
          }
        }
      }

      // Check if we're on embellishments step (step 8) and embellishments are selected
      if (currentStep === 8) {
        const selectedEmbs = Array.isArray(answers.embellishments)
          ? answers.embellishments
          : (answers.embellishments ? [answers.embellishments] : []);
        // Filter out 'other' and 'belt' - they don't need placement
        const activeEmbs = selectedEmbs.filter(e => e !== 'other' && e !== 'belt');

        // If any embellishment is selected (even just 1) and placements not all filled, show modal
        if (activeEmbs.length >= 1) {
          const allPlacementsFilled = activeEmbs.every(
            (emb) => answers.embellishmentPlacements?.[emb] && answers.embellishmentPlacements[emb].trim() !== ''
          );

          if (!allPlacementsFilled) {
            setMultiEmbellishmentModalOpen(true);
            return; // Don't advance until modal is completed
          }
        }
      }

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

  const handleFabricPreview = (fabricType: string) => {
    setSelectedFabricForPreview(fabricType);
    setFabricPreviewModalOpen(true);
  };

  const handleSkirtPreview = (skirtType: string) => {
    setSelectedSkirtForPreview(skirtType);
    setSkirtPreviewModalOpen(true);
  };

  const updateAnswer = (field: keyof QuestionnaireAnswers, value: string | string[], customValue?: string) => {
    let updatedAnswers = {
      ...answers,
      [field]: value,
      ...(customValue !== undefined && { [`${field}Custom`]: customValue }),
    };

    // When fabricType changes, clean up fabricPlacements for removed fabrics
    if (field === 'fabricType' && Array.isArray(value)) {
      const currentFabrics = value as string[];
      const existingPlacements = answers.fabricPlacements || {};

      // Only keep placements for fabrics that are still selected
      const cleanedPlacements: { [key: string]: string } = {};
      currentFabrics.forEach(fabric => {
        if (existingPlacements[fabric]) {
          cleanedPlacements[fabric] = existingPlacements[fabric];
        }
      });

      updatedAnswers = {
        ...updatedAnswers,
        fabricPlacements: cleanedPlacements
      };
    }

    // When embellishments changes, clean up embellishmentPlacements for removed embellishments
    if (field === 'embellishments' && Array.isArray(value)) {
      const currentEmbellishments = value as string[];
      const existingPlacements = answers.embellishmentPlacements || {};

      // Only keep placements for embellishments that are still selected
      const cleanedPlacements: { [key: string]: string } = {};
      currentEmbellishments.forEach(emb => {
        if (existingPlacements[emb]) {
          cleanedPlacements[emb] = existingPlacements[emb];
        }
      });

      updatedAnswers = {
        ...updatedAnswers,
        embellishmentPlacements: cleanedPlacements
      };
    }

    setAnswers(updatedAnswers);

    // Auto-save to localStorage via callback
    if (onAnswersChange) {
      onAnswersChange(updatedAnswers);
    }
  };

  // Check if current step has an answer (reactive with useMemo)
  const hasAnswer = useMemo(() => {
    switch (currentStep) {
      case 1: // Dress Type
        return !!answers.dressType;
      case 2: // Fabric Type (multi-select)
        return Array.isArray(answers.fabricType) && answers.fabricType.length > 0;
      case 3: // Colors
        return !!answers.primaryColor;
      case 4: // Dress Length
        return !!answers.dressLength;
      case 5: // Skirt Shape
        return !!answers.skirtShape;
      case 6: // Neckline
        return !!answers.necklineType;
      case 7: // Back Style
        return !!answers.backStyle;
      case 8: // Sleeves
        return !!answers.sleeveType;
      case 9: // Embellishments (multi-select)
        return Array.isArray(answers.embellishments) && answers.embellishments.length > 0;
      case 10: // Design Style
        return !!answers.designStyle;
      case 11: // Body Size
        return !!answers.bodySize;
      case 12: // Additional Notes (optional - always considered as having answer)
        return true;
      default:
        return false;
    }
  }, [currentStep, answers]);

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

      case 2: // Section 5: Fabric - Q8 (Fabric Type - MOVED TO POSITION 2) - Now multi-select
        const selectedFabrics = Array.isArray(answers.fabricType) ? answers.fabricType : (answers.fabricType ? [answers.fabricType] : []);

        return (
          <div className="space-y-6">
            {/* Hint about multi-select */}
            <div className="text-sm text-accent-gold bg-accent-gold/10 px-4 py-2 rounded-lg">
              {t('questionnaire.section5.q8.multiSelectHint')}
            </div>

            <QuestionStep
              sectionTitle={t('questionnaire.section5.title')}
              questionText={t('questionnaire.section5.q8.question')}
              questionType="checkbox"
              options={[
                { value: 'satin', labelKey: 'questionnaire.section5.q8.options.satin' },
                { value: 'chiffon', labelKey: 'questionnaire.section5.q8.options.chiffon' },
                { value: 'silk', labelKey: 'questionnaire.section5.q8.options.silk' },
                { value: 'tulle', labelKey: 'questionnaire.section5.q8.options.tulle' },
                { value: 'lace', labelKey: 'questionnaire.section5.q8.options.lace' },
                { value: 'velvet', labelKey: 'questionnaire.section5.q8.options.velvet' },
                { value: 'organza', labelKey: 'questionnaire.section5.q8.options.organza' },
                { value: 'crepe', labelKey: 'questionnaire.section5.q8.options.crepe' },
                { value: 'other', labelKey: 'questionnaire.section5.q8.options.other', hasCustomInput: true },
              ]}
              value={selectedFabrics}
              customValue={answers.fabricTypeCustom}
              onChange={(value, customValue) => {
                const fabrics = Array.isArray(value) ? value : [value];
                updateAnswer('fabricType', fabrics, customValue);
              }}
              enableFabricPreview={true}
              onFabricPreview={handleFabricPreview}
              // No auto-advance for multi-select - user must click Next
            />

            {/* Show fabric placements summary if multiple fabrics selected */}
            {selectedFabrics.length > 1 && answers.fabricPlacements && Object.keys(answers.fabricPlacements).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border-2 border-green-500 rounded-lg space-y-2"
              >
                <p className="font-medium text-green-700">{t('questionnaire.section5.q8.fabricPlacementModalTitle')}</p>
                {selectedFabrics.filter(f => f !== 'customFabric').map((fabric) => (
                  answers.fabricPlacements?.[fabric] && (
                    <p key={fabric} className="text-sm text-gray-600">
                      <span className="font-medium">{t(`questionnaire.section5.q8.options.${fabric}`)}:</span> {answers.fabricPlacements[fabric]}
                    </p>
                  )
                ))}
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
              value={answers.primaryColor || ''}
              onChange={(value) => updateAnswer('primaryColor', value as string)}
              placeholder={t('questionnaire.section7.q12.placeholder')}
            />

            {/* القسم الثاني: ألوان إضافية */}
            <QuestionStep
              sectionTitle=""
              questionText={t('questionnaire.section7.q13.question')}
              questionType="yesno"
              value={answers.hasAdditionalColors || ''}
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
              { value: 'straight', labelKey: 'questionnaire.section2.q4.options.straight' },
              { value: 'tight', labelKey: 'questionnaire.section2.q4.options.tight' },
              { value: 'pleated', labelKey: 'questionnaire.section2.q4.options.pleated' },
              { value: 'puffy', labelKey: 'questionnaire.section2.q4.options.puffy' },
              { value: 'layered', labelKey: 'questionnaire.section2.q4.options.layered' }, // Moved after puffy
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

      case 7: // Section 4: Back Design - Q7
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section4.title')}
            questionText={t('questionnaire.section4.q7.question')}
            questionType="radio"
            options={[
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
              { value: 'other', labelKey: 'questionnaire.section4.q7.options.other', hasCustomInput: true },
            ]}
            value={answers.backStyle || ''}
            customValue={answers.backStyleCustom}
            onChange={(value, customValue) => updateAnswer('backStyle', value as string, customValue)}
            onAutoAdvance={handleNext}
          />
        );

      case 8: // Section 5: Sleeves - Q8
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
              { value: 'other', labelKey: 'questionnaire.section3.q6.options.other', hasCustomInput: true },
            ]}
            value={answers.sleeveType}
            customValue={answers.sleeveTypeCustom}
            onChange={(value, customValue) => updateAnswer('sleeveType', value as string, customValue)}
            onAutoAdvance={handleNext}
          />
        );

      case 9: // Section 6: Embellishments - Q9 (Embellishments)
        const selectedEmbellishments = Array.isArray(answers.embellishments)
          ? answers.embellishments
          : (answers.embellishments ? [answers.embellishments] : []);
        const activeEmbellishments = selectedEmbellishments.filter(e => e !== 'other' && e !== 'belt');

        return (
          <div className="space-y-6">
            {/* Hint about multi-select */}
            <div className="text-sm text-accent-gold bg-accent-gold/10 px-4 py-2 rounded-lg">
              {t('questionnaire.section6.q9.multiSelectHint')}
            </div>

            <QuestionStep
              sectionTitle={t('questionnaire.section6.title')}
              questionText={t('questionnaire.section6.q9.question')}
              questionType="checkbox"
              options={[
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
              // No auto-advance for multi-select - user must click Next
            />

            {/* Show placements summary if any embellishment has placement defined */}
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

      case 10: // Section 8: Design Style
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section8.title')}
            questionText={t('questionnaire.section8.q14.question')}
            questionType="radio"
            options={[
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

      case 11: // Section 6: Body Size
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
            value={answers.bodySize || ''}
            onChange={(value) => updateAnswer('bodySize', value as string)}
            onAutoAdvance={handleNext}
          />
        );

      case 12: // Section 9: Additional Notes
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
            {hasAnswer ? t('common.next') : t('common.skip')}
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

      {/* Multi-Fabric Placement Modal */}
      <MultiFabricPlacementModal
        isOpen={multiFabricModalOpen}
        onClose={() => setMultiFabricModalOpen(false)}
        selectedFabrics={
          (Array.isArray(answers.fabricType) ? answers.fabricType : (answers.fabricType ? [answers.fabricType] : []))
            .filter(f => f !== 'customFabric' && f !== 'other')
        }
        fabricPlacements={answers.fabricPlacements || {}}
        onPlacementsChange={(placements) => {
          setAnswers(prev => ({
            ...prev,
            fabricPlacements: placements
          }));
          if (onAnswersChange) {
            onAnswersChange({
              ...answers,
              fabricPlacements: placements
            });
          }
        }}
        onConfirm={() => {
          // After confirming placements, advance to next step
          setCurrentStep(currentStep + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Multi-Embellishment Placement Modal */}
      <MultiEmbellishmentPlacementModal
        isOpen={multiEmbellishmentModalOpen}
        onClose={() => setMultiEmbellishmentModalOpen(false)}
        selectedEmbellishments={
          (Array.isArray(answers.embellishments) ? answers.embellishments : (answers.embellishments ? [answers.embellishments] : []))
            .filter(e => e !== 'other' && e !== 'belt')
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
          // After confirming placements, advance to next step
          setCurrentStep(currentStep + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Fabric Preview Modal */}
      <FabricPreviewModal
        isOpen={fabricPreviewModalOpen}
        onClose={() => setFabricPreviewModalOpen(false)}
        fabricType={selectedFabricForPreview}
        fabricNameAr={selectedFabricForPreview ? t(`questionnaire.section5.q8.options.${selectedFabricForPreview}`) : ''}
        fabricNameEn={selectedFabricForPreview ? t(`questionnaire.section5.q8.options.${selectedFabricForPreview}`) : ''}
      />

      {/* Skirt Preview Modal */}
      <SkirtPreviewModal
        isOpen={skirtPreviewModalOpen}
        onClose={() => setSkirtPreviewModalOpen(false)}
        skirtType={selectedSkirtForPreview}
        skirtNameAr={selectedSkirtForPreview ? t(`questionnaire.section2.q4.options.${selectedSkirtForPreview}`) : ''}
        skirtNameEn={selectedSkirtForPreview ? t(`questionnaire.section2.q4.options.${selectedSkirtForPreview}`) : ''}
      />
    </div>
  );
}

