'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface FabricPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fabricType: string;
  fabricNameAr: string;
  fabricNameEn: string;
}

// Mapping fabric types to image paths
// Using real fabric images from public folder
const FABRIC_IMAGES: { [key: string]: string } = {
  satin: '/SATIN FABRIC.png',
  silk: '/SILK FABRIC.png',
  chiffon: '/CHIFFON FABRIC.png',
  tulle: '/TULLE FABRIC.png',
  lace: '/LACE FABRIC.png',
  velvet: '/VELVET FABRIC.png',
  organza: '/ORGANZA FABRIC.png',
  crepe: '/CREPE FABRIC.png',
};

// Fallback placeholder image
const PLACEHOLDER_IMAGE = '/fabric-samples/placeholder.svg';

export default function FabricPreviewModal({
  isOpen,
  onClose,
  fabricType,
  fabricNameAr,
  fabricNameEn,
}: FabricPreviewModalProps) {
  const { t, direction, language } = useLanguage();

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

  const fabricImagePath = FABRIC_IMAGES[fabricType] || PLACEHOLDER_IMAGE;
  const fabricName = language === 'ar' ? fabricNameAr : fabricNameEn;

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
              aria-labelledby="fabric-preview-title"
            >
              {/* Header - Fabric Name Only, Centered */}
              <div className="p-4 md:p-6 border-b border-gray-200">
                <h2
                  id="fabric-preview-title"
                  className="text-xl md:text-2xl font-headline font-bold text-accent-gold text-center"
                >
                  {fabricName}
                </h2>
              </div>

              {/* Image Content - Square Aspect Ratio */}
              <div className="p-4 md:p-6">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={fabricImagePath}
                    alt={t('fabricPreview.imageAlt', { fabricName })}
                    fill
                    className="object-cover"
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
                  {t('fabricPreview.close')}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

