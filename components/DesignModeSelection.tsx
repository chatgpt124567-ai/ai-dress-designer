'use client';

import { motion } from 'framer-motion';
import { Sparkles, Wand2, Scissors, UserX } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface DesignModeSelectionProps {
  onSelectMode: (mode: 'scratch' | 'external' | 'ownFabric' | 'removeModel') => void;
}

export default function DesignModeSelection({ onSelectMode }: DesignModeSelectionProps) {
  const { direction } = useLanguage();

  const modes = [
    {
      id: 'scratch' as const,
      icon: Sparkles,
      titleAr: 'ابتكري تصميمك',
      titleEn: 'Create Your Vision',
      subtitleAr: 'إنشاء تصميم جديد من اختيارك',
      subtitleEn: 'From imagination to reality',
    },
    {
      id: 'external' as const,
      icon: Wand2,
      titleAr: 'عدلي تصميمك',
      titleEn: 'Elevate a Design',
      subtitleAr: 'إجراء تعديل على تصميمك الخاص',
      subtitleEn: 'Add your unique touch',
    },
    {
      id: 'ownFabric' as const,
      icon: Scissors,
      titleAr: 'قماشك الخاص',
      titleEn: 'Your Fabric, Our Art',
      subtitleAr: 'إنشاء فستان من قماشك الخاص ',
      subtitleEn: 'A dress from your fabric',
    },
    {
      id: 'removeModel' as const,
      icon: UserX,
      titleAr: 'إزالة العارضة',
      titleEn: 'Remove Model',
      subtitleAr: 'استبدال العارضة بمانيكان أنيق',
      subtitleEn: 'Replace model with elegant mannequin',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center px-3 sm:px-4 py-4 sm:py-6 md:py-12 min-h-[70vh]">
      {/* Luxurious Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-4 sm:mb-6 md:mb-14"
      >
        {/* Decorative Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="w-12 sm:w-16 h-[2px] bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto mb-3 sm:mb-4 md:mb-6"
        />

        <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-headline font-bold text-primary mb-2 sm:mb-3 tracking-tight">
          {direction === 'rtl' ? 'كيف نبدأ رحلتك؟' : 'How Shall We Begin?'}
        </h1>

        <p className="text-neutral-400 text-xs sm:text-sm md:text-lg max-w-md mx-auto font-light tracking-wide">
          {direction === 'rtl'
            ? 'اختاري أسلوب التصميم المناسب لك'
            : 'Choose your path to couture excellence'}
        </p>

        {/* Decorative Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="w-12 sm:w-16 h-[2px] bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto mt-3 sm:mt-4 md:mt-6"
        />
      </motion.div>

      {/* Luxurious Cards */}
      <div className="flex flex-col gap-2.5 sm:gap-4 md:gap-5 w-full max-w-sm sm:max-w-md md:max-w-4xl lg:max-w-5xl md:flex-row md:gap-6">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          return (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2 + index * 0.15,
                duration: 0.5,
                ease: 'easeOut'
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectMode(mode.id)}
              className={cn(
                'group relative overflow-hidden flex-1',
                'p-3 sm:p-5 md:p-8 lg:p-10',
                'rounded-xl sm:rounded-2xl md:rounded-3xl',
                'bg-gradient-to-br from-white via-white to-amber-50/30',
                'border border-amber-100/50',
                'shadow-lg shadow-amber-900/5',
                'hover:shadow-2xl hover:shadow-accent-gold/20',
                'hover:border-accent-gold/40',
                'transition-all duration-500 ease-out',
                'text-center w-full',
                'min-h-[120px] sm:min-h-[160px] md:min-h-[240px] lg:min-h-[280px]',
                'flex flex-col items-center justify-center'
              )}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-gold/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              </div>

              {/* Golden Corner Accents */}
              <div className="absolute top-0 left-0 w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-accent-gold/60 to-transparent" />
                <div className="absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b from-accent-gold/60 to-transparent" />
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16">
                <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-accent-gold/60 to-transparent" />
                <div className="absolute bottom-0 right-0 h-full w-[1px] bg-gradient-to-t from-accent-gold/60 to-transparent" />
              </div>

              {/* Icon with Glow */}
              <motion.div
                className="relative mb-2 sm:mb-3 md:mb-5 lg:mb-6"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-accent-gold/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className={cn(
                  'relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20',
                  'rounded-xl sm:rounded-2xl md:rounded-3xl',
                  'bg-gradient-to-br from-accent-gold via-amber-400 to-amber-500',
                  'flex items-center justify-center',
                  'shadow-lg shadow-accent-gold/30',
                  'group-hover:shadow-xl group-hover:shadow-accent-gold/40',
                  'transition-all duration-500'
                )}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white drop-shadow-sm" />
                </div>
              </motion.div>

              {/* Title */}
              <h2 className="relative text-sm sm:text-base md:text-xl lg:text-2xl font-headline font-bold text-primary mb-1 sm:mb-1.5 md:mb-2 tracking-tight leading-tight">
                {direction === 'rtl' ? mode.titleAr : mode.titleEn}
              </h2>

              {/* Subtitle */}
              <p className="relative text-[10px] sm:text-xs md:text-sm lg:text-base text-neutral-400 font-light tracking-wide leading-snug">
                {direction === 'rtl' ? mode.subtitleAr : mode.subtitleEn}
              </p>

              {/* Hover Indicator */}
              <motion.div
                className="absolute bottom-2 sm:bottom-3 md:bottom-5 lg:bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300"
                initial={{ y: 10 }}
                whileHover={{ y: 0 }}
              >
                <div className="flex items-center gap-1 text-accent-gold text-[10px] sm:text-xs font-medium tracking-widest uppercase">
                  <span>{direction === 'rtl' ? 'اختاري' : 'Select'}</span>
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {direction === 'rtl' ? '←' : '→'}
                  </motion.span>
                </div>
              </motion.div>

              {/* Bottom Gradient Line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Decorative Element */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-4 sm:mt-6 md:mt-10 lg:mt-14 flex items-center gap-2 sm:gap-3"
      >
        <div className="w-6 sm:w-8 h-[1px] bg-gradient-to-r from-transparent to-accent-gold/40" />
        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-accent-gold/40" />
        <div className="w-6 sm:w-8 h-[1px] bg-gradient-to-l from-transparent to-accent-gold/40" />
      </motion.div>
    </div>
  );
}

