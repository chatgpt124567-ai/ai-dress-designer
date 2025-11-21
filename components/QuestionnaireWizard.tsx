'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { QuestionnaireAnswers } from '@/types';
import Button from './Button';
import ProgressBar from './ProgressBar';
import QuestionStep from './QuestionStep';

interface QuestionnaireWizardProps {
  onSubmit: (answers: QuestionnaireAnswers) => void;
  loading?: boolean;
}

export default function QuestionnaireWizard({ onSubmit, loading = false }: QuestionnaireWizardProps) {
  const { t, direction } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 11; // 11 questions total (Q2 combines Primary Color + Additional Colors)

  // Initialize answers state
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    dressType: '',
    dressLength: '',
    skirtShape: '',
    necklineType: '',
    sleeveType: '',
    fabricType: '',
    hasTransparentParts: '',
    embellishments: [],
    shineLevel: '',
    primaryColor: '',
    hasAdditionalColors: '',
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const updateAnswer = (field: keyof QuestionnaireAnswers, value: string | string[], customValue?: string) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: value,
      ...(customValue !== undefined && { [`${field}Custom`]: customValue }),
    }));
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
          />
        );

      case 2: // Section 7: Colors - Combined (Primary Color + Additional Colors)
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

      case 3: // Section 1: Basics - Q2 (Dress Length - moved from case 2)
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
          />
        );

      case 4: // Section 2: Silhouette - Q4 (Skirt Shape - moved from case 3)
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
          />
        );

      case 5: // Section 3: Upper Body - Q5 (Neckline - moved from case 4)
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
          />
        );

      case 6: // Section 3: Upper Body - Q6 (Sleeves - moved from case 5)
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
          />
        );

      case 7: // Section 5: Fabric - Q8 (Fabric Type - moved from case 6)
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section5.title')}
            questionText={t('questionnaire.section5.q8.question')}
            questionType="radio"
            options={[
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
            onChange={(value, customValue) => updateAnswer('fabricType', value as string, customValue)}
          />
        );

      case 8: // Section 5: Fabric - Q9 (Transparent parts - moved from case 7)
        return (
          <div className="space-y-6">
            <QuestionStep
              sectionTitle={t('questionnaire.section5.title')}
              questionText={t('questionnaire.section5.q9.question')}
              questionType="yesno"
              value={answers.hasTransparentParts}
              onChange={(value) => updateAnswer('hasTransparentParts', value as string)}
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

      case 9: // Section 6: Embellishments - Q10 (Embellishments - moved from case 8)
        return (
          <div className="space-y-6">
            <QuestionStep
              sectionTitle={t('questionnaire.section6.title')}
              questionText={t('questionnaire.section6.q10.question')}
              questionType="checkbox"
              options={[
                { value: 'handEmbroidery', labelKey: 'questionnaire.section6.q10.options.handEmbroidery' },
                { value: 'beads', labelKey: 'questionnaire.section6.q10.options.beads' },
                { value: 'sequins', labelKey: 'questionnaire.section6.q10.options.sequins' },
                { value: 'decorativeLace', labelKey: 'questionnaire.section6.q10.options.decorativeLace' },
                { value: '3dFlowers', labelKey: 'questionnaire.section6.q10.options.3dFlowers' },
                { value: 'stones', labelKey: 'questionnaire.section6.q10.options.stones' },
                { value: 'belt', labelKey: 'questionnaire.section6.q10.options.belt' },
                { value: 'embroideredFabric', labelKey: 'questionnaire.section6.q10.options.embroideredFabric' },
                { value: 'none', labelKey: 'questionnaire.section6.q10.options.none' },
                { value: 'other', labelKey: 'questionnaire.section6.q10.options.other', hasCustomInput: true },
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
                  {t('questionnaire.section6.q10.placementLabel')}
                </label>
                <input
                  type="text"
                  value={answers.embellishmentPlacement || ''}
                  onChange={(e) => updateAnswer('embellishmentPlacement' as any, e.target.value)}
                  placeholder={t('questionnaire.section6.q10.placementPlaceholder')}
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

      case 10: // Section 6: Embellishments - Q11 (Shine Level - moved from case 9)
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section6.title')}
            questionText={t('questionnaire.section6.q11.question')}
            questionType="radio"
            options={[
              { value: 'none', labelKey: 'questionnaire.section6.q11.options.none' },
              { value: 'light', labelKey: 'questionnaire.section6.q11.options.light' },
              { value: 'strong', labelKey: 'questionnaire.section6.q11.options.strong' },
              { value: 'other', labelKey: 'questionnaire.section6.q11.options.other', hasCustomInput: true },
            ]}
            value={answers.shineLevel}
            customValue={answers.shineLevelCustom}
            onChange={(value, customValue) => updateAnswer('shineLevel', value as string, customValue)}
          />
        );

      case 11: // Section 9: Additional Notes - Q16 (Additional Notes - moved from case 12)
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
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

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
    </div>
  );
}

