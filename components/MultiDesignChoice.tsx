'use client';

import { motion } from 'framer-motion';
import { Sparkles, ListChecks, Grid2X2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import Button from './Button';

interface MultiDesignChoiceProps {
  fabricPreview?: string; // صورة القماش للمعاينة
  onChooseMultiple: () => void; // اختيار 5 تصاميم
  onChooseTraditional: () => void; // الاستمرار التقليدي
  onBack?: () => void; // العودة للخطوة السابقة
}

export default function MultiDesignChoice({
  fabricPreview,
  onChooseMultiple,
  onChooseTraditional,
  onBack,
}: MultiDesignChoiceProps) {
  const { direction } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* العنوان */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            {direction === 'rtl' ? 'كيف تريدين إنشاء تصميمك؟' : 'How would you like to create your design?'}
          </h2>
          <p className="text-neutral-600">
            {direction === 'rtl'
              ? 'اختاري الطريقة المناسبة لإنشاء تصميم فستانك'
              : 'Choose the best way to create your dress design'}
          </p>
        </div>

        {/* معاينة القماش المرفوع */}
        {fabricPreview && (
          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-accent-gold shadow-lg">
              <img
                src={fabricPreview}
                alt={direction === 'rtl' ? 'القماش المختار' : 'Selected Fabric'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-xs font-medium">
                {direction === 'rtl' ? 'قماشك' : 'Your Fabric'}
              </span>
            </div>
          </div>
        )}

        {/* الخيارات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* الخيار 1: توليد 5 تصاميم */}
          <motion.button
            onClick={onChooseMultiple}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'relative p-6 rounded-2xl border-2 text-start transition-all',
              'bg-gradient-to-br from-accent-gold/5 to-amber-50',
              'border-accent-gold/30 hover:border-accent-gold hover:shadow-xl',
              'group overflow-hidden'
            )}
          >
            {/* خلفية متوهجة */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative space-y-4">
              {/* الأيقونة */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-gold to-amber-500 flex items-center justify-center shadow-lg">
                <Grid2X2 className="w-8 h-8 text-white" />
              </div>

              {/* العنوان */}
              <div>
                <h3 className="text-xl font-bold text-primary mb-2">
                  {direction === 'rtl' ? '5 تصاميم مختلفة' : '5 Different Designs'}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {direction === 'rtl'
                    ? 'سيقوم الذكاء الاصطناعي بتحليل قماشك وإنشاء 5 تصاميم فريدة ومتنوعة تناسب خصائص هذا القماش'
                    : 'AI will analyze your fabric and create 5 unique, diverse designs that suit this fabric\'s characteristics'}
                </p>
              </div>

              {/* المميزات */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-accent-gold/10 rounded-full text-xs font-medium text-accent-gold">
                  {direction === 'rtl' ? 'سريع' : 'Fast'}
                </span>
                <span className="px-3 py-1 bg-purple-100 rounded-full text-xs font-medium text-purple-600">
                  {direction === 'rtl' ? 'تنوع' : 'Variety'}
                </span>
                <span className="px-3 py-1 bg-blue-100 rounded-full text-xs font-medium text-blue-600">
                  {direction === 'rtl' ? 'تلقائي' : 'Automatic'}
                </span>
              </div>

              {/* السهم */}
              <div className="flex items-center gap-2 text-accent-gold font-medium group-hover:gap-3 transition-all">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">
                  {direction === 'rtl' ? 'ابدئي الآن' : 'Start Now'}
                </span>
              </div>
            </div>
          </motion.button>

          {/* الخيار 2: الطريقة التقليدية */}
          <motion.button
            onClick={onChooseTraditional}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'relative p-6 rounded-2xl border-2 text-start transition-all',
              'bg-white',
              'border-gray-200 hover:border-gray-400 hover:shadow-xl',
              'group overflow-hidden'
            )}
          >
            <div className="relative space-y-4">
              {/* الأيقونة */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-lg">
                <ListChecks className="w-8 h-8 text-white" />
              </div>

              {/* العنوان */}
              <div>
                <h3 className="text-xl font-bold text-primary mb-2">
                  {direction === 'rtl' ? 'تصميم مخصص' : 'Custom Design'}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {direction === 'rtl'
                    ? 'أجيبي على أسئلة بسيطة لتحديد التفاصيل الدقيقة لتصميمك (الطول، الشكل، الرقبة، الأكمام...)'
                    : 'Answer simple questions to specify exact details of your design (length, shape, neckline, sleeves...)'}
                </p>
              </div>

              {/* المميزات */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                  {direction === 'rtl' ? 'تحكم كامل' : 'Full Control'}
                </span>
                <span className="px-3 py-1 bg-green-100 rounded-full text-xs font-medium text-green-600">
                  {direction === 'rtl' ? 'دقة عالية' : 'High Precision'}
                </span>
              </div>

              {/* السهم */}
              <div className="flex items-center gap-2 text-gray-600 font-medium group-hover:gap-3 transition-all">
                <ListChecks className="w-4 h-4" />
                <span className="text-sm">
                  {direction === 'rtl' ? 'ابدئي الاستبيان' : 'Start Questionnaire'}
                </span>
              </div>
            </div>
          </motion.button>
        </div>

        {/* زر العودة */}
        {onBack && (
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={onBack}>
              {direction === 'rtl' ? 'رجوع' : 'Back'}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

