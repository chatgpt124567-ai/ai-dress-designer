'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import Button from './Button';

interface TransparentPartsPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocations: string[];
  onLocationsChange: (locations: string[]) => void;
  onConfirm: () => void;
}

// خيارات أماكن الأجزاء الشفافة
const TRANSPARENT_LOCATIONS = [
  { value: 'sleeves', labelAr: 'الأكمام', labelEn: 'Sleeves' },
  { value: 'back', labelAr: 'الظهر', labelEn: 'Back' },
  { value: 'chest', labelAr: 'الصدر', labelEn: 'Chest' },
  { value: 'sides', labelAr: 'الجوانب', labelEn: 'Sides' },
  { value: 'waist', labelAr: 'الخصر', labelEn: 'Waist' },
  { value: 'neckline', labelAr: 'خط العنق', labelEn: 'Neckline' },
  { value: 'skirt', labelAr: 'التنورة', labelEn: 'Skirt' },
  { value: 'hem', labelAr: 'الذيل/الحاشية', labelEn: 'Hem/Train' },
];

export default function TransparentPartsPlacementModal({
  isOpen,
  onClose,
  selectedLocations,
  onLocationsChange,
  onConfirm,
}: TransparentPartsPlacementModalProps) {
  const { t, direction, language } = useLanguage();
  const [localSelections, setLocalSelections] = useState<string[]>([]);

  // Sync local state with props
  useEffect(() => {
    setLocalSelections(selectedLocations || []);
  }, [selectedLocations, isOpen]);

  const handleToggleLocation = (value: string) => {
    const updated = localSelections.includes(value)
      ? localSelections.filter(v => v !== value)
      : [...localSelections, value];
    setLocalSelections(updated);
    onLocationsChange(updated);
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const hasSelections = localSelections.length > 0;

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
              {language === 'ar' ? 'تحديد أماكن الأجزاء الشفافة' : 'Select Transparent Parts Location'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-gray-600 mb-4">
              {language === 'ar' 
                ? 'اختاري المناطق التي ترغبين أن تكون شفافة في التصميم:' 
                : 'Select the areas where you want transparent parts in your design:'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {TRANSPARENT_LOCATIONS.map((location) => {
                const isSelected = localSelections.includes(location.value);
                return (
                  <button
                    key={location.value}
                    onClick={() => handleToggleLocation(location.value)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                      isSelected
                        ? "border-accent-gold bg-accent-gold/10 text-primary"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    )}
                  >
                    <span className="font-medium text-sm">
                      {language === 'ar' ? location.labelAr : location.labelEn}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-accent-gold" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 md:p-6 border-t border-gray-200 bg-gray-50">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!hasSelections}
              className={!hasSelections ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {t('common.confirm')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

