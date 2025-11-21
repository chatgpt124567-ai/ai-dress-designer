'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const { t } = useLanguage();
  const progress = (currentStep / totalSteps) * 100;

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
          <div
            key={step}
            className={`flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full text-xs md:text-sm font-medium transition-all ${
              step < currentStep
                ? 'bg-accent-gold text-white'
                : step === currentStep
                ? 'bg-accent-gold text-white ring-4 ring-accent-gold/30'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {step < currentStep ? '✓' : step}
          </div>
        ))}
      </div>
    </div>
  );
}

