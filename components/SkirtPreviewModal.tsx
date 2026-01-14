'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SkirtPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  skirtType: string;
  skirtNameAr: string;
  skirtNameEn: string;
}

// Mapping skirt types to image paths
// Using real skirt images from public folder
const SKIRT_IMAGES: { [key: string]: string } = {
  sideDrape: '/SIDE DRAPE SKIRT.png',
  peplum: '/PEPLUM WAIST SKIRT.png',
  overskirt: '/SKIRT WITH  OVERSKIRT.png',
  mermaidTail: '/FISHTAIL SKIRT.png',
  layered: '/MULTI-LAYERED  TIERED SKIRT.png',
};

// Fallback placeholder image
const PLACEHOLDER_IMAGE = '/fabric-samples/placeholder.svg';

export default function SkirtPreviewModal({
  isOpen,
  onClose,
  skirtType,
  skirtNameAr,
  skirtNameEn,
}: SkirtPreviewModalProps) {
  const { language, direction, t } = useLanguage();

  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Get the image path for the skirt type
  const skirtImagePath = SKIRT_IMAGES[skirtType] || PLACEHOLDER_IMAGE;

  // Get the skirt name based on current language
  const skirtName = language === 'ar' ? skirtNameAr : skirtNameEn;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="skirt-preview-title"
            >
              {/* Header - Skirt Name Only, Centered */}
              <div className="p-4 md:p-6 border-b border-gray-200">
                <h2
                  id="skirt-preview-title"
                  className="text-xl md:text-2xl font-headline font-bold text-accent-gold text-center"
                >
                  {skirtName}
                </h2>
              </div>

              {/* Disclaimer Note */}
              <div className="px-4 md:px-6 pt-4 md:pt-6">
                <div className="bg-accent-gold/10 border border-accent-gold/30 rounded-lg p-3 md:p-4">
                  <p className="text-xs md:text-sm text-gray-700 text-center leading-relaxed">
                    {t('skirtPreview.disclaimer')}
                  </p>
                </div>
              </div>

              {/* Image Content - Full Image Display */}
              <div className="p-4 md:p-6 flex items-center justify-center">
                <div className="relative w-full max-h-[60vh] rounded-lg overflow-hidden">
                  <Image
                    src={skirtImagePath}
                    alt={t('skirtPreview.imageAlt', { skirtName })}
                    width={800}
                    height={1000}
                    className="w-full h-auto object-contain"
                    sizes="(max-width: 768px) 100vw, 768px"
                    quality={100}
                    priority
                    unoptimized={true}
                    onError={(e) => {
                      // Fallback to placeholder on error
                      const target = e.target as HTMLImageElement;
                      target.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>
              </div>

              {/* Footer with Close Button */}
              <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={onClose}
                  className="w-full px-6 py-3 bg-accent-gold text-white font-medium rounded-lg hover:bg-accent-gold/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2"
                >
                  {t('skirtPreview.close')}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

