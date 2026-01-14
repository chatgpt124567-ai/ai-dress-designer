'use client';

import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ImageCardProps {
  src: string;
  alt: string;
  onView: () => void;
  onDownload?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export default function ImageCard({
  src,
  alt,
  onView,
  onDownload,
  onFavorite,
  isFavorite = false,
}: ImageCardProps) {
  const { t, direction } = useLanguage();
  return (
    <motion.div
      whileHover={{ y: -4, rotate: -1 }}
      className="elegant-frame cursor-pointer group relative"
    >
      <div className="relative aspect-[3/4] overflow-hidden" onClick={onView}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Small Save Icon - Bottom Right Corner */}
      {onDownload && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className={cn(
            "absolute bottom-4 z-10 p-2.5 rounded-full bg-accent-gold/90 hover:bg-accent-gold shadow-lg hover:shadow-xl transition-all duration-300",
            direction === 'rtl' ? 'left-4' : 'right-4'
          )}
          title={direction === 'rtl' ? 'حفظ' : 'Save'}
        >
          <Download className="w-4 h-4 text-white" />
        </motion.button>
      )}
    </motion.div>
  );
}

