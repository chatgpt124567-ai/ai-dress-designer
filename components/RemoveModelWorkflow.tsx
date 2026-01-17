'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Upload, Sparkles, Download, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import Button from './Button';
import Lightbox from './Lightbox';
import { createClient } from '@/lib/supabase/client';
import { processAndUploadDesignImage } from '@/lib/imageUtils';
import type { GeminiImageModel } from '@/types';

interface RemoveModelWorkflowProps {
  onBack: () => void;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}

type WorkflowStep = 'upload' | 'processing' | 'result';

// localStorage keys for state persistence
const STORAGE_REMOVE_MODEL_STEP_KEY = 'remove_model_workflow_step';
const STORAGE_REMOVE_MODEL_IMAGE_KEY = 'remove_model_current_image';
const STORAGE_REMOVE_MODEL_RESULT_KEY = 'remove_model_result_image';

export default function RemoveModelWorkflow({
  onBack,
  isAuthenticated,
  onAuthRequired,
}: RemoveModelWorkflowProps) {
  const { direction } = useLanguage();

  // Workflow state
  const [step, setStep] = useState<WorkflowStep>('upload');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [resultImage, setResultImage] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<GeminiImageModel>('google/gemini-2.5-flash-image');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string>('');

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const savedStep = localStorage.getItem(STORAGE_REMOVE_MODEL_STEP_KEY);
      const savedImage = localStorage.getItem(STORAGE_REMOVE_MODEL_IMAGE_KEY);
      const savedResult = localStorage.getItem(STORAGE_REMOVE_MODEL_RESULT_KEY);

      if (savedStep === 'result' && savedImage && savedResult) {
        setStep('result');
        setUploadedImage(savedImage);
        setResultImage(savedResult);
      }
    } catch (error) {
      console.error('Error restoring remove model workflow state:', error);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (step === 'result' && uploadedImage && resultImage) {
      localStorage.setItem(STORAGE_REMOVE_MODEL_STEP_KEY, step);
      localStorage.setItem(STORAGE_REMOVE_MODEL_IMAGE_KEY, uploadedImage);
      localStorage.setItem(STORAGE_REMOVE_MODEL_RESULT_KEY, resultImage);
    }
  }, [step, uploadedImage, resultImage]);

  // Clear localStorage when going back
  const handleBack = () => {
    localStorage.removeItem(STORAGE_REMOVE_MODEL_STEP_KEY);
    localStorage.removeItem(STORAGE_REMOVE_MODEL_IMAGE_KEY);
    localStorage.removeItem(STORAGE_REMOVE_MODEL_RESULT_KEY);
    onBack();
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(direction === 'rtl' ? 'يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP' : 'Please select a JPG, PNG, or WEBP image');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(direction === 'rtl' ? 'حجم الصورة يجب أن يكون أقل من 10 ميجابايت' : 'Image size must be less than 10MB');
      return;
    }

    setError('');

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedImage(base64);
      // Stay on upload step to show preview with submit button
    };
    reader.readAsDataURL(file);
  };

  // Handle submit - start processing with fast model
  const handleSubmit = () => {
    if (!uploadedImage) return;
    handleModelSelect('google/gemini-2.5-flash-image');
  };

  // Auto-save to profile (called automatically after successful processing)
  const autoSaveToProfile = async (imageResult: string, model: GeminiImageModel) => {
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping auto-save');
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('No user found, skipping auto-save');
        return;
      }

      // Generate unique ID
      const designId = crypto.randomUUID();

      // Upload images
      const { fullImageUrl, thumbnailUrl, fullImagePath, thumbnailPath } =
        await processAndUploadDesignImage(user.id, designId, imageResult);

      // Save to model_removed_designs table
      const { error: dbError } = await supabase.from('model_removed_designs').insert({
        id: designId,
        user_id: user.id,
        original_image_url: uploadedImage,
        result_image_url: fullImageUrl,
        result_storage_path: fullImagePath,
        result_thumbnail_url: thumbnailUrl,
        result_thumbnail_storage_path: thumbnailPath,
        model_used: model,
      });

      if (dbError) {
        console.error('Error auto-saving to database:', dbError.message);
      } else {
        console.log('Design auto-saved successfully');
      }
    } catch (err) {
      console.error('Error in auto-save:', err);
    }
  };

  // Handle model selection and start processing
  const handleModelSelect = async (model: GeminiImageModel) => {
    setSelectedModel(model);
    setStep('processing');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/remove-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: uploadedImage,
          model: model,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to process image');
      }

      setResultImage(data.imageData);
      setStep('result');

      // Auto-save to profile for authenticated users
      autoSaveToProfile(data.imageData, model);
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err instanceof Error ? err.message : direction === 'rtl' ? 'حدث خطأ أثناء معالجة الصورة' : 'Error processing image');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  // Handle try again
  const handleTryAgain = () => {
    setUploadedImage('');
    setResultImage('');
    setStep('upload');
    localStorage.removeItem(STORAGE_REMOVE_MODEL_STEP_KEY);
    localStorage.removeItem(STORAGE_REMOVE_MODEL_IMAGE_KEY);
    localStorage.removeItem(STORAGE_REMOVE_MODEL_RESULT_KEY);
  };

  // Handle download image
  const handleDownloadImage = () => {
    if (!resultImage) return;

    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `dress-design-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open lightbox
  const openLightbox = (image: string) => {
    setLightboxImage(image);
    setLightboxOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <AnimatePresence mode="wait">
        {/* Upload Step */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="w-16 h-[2px] bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto mb-4"
              />
              <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary mb-2">
                {direction === 'rtl' ? 'إزالة العارضة من الصورة' : 'Remove Model from Image'}
              </h1>
              <p className="text-neutral-500 text-sm md:text-base max-w-md mx-auto">
                {direction === 'rtl'
                  ? 'ارفعي صورة فستان مع عارضة وسنستبدلها بمانيكان أنيق'
                  : 'Upload a dress image with a model and we\'ll replace it with an elegant mannequin'}
              </p>
            </div>

            {/* Upload Area or Image Preview */}
            <div className="luxury-card p-8">
              {!uploadedImage ? (
                // Upload area when no image
                <label
                  htmlFor="image-upload"
                  className={cn(
                    'flex flex-col items-center justify-center',
                    'w-full min-h-[300px] md:min-h-[400px]',
                    'border-2 border-dashed border-accent-gold/30 rounded-2xl',
                    'bg-gradient-to-br from-accent-gold/5 to-transparent',
                    'hover:border-accent-gold/50 hover:bg-accent-gold/10',
                    'transition-all duration-300 cursor-pointer group'
                  )}
                >
                  <div className="flex flex-col items-center gap-4 p-8">
                    <div className="w-20 h-20 rounded-full bg-accent-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-10 h-10 text-accent-gold" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-primary mb-2">
                        {direction === 'rtl' ? 'اختاري صورة من جهازك' : 'Choose an image from your device'}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {direction === 'rtl' ? 'JPG, PNG, WEBP - حتى 10 ميجابايت' : 'JPG, PNG, WEBP - up to 10MB'}
                      </p>
                    </div>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                // Image preview when uploaded
                <div className="space-y-6">
                  <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-xl overflow-hidden border-2 border-accent-gold/20">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full h-full object-cover"
                    />
                    {/* Change image button */}
                    <label
                      htmlFor="image-upload-change"
                      className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 hover:bg-white rounded-lg cursor-pointer transition-colors text-sm font-medium text-primary"
                    >
                      {direction === 'rtl' ? 'تغيير' : 'Change'}
                      <input
                        id="image-upload-change"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      className="gap-2 px-8"
                    >
                      <Sparkles className="w-4 h-4" />
                      {direction === 'rtl' ? 'إرسال' : 'Submit'}
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-center mt-4"
                >
                  {error}
                </motion.p>
              )}
            </div>

            {/* Back Button */}
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleBack} className="gap-2">
                {direction === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {direction === 'rtl' ? 'رجوع' : 'Back'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-[400px] space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-accent-gold/10 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              >
                <Sparkles className="w-10 h-10 text-accent-gold" />
              </motion.div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-headline font-bold text-primary mb-2">
                {direction === 'rtl' ? 'جاري معالجة الصورة...' : 'Processing Image...'}
              </h3>
              <p className="text-neutral-500 text-sm">
                {direction === 'rtl'
                  ? 'يتم استبدال العارضة بمانيكان أنيق، يرجى الانتظار'
                  : 'Replacing the model with an elegant mannequin, please wait'}
              </p>
            </div>
          </motion.div>
        )}



        {/* Result Step */}
        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="w-16 h-[2px] bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto mb-4"
              />
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-primary mb-2">
                {direction === 'rtl' ? 'النتيجة' : 'Result'}
              </h2>
              <p className="text-neutral-500 text-sm md:text-base max-w-md mx-auto">
                {direction === 'rtl'
                  ? 'تم استبدال العارضة بمانيكان أنيق بنجاح'
                  : 'The model has been successfully replaced with an elegant mannequin'}
              </p>
            </div>

            {/* Before/After Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before */}
              <div className="luxury-card p-4">
                <h4 className="text-center text-sm font-semibold text-neutral-500 mb-3">
                  {direction === 'rtl' ? 'قبل' : 'Before'}
                </h4>
                <div
                  className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => openLightbox(uploadedImage)}
                >
                  <img
                    src={uploadedImage}
                    alt="Original"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              {/* After */}
              <div className="luxury-card p-4">
                <h4 className="text-center text-sm font-semibold text-accent-gold mb-3">
                  {direction === 'rtl' ? 'بعد' : 'After'}
                </h4>
                <div
                  className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => openLightbox(resultImage)}
                >
                  <img
                    src={resultImage}
                    alt="Result"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-center"
              >
                {error}
              </motion.p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                variant="primary"
                onClick={handleDownloadImage}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {direction === 'rtl' ? 'تحميل الصورة' : 'Download Image'}
              </Button>

              <Button
                variant="outline"
                onClick={handleTryAgain}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {direction === 'rtl' ? 'تجربة صورة أخرى' : 'Try Another Image'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <Lightbox
        isOpen={lightboxOpen}
        imageSrc={lightboxImage}
        imageAlt={direction === 'rtl' ? 'صورة التصميم' : 'Design Image'}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}