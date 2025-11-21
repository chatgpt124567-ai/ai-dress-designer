'use client';

import { motion } from 'framer-motion';
import { Download, Heart, Palette, Sparkles } from 'lucide-react';
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
      className="elegant-frame cursor-pointer group"
      onClick={onView}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Overlay removed - no icons on hover */}
      </div>
    </motion.div>
  );
}

