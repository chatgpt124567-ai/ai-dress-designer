'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface QuestionOption {
  value: string;
  labelKey: string;
  hasCustomInput?: boolean;
}

interface QuestionStepProps {
  sectionTitle: string;
  questionText: string;
  questionType: 'radio' | 'checkbox' | 'text' | 'textarea' | 'yesno';
  options?: QuestionOption[];
  value: string | string[];
  customValue?: string;
  onChange: (value: string | string[], customValue?: string) => void;
  placeholder?: string;
}

export default function QuestionStep({
  sectionTitle,
  questionText,
  questionType,
  options = [],
  value,
  customValue = '',
  onChange,
  placeholder,
}: QuestionStepProps) {
  const { t, direction } = useLanguage();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [localCustomValue, setLocalCustomValue] = useState(customValue);

  useEffect(() => {
    // Check if "other" option is selected
    if (questionType === 'radio' && value === 'other') {
      setShowCustomInput(true);
    } else if (questionType === 'checkbox' && Array.isArray(value) && value.includes('other')) {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
    }
  }, [value, questionType]);

  const handleRadioChange = (selectedValue: string) => {
    onChange(selectedValue, selectedValue === 'other' ? localCustomValue : undefined);
  };

  const handleCheckboxChange = (selectedValue: string) => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = currentValues.includes(selectedValue)
      ? currentValues.filter((v) => v !== selectedValue)
      : [...currentValues, selectedValue];
    onChange(newValues, newValues.includes('other') ? localCustomValue : undefined);
  };

  const handleCustomInputChange = (customText: string) => {
    setLocalCustomValue(customText);
    onChange(value, customText);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Section Title */}
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-lg md:text-xl font-headline font-semibold text-accent-gold">
          {sectionTitle}
        </h3>
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-base md:text-lg font-medium text-primary mb-4">
          {questionText}
        </label>

        {/* Radio Options */}
        {questionType === 'radio' && (
          <div className="space-y-3">
            {options.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-accent-gold',
                  value === option.value
                    ? 'border-accent-gold bg-accent-gold/5'
                    : 'border-gray-200 bg-white'
                )}
              >
                <input
                  type="radio"
                  name="question"
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => handleRadioChange(option.value)}
                  className="w-5 h-5 text-accent-gold focus:ring-accent-gold"
                  dir={direction}
                />
                <span className={cn('text-sm md:text-base text-primary', direction === 'rtl' ? 'mr-3' : 'ml-3')}>
                  {t(option.labelKey)}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Checkbox Options */}
        {questionType === 'checkbox' && (
          <div className="space-y-3">
            {options.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-accent-gold',
                  Array.isArray(value) && value.includes(option.value)
                    ? 'border-accent-gold bg-accent-gold/5'
                    : 'border-gray-200 bg-white'
                )}
              >
                <input
                  type="checkbox"
                  value={option.value}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={() => handleCheckboxChange(option.value)}
                  className="w-5 h-5 text-accent-gold focus:ring-accent-gold rounded"
                  dir={direction}
                />
                <span className={cn('text-sm md:text-base text-primary', direction === 'rtl' ? 'mr-3' : 'ml-3')}>
                  {t(option.labelKey)}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Yes/No Options */}
        {questionType === 'yesno' && (
          <div className="flex gap-4">
            {['yes', 'no'].map((option) => (
              <label
                key={option}
                className={cn(
                  'flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-accent-gold',
                  value === option
                    ? 'border-accent-gold bg-accent-gold/5'
                    : 'border-gray-200 bg-white'
                )}
              >
                <input
                  type="radio"
                  name="yesno"
                  value={option}
                  checked={value === option}
                  onChange={() => onChange(option)}
                  className="sr-only"
                />
                <span className="text-base md:text-lg font-medium text-primary">
                  {t(`common.${option}`)}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Text Input */}
        {questionType === 'text' && (
          <input
            type="text"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 transition-all text-sm md:text-base"
            dir={direction}
          />
        )}

        {/* Textarea Input */}
        {questionType === 'textarea' && (
          <textarea
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 transition-all resize-none text-sm md:text-base"
            dir={direction}
          />
        )}

        {/* Custom Input for "Other" option */}
        {showCustomInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <input
              type="text"
              value={localCustomValue}
              onChange={(e) => handleCustomInputChange(e.target.value)}
              placeholder={placeholder || t('questionnaire.customPlaceholder')}
              className="w-full px-4 py-3 border-2 border-accent-gold rounded-lg focus:ring-2 focus:ring-accent-gold/20 transition-all text-sm md:text-base"
              dir={direction}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

