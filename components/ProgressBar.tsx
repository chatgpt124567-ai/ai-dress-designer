'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void; // Optional callback for step navigation
}

export default function ProgressBar({ currentStep, totalSteps, onStepClick }: ProgressBarProps) {
  const { t } = useLanguage();
  const progress = (currentStep / totalSteps) * 100;

  const handleStepClick = (step: number) => {
    if (onStepClick) {
      onStepClick(step);
    }
  };

  return (
    <div className="mb-6 md:mb-8">
      {/* Progress Text */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm md:text-base text-neutral-600 font-medium">
          {t('questionnaire.progress', { current: currentStep, total: totalSteps })}
        </span>
        <span className="text-sm md:text-base text-accent-gold font-semibold">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 md:h-3 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-accent-gold to-amber-500 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between mt-3 md:mt-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <button
            key={step}
            onClick={() => handleStepClick(step)}
            disabled={!onStepClick}
            className={`flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full text-xs md:text-sm font-medium transition-all ${
              step < currentStep
                ? 'bg-accent-gold text-white'
                : step === currentStep
                ? 'bg-accent-gold text-white ring-4 ring-accent-gold/30'
                : 'bg-gray-200 text-gray-500'
            } ${
              onStepClick ? 'cursor-pointer hover:scale-110 hover:shadow-lg active:scale-95' : 'cursor-default'
            }`}
            aria-label={`${t('questionnaire.goToStep')} ${step}`}
          >
            {step < currentStep ? '✓' : step}
          </button>
        ))}
      </div>
    </div>
  );
}

