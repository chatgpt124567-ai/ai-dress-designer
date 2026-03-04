'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import Button from './Button';
import type { GeminiImageModel } from '@/types';

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (model: GeminiImageModel) => void;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

export default function ModelSelectionModal({
  isOpen,
  onClose,
  onSelectModel,
  loading = false,
  title,
  subtitle,
}: ModelSelectionModalProps) {
  const { t, direction } = useLanguage();

  const handleModelSelect = (model: GeminiImageModel) => {
    onSelectModel(model);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                'bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden',
                'flex flex-col'
              )}
              dir={direction}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-gold/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-accent-gold" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-primary">
                    {title || (direction === 'rtl' ? 'اختيار نموذج الذكاء الاصطناعي' : 'Select AI Model')}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-neutral-600 text-sm md:text-base mb-6">
                  {subtitle || (direction === 'rtl'
                    ? 'اختاري نموذج الذكاء الاصطناعي المناسب لنوع التصميم المطلوب'
                    : 'Choose the AI model that best suits your design needs'
                  )}
                </p>

                <div className="grid grid-cols-1 gap-4">
                  {/* Simple Model Option */}
                  <button
                    onClick={() => handleModelSelect('google/gemini-3.1-flash-image-preview')}
                    disabled={loading}
                    className={cn(
                      'group relative p-6 rounded-xl border-2 transition-all text-start',
                      'hover:border-accent-gold hover:shadow-lg',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'border-gray-200 bg-white'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-primary mb-2">
                          {direction === 'rtl' ? 'نموذج عادي (سريع)' : 'Simple Model (Fast)'}
                        </h3>
                        <p className="text-sm text-neutral-600 mb-3">
                          {direction === 'rtl'
                            ? 'مناسب للتصاميم البسيطة والتعديلات السريعة. يوفر نتائج جيدة بسرعة عالية.'
                            : 'Suitable for simple designs and quick modifications. Provides good results with high speed.'
                          }
                        </p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <span className="px-2 py-1 bg-blue-50 rounded-full">
                            {direction === 'rtl' ? 'سريع' : 'Fast'}
                          </span>
                          <span className="px-2 py-1 bg-green-50 rounded-full">
                            {direction === 'rtl' ? 'اقتصادي' : 'Economical'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Advanced Model Option */}
                  <button
                    onClick={() => handleModelSelect('google/gemini-3-pro-image-preview')}
                    disabled={loading}
                    className={cn(
                      'group relative p-6 rounded-xl border-2 transition-all text-start',
                      'hover:border-accent-gold hover:shadow-lg',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-primary mb-2">
                          {direction === 'rtl' ? 'نموذج متقدم (احترافي)' : 'Advanced Model (Professional)'}
                        </h3>
                        <p className="text-sm text-neutral-600 mb-3">
                          {direction === 'rtl'
                            ? 'مناسب للتصاميم المعقدة والتفاصيل الدقيقة. يوفر أعلى جودة ودقة في النتائج.'
                            : 'Suitable for complex designs and intricate details. Provides highest quality and precision.'
                          }
                        </p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <span className="px-2 py-1 bg-purple-100 rounded-full">
                            {direction === 'rtl' ? 'دقة عالية' : 'High Quality'}
                          </span>
                          <span className="px-2 py-1 bg-pink-100 rounded-full">
                            {direction === 'rtl' ? 'احترافي' : 'Professional'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

