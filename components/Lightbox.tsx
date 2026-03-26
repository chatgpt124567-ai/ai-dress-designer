'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  prompt?: string;
  timestamp?: string;
}

export default function Lightbox({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  prompt,
  timestamp,
}: LightboxProps) {
  const { t, direction } = useLanguage();
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className={cn(
              "absolute top-4 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors",
              direction === 'rtl' ? 'left-4' : 'right-4'
            )}
            aria-label={t('lightbox.close')}
          >
            <X size={24} className="text-white" />
          </button>

          <motion.img
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            src={imageSrc}
            alt={imageAlt}
            className="max-w-full max-h-full w-full h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

