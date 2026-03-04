'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import Button from './Button';

interface FabricPlacementStepProps {
  hasSecondaryFabric: boolean;
  initialPrimaryPlacement?: string;
  initialSecondaryPlacement?: string;
  initialSecondaryColor?: string;
  onComplete: (data: {
    primaryFabricPlacement: string;
    secondaryFabricPlacement?: string;
    secondaryFabricColor?: string;
  }) => void;
  onBack?: () => void;
}

export default function FabricPlacementStep({
  hasSecondaryFabric,
  initialPrimaryPlacement,
  initialSecondaryPlacement,
  initialSecondaryColor,
  onComplete,
  onBack,
}: FabricPlacementStepProps) {
  const { t, direction } = useLanguage();

  const [primaryPlacement, setPrimaryPlacement] = useState(initialPrimaryPlacement || '');
  const [secondaryPlacement, setSecondaryPlacement] = useState(initialSecondaryPlacement || '');
  const [secondaryColor, setSecondaryColor] = useState(initialSecondaryColor || '');

  const handleContinue = () => {
    if (!primaryPlacement.trim()) {
      alert(direction === 'rtl'
        ? 'يرجى تحديد موضع القماش الأساسي'
        : 'Please specify primary fabric placement'
      );
      return;
    }

    if (hasSecondaryFabric && !secondaryPlacement.trim()) {
      alert(direction === 'rtl'
        ? 'يرجى تحديد موضع القماش الثانوي'
        : 'Please specify secondary fabric placement'
      );
      return;
    }

    if (hasSecondaryFabric && !secondaryColor.trim()) {
      alert(t('design.ownFabric.placement.secondaryColorRequired'));
      return;
    }

    onComplete({
      primaryFabricPlacement: primaryPlacement,
      secondaryFabricPlacement: hasSecondaryFabric ? secondaryPlacement : undefined,
      secondaryFabricColor: hasSecondaryFabric ? secondaryColor : undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >


        {/* Primary Fabric Placement */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <label className="block">
            <span className="text-lg font-semibold text-primary mb-2 block">
              {t('design.ownFabric.placement.primaryLabel')}
            </span>
            <textarea
              value={primaryPlacement}
              onChange={(e) => setPrimaryPlacement(e.target.value)}
              placeholder={t('design.ownFabric.placement.primaryPlaceholder')}
              className={cn(
                'w-full px-4 py-3 border-2 border-gray-200 rounded-lg',
                'focus:border-accent-gold focus:outline-none',
                'resize-none h-24',
                'text-base'
              )}
              dir={direction}
            />
          </label>
        </div>

        {/* Secondary Fabric Placement */}
        {hasSecondaryFabric && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-5">
            <label className="block">
              <span className="text-lg font-semibold text-primary mb-2 block">
                {t('design.ownFabric.placement.secondaryLabel')}
              </span>
              <textarea
                value={secondaryPlacement}
                onChange={(e) => setSecondaryPlacement(e.target.value)}
                placeholder={t('design.ownFabric.placement.secondaryPlaceholder')}
                className={cn(
                  'w-full px-4 py-3 border-2 border-gray-200 rounded-lg',
                  'focus:border-accent-gold focus:outline-none',
                  'resize-none h-24',
                  'text-base'
                )}
                dir={direction}
              />
            </label>

            {/* Secondary Fabric Color */}
            <label className="block">
              <span className="text-lg font-semibold text-primary mb-2 block">
                {t('design.ownFabric.placement.secondaryColorLabel')}
                <span className="text-red-500 ms-1">*</span>
              </span>
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder={t('design.ownFabric.placement.secondaryColorPlaceholder')}
                className={cn(
                  'w-full px-4 py-3 border-2 rounded-lg',
                  'focus:outline-none transition-colors duration-200',
                  secondaryColor.trim()
                    ? 'border-accent-gold'
                    : 'border-gray-200 focus:border-accent-gold',
                  'text-base'
                )}
                dir={direction}
              />
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              {direction === 'rtl' ? 'رجوع' : 'Back'}
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleContinue}
            disabled={
            !primaryPlacement.trim() ||
            (hasSecondaryFabric && !secondaryPlacement.trim()) ||
            (hasSecondaryFabric && !secondaryColor.trim())
          }
            className="flex-1"
          >
            {t('design.ownFabric.placement.continue')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

