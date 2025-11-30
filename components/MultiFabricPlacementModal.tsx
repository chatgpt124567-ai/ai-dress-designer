'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import Button from './Button';

interface MultiFabricPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFabrics: string[];
  fabricPlacements: { [fabricType: string]: string };
  onPlacementsChange: (placements: { [fabricType: string]: string }) => void;
  onConfirm: () => void;
}

export default function MultiFabricPlacementModal({
  isOpen,
  onClose,
  selectedFabrics,
  fabricPlacements,
  onPlacementsChange,
  onConfirm,
}: MultiFabricPlacementModalProps) {
  const { t, direction } = useLanguage();
  const [localPlacements, setLocalPlacements] = useState<{ [key: string]: string }>({});

  // Sync local state with props
  useEffect(() => {
    setLocalPlacements(fabricPlacements || {});
  }, [fabricPlacements, isOpen]);

  const handlePlacementChange = (fabricType: string, value: string) => {
    const updated = { ...localPlacements, [fabricType]: value };
    setLocalPlacements(updated);
    onPlacementsChange(updated);
  };

  const getFabricLabel = (fabricType: string): string => {
    return t(`questionnaire.section5.q8.options.${fabricType}`) || fabricType;
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // Check if all placements are filled
  const allPlacementsFilled = selectedFabrics.every(
    (fabric) => localPlacements[fabric] && localPlacements[fabric].trim() !== ''
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
              {t('questionnaire.section5.q8.fabricPlacementModalTitle')}
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
              {t('questionnaire.section5.q8.fabricPlacementModalDescription')}
            </p>

            {selectedFabrics.map((fabricType, index) => (
              <div key={fabricType} className="space-y-2">
                <label className="block text-sm md:text-base font-medium text-accent-gold">
                  {index + 1}. {getFabricLabel(fabricType)}
                </label>
                <input
                  type="text"
                  value={localPlacements[fabricType] || ''}
                  onChange={(e) => handlePlacementChange(fabricType, e.target.value)}
                  placeholder={t('questionnaire.section5.q8.fabricPlacementPlaceholder')}
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
          <div className="flex gap-3 p-4 md:p-6 border-t border-gray-200 bg-gray-50">
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

