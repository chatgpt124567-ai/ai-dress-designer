'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import Button from './Button';

interface MultiEmbellishmentPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmbellishments: string[];
  embellishmentPlacements: { [embellishmentType: string]: string };
  onPlacementsChange: (placements: { [embellishmentType: string]: string }) => void;
  onConfirm: () => void;
  onSkip?: () => void; // Optional skip handler
}

export default function MultiEmbellishmentPlacementModal({
  isOpen,
  onClose,
  selectedEmbellishments,
  embellishmentPlacements,
  onPlacementsChange,
  onConfirm,
  onSkip,
}: MultiEmbellishmentPlacementModalProps) {
  const { t, direction } = useLanguage();
  const [localPlacements, setLocalPlacements] = useState<{ [key: string]: string }>({});

  // Sync local state with props
  useEffect(() => {
    setLocalPlacements(embellishmentPlacements || {});
  }, [embellishmentPlacements, isOpen]);

  const handlePlacementChange = (embellishmentType: string, value: string) => {
    const updated = { ...localPlacements, [embellishmentType]: value };
    setLocalPlacements(updated);
    onPlacementsChange(updated);
  };

  const getEmbellishmentLabel = (embellishmentType: string): string => {
    return t(`questionnaire.section6.q9.options.${embellishmentType}`) || embellishmentType;
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
      onClose();
    }
  };

  // Check if all placements are filled
  const allPlacementsFilled = selectedEmbellishments.every(
    (emb) => localPlacements[emb] && localPlacements[emb].trim() !== ''
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={cn(
            "w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden",
            direction === 'rtl' ? 'text-right' : 'text-left'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <h3 className="text-lg md:text-xl font-headline font-bold text-primary">
              {t('questionnaire.section6.q9.embellishmentPlacementModalTitle')}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <p className="text-sm md:text-base text-gray-600">
              {t('questionnaire.section6.q9.embellishmentPlacementModalDescription')}
            </p>

            {selectedEmbellishments.map((embType, index) => (
              <div key={embType} className="space-y-2">
                <label className="block text-sm md:text-base font-medium text-accent-gold">
                  {index + 1}. {getEmbellishmentLabel(embType)}
                </label>
                <input
                  type="text"
                  value={localPlacements[embType] || ''}
                  onChange={(e) => handlePlacementChange(embType, e.target.value)}
                  placeholder={t('questionnaire.section6.q9.embellishmentPlacementPlaceholder')}
                  className={cn(
                    "w-full px-4 py-3 border-2 rounded-lg transition-all text-sm md:text-base",
                    "border-gray-200 focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20",
                    direction === 'rtl' ? 'text-right' : 'text-left'
                  )}
                  dir={direction}
                />
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 p-4 md:p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="lg"
                onClick={onClose}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleConfirm}
                disabled={!allPlacementsFilled}
                className="flex-1"
              >
                {t('common.confirm')}
              </Button>
            </div>
            {/* Skip button */}
            {onSkip && (
              <Button
                variant="outline"
                size="md"
                onClick={handleSkip}
                className="w-full text-gray-500 hover:text-gray-700"
              >
                {direction === 'rtl' ? 'تخطي تحديد الأماكن' : 'Skip placement selection'}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

