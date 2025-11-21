'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Languages } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 xl:gap-2 px-2 xl:px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
      aria-label="Toggle language"
    >
      <Languages className="w-4 h-4 xl:w-5 xl:h-5 text-neutral-500 flex-shrink-0" />
      <motion.span
        key={language}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs xl:text-sm font-medium text-primary whitespace-nowrap"
      >
        {language === 'en' ? 'العربية' : 'English'}
      </motion.span>
    </button>
  );
}

