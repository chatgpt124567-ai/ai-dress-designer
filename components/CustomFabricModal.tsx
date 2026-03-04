'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { compressImage, base64ToBlob } from '@/lib/imageUtils';
import Button from '@/components/Button';

interface CustomFabricModalProps {
  isOpen: boolean;
  onClose: () => void;
  customFabricImage?: string;
  fabricPlacement?: string;
  fabricPlacementDetails?: string;
  onImageChange: (imageData: string) => void;
  onPlacementChange: (placement: string) => void;
  onPlacementDetailsChange: (details: string) => void;
  onRemoveImage: () => void;
}

export default function CustomFabricModal({
  isOpen,
  onClose,
  customFabricImage,
  fabricPlacement,
  fabricPlacementDetails,
  onImageChange,
  onPlacementChange,
  onPlacementDetailsChange,
  onRemoveImage,
}: CustomFabricModalProps) {
  const { t, direction } = useLanguage();
  const [step, setStep] = useState<'upload' | 'placement'>(customFabricImage ? 'placement' : 'upload');

  // Local temporary state - only saved when "Done" is clicked
  const [tempImage, setTempImage] = useState<string | undefined>(customFabricImage);
  const [tempPlacement, setTempPlacement] = useState<string | undefined>(fabricPlacement);
  const [tempPlacementDetails, setTempPlacementDetails] = useState<string | undefined>(fabricPlacementDetails);
  const [isCompressing, setIsCompressing] = useState(false);

  // Reset temp state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempImage(customFabricImage);
      setTempPlacement(fabricPlacement);
      setTempPlacementDetails(fabricPlacementDetails);
      setStep(customFabricImage ? 'placement' : 'upload');
    }
  }, [isOpen, customFabricImage, fabricPlacement, fabricPlacementDetails]);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(direction === 'rtl' ? 'يرجى اختيار ملف صورة' : 'Please select an image file');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const fileSizeMB = file.size / (1024 * 1024);

    const reader = new FileReader();

    reader.onloadstart = () => {
      console.log('Starting to read file...');
    };

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentLoaded = Math.round((e.loaded / e.total) * 100);
        console.log(`Loading: ${percentLoaded}%`);
      }
    };

    reader.onload = async () => {
      console.log('File loaded successfully');
      const result = reader.result as string;
      if (!result) {
        console.error('Reader result is empty');
        alert(direction === 'rtl' ? 'فشل في قراءة الصورة' : 'Failed to read image');
        return;
      }

      let finalImage = result;

      // Smart compression for images > 5MB
      if (file.size > MAX_SIZE) {
        try {
          setIsCompressing(true);
          const targetSizeMB = 4.99;
          const quality = Math.max(0.75, targetSizeMB / fileSizeMB);

          console.log(`Image is ${fileSizeMB.toFixed(2)}MB, compressing with quality ${quality.toFixed(2)}...`);

          // Compress without reducing dimensions (maxWidth = 99999)
          const compressed = await compressImage(result, 99999, quality);
          const compressedBlob = base64ToBlob(compressed);
          const compressedSizeMB = compressedBlob.size / (1024 * 1024);

          console.log(`Compressed: ${fileSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB`);

          if (compressedBlob.size > MAX_SIZE) {
            setIsCompressing(false);
            alert(
              direction === 'rtl'
                ? `الصورة كبيرة جداً (${fileSizeMB.toFixed(1)} ميجا). حتى بعد الضغط بأقصى درجة، الحجم (${compressedSizeMB.toFixed(1)} ميجا) لا يزال أكبر من 5 ميجا. يرجى اختيار صورة أصغر.`
                : `Image too large (${fileSizeMB.toFixed(1)}MB). Even after maximum compression, size (${compressedSizeMB.toFixed(1)}MB) still exceeds 5MB. Please choose a smaller image.`
            );
            return;
          }

          finalImage = compressed;

          // Notify user about compression
          const message = direction === 'rtl'
            ? `✅ تم ضغط الصورة: ${fileSizeMB.toFixed(1)} ميجا ← ${compressedSizeMB.toFixed(1)} ميجا`
            : `✅ Image compressed: ${fileSizeMB.toFixed(1)}MB → ${compressedSizeMB.toFixed(1)}MB`;
          setTimeout(() => alert(message), 100);

        } catch (error) {
          console.error('Compression error:', error);
          setIsCompressing(false);
          alert(
            direction === 'rtl'
              ? 'فشل في ضغط الصورة. يرجى اختيار صورة أصغر من 5 ميجا.'
              : 'Failed to compress image. Please choose an image smaller than 5MB.'
          );
          return;
        } finally {
          setIsCompressing(false);
        }
      }

      console.log('Setting temp image, length:', finalImage.length);
      setTempImage(finalImage);
      setStep('placement');
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      alert(direction === 'rtl' ? 'حدث خطأ أثناء قراءة الصورة. يرجى المحاولة مرة أخرى' : 'Error reading image. Please try again');
    };

    reader.onabort = () => {
      console.warn('FileReader aborted');
      alert(direction === 'rtl' ? 'تم إلغاء قراءة الصورة' : 'Image reading was cancelled');
    };

    try {
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error starting FileReader:', error);
      alert(direction === 'rtl' ? 'فشل في بدء قراءة الصورة' : 'Failed to start reading image');
    }
  };

  const handleRemoveImage = () => {
    // Clear temp state
    setTempImage(undefined);
    setTempPlacement(undefined);
    setTempPlacementDetails(undefined);
    setStep('upload');

    // Clear parent component state immediately (this will update localStorage)
    onRemoveImage();

    // Close modal
    onClose();
  };

  const handleCancel = () => {
    // Reset temp state to original values (discard changes)
    setTempImage(customFabricImage);
    setTempPlacement(fabricPlacement);
    setTempPlacementDetails(fabricPlacementDetails);
    onClose();
  };

  const handleDone = () => {
    if (!tempImage) {
      alert(direction === 'rtl' ? 'يرجى رفع صورة القماش أولاً' : 'Please upload fabric image first');
      return;
    }
    if (!tempPlacement) {
      alert(direction === 'rtl' ? 'يرجى اختيار مكان استخدام القماش' : 'Please select fabric placement');
      return;
    }
    // Save temp state to parent component
    if (tempImage !== customFabricImage) {
      onImageChange(tempImage);
    }
    if (tempPlacement !== fabricPlacement) {
      onPlacementChange(tempPlacement);
    }
    if (tempPlacementDetails !== fabricPlacementDetails) {
      onPlacementDetailsChange(tempPlacementDetails || '');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="custom-fabric-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col"
            dir={direction}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl md:text-2xl font-headline font-bold text-primary">
                {t('questionnaire.section5.q8.customFabricTitle')}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-neutral-500" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Step 1: Image Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">
                  {t('questionnaire.section5.q8.uploadImage')}
                </h3>

                {isCompressing ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="w-10 h-10 border-4 border-accent-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-600 font-medium">
                      {direction === 'rtl' ? 'جارٍ ضغط الصورة...' : 'Compressing image...'}
                    </p>
                  </div>
                ) : !tempImage ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Take Photo Button */}
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                      />
                      <div className="px-6 py-4 border-2 border-accent-gold rounded-lg text-center hover:bg-accent-gold hover:text-white transition-all">
                        <span className="text-base font-medium">
                          📷 {t('questionnaire.section5.q8.takePhoto')}
                        </span>
                      </div>
                    </label>

                    {/* Choose from Gallery Button */}
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                      />
                      <div className="px-6 py-4 border-2 border-accent-gold rounded-lg text-center hover:bg-accent-gold hover:text-white transition-all">
                        <span className="text-base font-medium">
                          🖼️ {t('questionnaire.section5.q8.chooseFromGallery')}
                        </span>
                      </div>
                    </label>
                  </div>
                ) : (
                  // Image Preview with Change/Remove buttons
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden border-2 border-accent-gold">
                      <img
                        src={tempImage}
                        alt="Custom Fabric"
                        className="w-full h-64 object-cover"
                      />
                      <div className={cn(
                        "absolute top-2 flex gap-2",
                        direction === 'rtl' ? 'left-2' : 'right-2'
                      )}>
                        {/* Change Image Button */}
                        <label className="cursor-pointer bg-white/90 hover:bg-white px-4 py-2 rounded-lg shadow-md transition-all">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {t('questionnaire.section5.q8.changeImage')}
                          </span>
                        </label>
                        {/* Remove Image Button */}
                        <button
                          onClick={handleRemoveImage}
                          className="bg-red-500/90 hover:bg-red-500 text-white px-4 py-2 rounded-lg shadow-md transition-all"
                        >
                          <span className="text-sm font-medium">
                            {t('questionnaire.section5.q8.removeImage')}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Fabric Placement (only show if image is uploaded) */}
              {tempImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-primary">
                    {t('questionnaire.section5.q8.fabricPlacementQuestion')}
                  </h3>
                  <div className="space-y-3">
                    {['full', 'bodice', 'skirt', 'sleeves', 'custom'].map((placement) => (
                      <label
                        key={placement}
                        className={cn(
                          'flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all',
                          tempPlacement === placement
                            ? 'border-accent-gold bg-accent-gold/5'
                            : 'border-gray-200 hover:border-accent-gold/50'
                        )}
                      >
                        <input
                          type="radio"
                          name="fabricPlacement"
                          value={placement}
                          checked={tempPlacement === placement}
                          onChange={(e) => setTempPlacement(e.target.value)}
                          className="w-5 h-5 text-accent-gold focus:ring-accent-gold"
                        />
                        <span className="text-base">
                          {t(`questionnaire.section5.q8.placementOptions.${placement}`)}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Custom Placement Details */}
                  {tempPlacement === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <input
                        type="text"
                        value={tempPlacementDetails || ''}
                        onChange={(e) => setTempPlacementDetails(e.target.value)}
                        placeholder={t('questionnaire.section5.q8.placementDetailsPlaceholder')}
                        className="w-full px-5 py-4 border-2 border-gray-200 rounded-lg focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 transition-all text-base"
                        dir={direction}
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 flex-shrink-0">
              <Button
                variant="outline"
                size="lg"
                onClick={onClose}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleDone}
                className="flex-1"
              >
                {t('common.done')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


