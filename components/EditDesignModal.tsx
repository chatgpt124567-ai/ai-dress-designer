'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MapPin, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import Button from './Button';

interface EditDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (editRequest: string, model: string) => void;
  loading?: boolean;
}

type Step = 'location' | 'description' | 'modelSelection';

const LOCATION_OPTIONS = [
  'bodice',
  'sleeves',
  'skirt',
  'neckline',
  'waist',
  'back',
  'fullBody',
  'other',
] as const;

export default function EditDesignModal({ isOpen, onClose, onSubmit, loading = false }: EditDesignModalProps) {
  const { t, direction } = useLanguage();
  const [step, setStep] = useState<Step>('location');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [otherLocation, setOtherLocation] = useState('');
  const [modificationDescription, setModificationDescription] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('google/gemini-3.1-flash-image-preview');
  const [refining, setRefining] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('location');
      setSelectedLocations([]);
      setOtherLocation('');
      setModificationDescription('');
      setSelectedModel('google/gemini-3.1-flash-image-preview');
    }
  }, [isOpen]);

  const handleLocationToggle = (location: string) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const handleNextToDescription = () => {
    if (selectedLocations.length === 0) {
      return; // Validation handled by button disabled state
    }
    setStep('description');
  };

  const handleBackToLocation = () => {
    setStep('location');
  };

  const handleNextToModelSelection = () => {
    if (!modificationDescription.trim()) {
      return;
    }
    setStep('modelSelection');
  };

  const handleBackToDescription = () => {
    setStep('description');
  };

  const handleSubmit = async (model: string) => {
    try {
      setRefining(true);

      // Build locations array with translated names
      const locations = selectedLocations.map(loc => {
        if (loc === 'other' && otherLocation.trim()) {
          return otherLocation.trim();
        }
        return t(`design.edit.locationSelection.locations.${loc}`);
      });

      // Call the refine-modification-prompt API
      const refineResponse = await fetch('/api/refine-modification-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locations,
          modificationDescription: modificationDescription.trim(),
        }),
      });

      if (!refineResponse.ok) {
        throw new Error('Failed to refine modification prompt');
      }

      const refineData = await refineResponse.json();

      if (refineData.error) {
        throw new Error(refineData.error);
      }

      // Pass the refined prompt and selected model to the parent component
      onSubmit(refineData.refinedPrompt, model);

      // Reset form
      setStep('location');
      setSelectedLocations([]);
      setOtherLocation('');
      setModificationDescription('');
      setSelectedModel('google/gemini-3.1-flash-image-preview');
    } catch (error) {
      console.error('Error refining modification:', error);
      // Fallback: use the original description if refinement fails
      onSubmit(modificationDescription.trim(), model);
    } finally {
      setRefining(false);
    }
  };

  const handleClose = () => {
    if (!loading && !refining) {
      setStep('location');
      setSelectedLocations([]);
      setOtherLocation('');
      setModificationDescription('');
      onClose();
    }
  };

  const isProcessing = loading || refining;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
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
                    {step === 'location' ? (
                      <MapPin className="w-5 h-5 text-accent-gold" />
                    ) : step === 'description' ? (
                      <FileText className="w-5 h-5 text-accent-gold" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-accent-gold" />
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-primary">
                    {step === 'location'
                      ? t('design.edit.locationSelection.title')
                      : step === 'description'
                      ? t('design.edit.descriptionStep.title')
                      : direction === 'rtl'
                      ? 'اختيار نموذج الذكاء الاصطناعي'
                      : 'Select AI Model'
                    }
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  className={cn(
                    'w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors',
                    isProcessing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {step === 'location' ? (
                    <motion.div
                      key="location"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <p className="text-neutral-600 text-sm md:text-base">
                        {t('design.edit.locationSelection.subtitle')}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {LOCATION_OPTIONS.map((location) => (
                          <label
                            key={location}
                            className={cn(
                              'flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                              selectedLocations.includes(location)
                                ? 'border-accent-gold bg-accent-gold/5'
                                : 'border-gray-200 hover:border-accent-gold/50',
                              isProcessing && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={selectedLocations.includes(location)}
                              onChange={() => handleLocationToggle(location)}
                              disabled={isProcessing}
                              className="w-5 h-5 text-accent-gold rounded border-gray-300 focus:ring-accent-gold"
                            />
                            <span className="text-sm md:text-base text-primary font-medium">
                              {t(`design.edit.locationSelection.locations.${location}`)}
                            </span>
                          </label>
                        ))}
                      </div>

                      {/* Other location text input */}
                      {selectedLocations.includes('other') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <input
                            type="text"
                            value={otherLocation}
                            onChange={(e) => setOtherLocation(e.target.value)}
                            placeholder={t('design.edit.locationSelection.otherPlaceholder')}
                            disabled={isProcessing}
                            className={cn(
                              'w-full px-4 py-3 border-2 border-gray-200 rounded-lg',
                              'focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20',
                              'transition-all text-sm md:text-base',
                              'disabled:opacity-50 disabled:cursor-not-allowed',
                              direction === 'rtl' ? 'text-right' : 'text-left'
                            )}
                            dir={direction}
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  ) : step === 'description' ? (
                    <motion.div
                      key="description"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      {/* Elegant note encouraging detailed descriptions */}
                      <div className="bg-gradient-to-br from-accent-gold/10 to-primary/5 rounded-lg p-4 border border-accent-gold/20">
                        <p className="text-sm md:text-base text-primary leading-relaxed">
                          {t('design.edit.descriptionStep.subtitle')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-primary">
                          {t('design.edit.descriptionStep.label')}
                        </label>
                        <textarea
                          value={modificationDescription}
                          onChange={(e) => setModificationDescription(e.target.value)}
                          placeholder={t('design.edit.descriptionStep.placeholder')}
                          disabled={isProcessing}
                          rows={8}
                          className={cn(
                            'w-full px-4 py-3 border-2 border-gray-200 rounded-lg',
                            'focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20',
                            'transition-all text-sm md:text-base resize-none',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            direction === 'rtl' ? 'text-right' : 'text-left'
                          )}
                          dir={direction}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="modelSelection"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      <p className="text-neutral-600 text-sm md:text-base">
                        {direction === 'rtl'
                          ? 'اختاري نموذج الذكاء الاصطناعي المناسب لنوع التعديل المطلوب'
                          : 'Choose the AI model that best suits your modification needs'
                        }
                      </p>

                      <div className="grid grid-cols-1 gap-4">
                        {/* Simple Model Option */}
                        <button
                          onClick={() => handleSubmit('google/gemini-3.1-flash-image-preview')}
                          disabled={isProcessing}
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
                                  ? 'مناسب للتعديلات البسيطة مثل تغيير الألوان، إضافة تطريزات بسيطة، تعديل الطول'
                                  : 'Suitable for simple modifications like color changes, basic embellishments, length adjustments'
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
                          onClick={() => handleSubmit('google/gemini-3-pro-image-preview')}
                          disabled={isProcessing}
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
                                  ? 'مناسب للتعديلات المعقدة مثل تغيير التصميم الكامل، إضافة تفاصيل معقدة، تعديلات هيكلية'
                                  : 'Suitable for complex modifications like complete redesigns, intricate details, structural changes'
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 flex gap-3">
                {step === 'location' ? (
                  <>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={handleClose}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleNextToDescription}
                      disabled={isProcessing || selectedLocations.length === 0}
                      className="flex-1"
                    >
                      {t('design.edit.locationSelection.next')}
                    </Button>
                  </>
                ) : step === 'description' ? (
                  <>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={handleBackToLocation}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {t('design.edit.descriptionStep.back')}
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleNextToModelSelection}
                      disabled={isProcessing || !modificationDescription.trim()}
                      className="flex-1"
                    >
                      {direction === 'rtl' ? 'التالي' : 'Next'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={handleBackToDescription}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {direction === 'rtl' ? 'رجوع' : 'Back'}
                    </Button>
                    {/* Model selection buttons are in the content area */}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

