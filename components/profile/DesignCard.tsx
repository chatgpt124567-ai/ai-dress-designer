'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { Design } from '@/types';

interface DesignCardProps {
  design: Design;
  onDelete: (id: string) => void;
  onClick: (design: Design) => void;
}

export default function DesignCard({
  design,
  onDelete,
  onClick,
}: DesignCardProps) {
  const { t, direction } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(direction === 'rtl' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get a preview of questionnaire answers (first 3 items)
  const getAnswersPreview = () => {
    if (!design.questionnaire_answers) return [];

    const answers = design.questionnaire_answers;
    const preview: { key: string; value: string }[] = [];

    if (answers.dressType) {
      preview.push({
        key: t('questionnaire.q1.label'),
        value: answers.dressTypeCustom || t(`questionnaire.q1.options.${answers.dressType}`)
      });
    }
    if (answers.dressLength && preview.length < 3) {
      preview.push({
        key: t('questionnaire.q2.label'),
        value: answers.dressLengthCustom || t(`questionnaire.q2.options.${answers.dressLength}`)
      });
    }
    if (answers.primaryColor && preview.length < 3) {
      preview.push({
        key: t('questionnaire.q12.label'),
        value: answers.primaryColor
      });
    }

    return preview;
  };

  const answersPreview = getAnswersPreview();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className="elegant-frame group relative cursor-pointer"
      onClick={() => onClick(design)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br from-accent-gold/10 to-primary/5">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-accent-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={design.image_url}
          alt="Design"
          className={cn(
            'w-full h-full object-cover transition-all duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
      </div>

      {/* Design Info - Hidden, only image is shown */}
    </motion.div>
  );
}

