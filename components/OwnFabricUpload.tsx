'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { compressImage, base64ToBlob } from '@/lib/imageUtils';
import Button from './Button';
import Lightbox from './Lightbox';

interface OwnFabricUploadProps {
  onComplete: (data: {
    primaryFabricImage: string;
    secondaryFabricImage?: string;
    secondaryFabricType?: string;
  }) => void;
  onBack?: () => void;
}

export default function OwnFabricUpload({ onComplete, onBack }: OwnFabricUploadProps) {
  const { t, direction } = useLanguage();

  const [primaryFabricImage, setPrimaryFabricImage] = useState<string | undefined>();
  const [hasSecondaryFabric, setHasSecondaryFabric] = useState<boolean>(false);
  const [secondaryFabricMode, setSecondaryFabricMode] = useState<'upload' | 'select' | null>(null);
  const [secondaryFabricImage, setSecondaryFabricImage] = useState<string | undefined>();
  const [secondaryFabricType, setSecondaryFabricType] = useState<string | undefined>();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = (file: File | null, isPrimary: boolean) => {
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

    reader.onload = async () => {
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

      if (isPrimary) {
        setPrimaryFabricImage(finalImage);
      } else {
        setSecondaryFabricImage(finalImage);
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      alert(direction === 'rtl' ? 'حدث خطأ أثناء قراءة الصورة. يرجى المحاولة مرة أخرى' : 'Error reading image. Please try again');
    };

    try {
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error starting FileReader:', error);
      alert(direction === 'rtl' ? 'فشل في بدء قراءة الصورة' : 'Failed to start reading image');
    }
  };

  const handleContinue = () => {
    if (!primaryFabricImage) {
      alert(direction === 'rtl' ? 'يرجى رفع صورة القماش الأساسي أولاً' : 'Please upload primary fabric image first');
      return;
    }

    if (hasSecondaryFabric) {
      if (secondaryFabricMode === 'upload' && !secondaryFabricImage) {
        alert(direction === 'rtl' ? 'يرجى رفع صورة القماش الثانوي' : 'Please upload secondary fabric image');
        return;
      }
      if (secondaryFabricMode === 'select' && !secondaryFabricType) {
        alert(direction === 'rtl' ? 'يرجى اختيار نوع القماش الثانوي' : 'Please select secondary fabric type');
        return;
      }
    }

    onComplete({
      primaryFabricImage,
      secondaryFabricImage: secondaryFabricMode === 'upload' ? secondaryFabricImage : undefined,
      secondaryFabricType: secondaryFabricMode === 'select' ? secondaryFabricType : undefined,
    });
  };

  const fabricTypes = [
    'satin', 'chiffon', 'silk', 'tulle', 'lace',
    'velvet', 'organza', 'crepe', 'taffeta', 'brocade', 'other'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >


        {/* Primary Fabric Upload */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-primary">
            {t('design.ownFabric.placement.primaryLabel')}
          </h3>

          {!primaryFabricImage ? (
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Take Photo Button */}
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, true)}
                />
                <div className="px-6 py-8 border-2 border-dashed border-accent-gold rounded-lg text-center hover:bg-accent-gold/5 transition-all">
                  <Camera className="w-12 h-12 mx-auto mb-3 text-accent-gold" />
                  <span className="text-base font-medium text-primary">
                    {t('design.ownFabric.upload.takePhoto')}
                  </span>
                </div>
              </label>

              {/* Choose from Gallery Button */}
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, true)}
                />
                <div className="px-6 py-8 border-2 border-dashed border-accent-gold rounded-lg text-center hover:bg-accent-gold/5 transition-all">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 text-accent-gold" />
                  <span className="text-base font-medium text-primary">
                    {t('design.ownFabric.upload.chooseFromGallery')}
                  </span>
                </div>
              </label>
            </div>
          ) : (
            // Image Preview
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border-2 border-accent-gold">
                <img
                  src={primaryFabricImage}
                  alt="Primary Fabric"
                  className="w-full h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setLightboxImage(primaryFabricImage)}
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
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null, true)}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t('design.ownFabric.upload.changeImage')}
                    </span>
                  </label>
                  {/* Remove Image Button */}
                  <button
                    onClick={() => setPrimaryFabricImage(undefined)}
                    className="bg-red-500/90 hover:bg-red-500 text-white px-4 py-2 rounded-lg shadow-md transition-all"
                  >
                    <span className="text-sm font-medium">
                      {t('design.ownFabric.upload.removeImage')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Fabric Section */}
        {primaryFabricImage && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-primary">
              {t('design.ownFabric.secondaryFabric.question')}
            </h3>

            {/* Yes/No Radio Buttons */}
            <div className="flex gap-4">
              <label className={cn(
                'flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all',
                hasSecondaryFabric ? 'border-accent-gold bg-accent-gold/5' : 'border-gray-200 hover:border-gray-300'
              )}>
                <input
                  type="radio"
                  name="hasSecondaryFabric"
                  checked={hasSecondaryFabric}
                  onChange={() => setHasSecondaryFabric(true)}
                  className="w-5 h-5 text-accent-gold focus:ring-accent-gold"
                />
                <span className={cn('text-base font-medium', direction === 'rtl' ? 'mr-3' : 'ml-3')}>
                  {direction === 'rtl' ? 'نعم' : 'Yes'}
                </span>
              </label>

              <label className={cn(
                'flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all',
                !hasSecondaryFabric ? 'border-accent-gold bg-accent-gold/5' : 'border-gray-200 hover:border-gray-300'
              )}>
                <input
                  type="radio"
                  name="hasSecondaryFabric"
                  checked={!hasSecondaryFabric}
                  onChange={() => {
                    setHasSecondaryFabric(false);
                    setSecondaryFabricMode(null);
                    setSecondaryFabricImage(undefined);
                    setSecondaryFabricType(undefined);
                  }}
                  className="w-5 h-5 text-accent-gold focus:ring-accent-gold"
                />
                <span className={cn('text-base font-medium', direction === 'rtl' ? 'mr-3' : 'ml-3')}>
                  {direction === 'rtl' ? 'لا' : 'No'}
                </span>
              </label>
            </div>

            {/* Secondary Fabric Options */}
            {hasSecondaryFabric && (
              <div className="space-y-4 pt-4">
                {/* Mode Selection */}
                {!secondaryFabricMode && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setSecondaryFabricMode('upload')}
                      className="p-6 border-2 border-gray-200 rounded-lg hover:border-accent-gold hover:bg-accent-gold/5 transition-all text-center"
                    >
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 text-accent-gold" />
                      <span className="text-base font-medium text-primary">
                        {t('design.ownFabric.secondaryFabric.uploadOption')}
                      </span>
                    </button>

                    <button
                      onClick={() => setSecondaryFabricMode('select')}
                      className="p-6 border-2 border-gray-200 rounded-lg hover:border-accent-gold hover:bg-accent-gold/5 transition-all text-center"
                    >
                      <span className="text-3xl mb-2 block">📋</span>
                      <span className="text-base font-medium text-primary">
                        {t('design.ownFabric.secondaryFabric.selectOption')}
                      </span>
                    </button>
                  </div>
                )}

                {/* Upload Mode */}
                {secondaryFabricMode === 'upload' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-primary">
                        {t('design.ownFabric.secondaryFabric.uploadTitle')}
                      </h4>
                      <button
                        onClick={() => {
                          setSecondaryFabricMode(null);
                          setSecondaryFabricImage(undefined);
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        {direction === 'rtl' ? 'تغيير الخيار' : 'Change Option'}
                      </button>
                    </div>

                    {!secondaryFabricImage ? (
                      <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleFileChange(e.target.files?.[0] || null, false)}
                          />
                          <div className="px-6 py-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-accent-gold hover:bg-accent-gold/5 transition-all">
                            <Camera className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600">
                              {t('design.ownFabric.upload.takePhoto')}
                            </span>
                          </div>
                        </label>

                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e.target.files?.[0] || null, false)}
                          />
                          <div className="px-6 py-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-accent-gold hover:bg-accent-gold/5 transition-all">
                            <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600">
                              {t('design.ownFabric.upload.chooseFromGallery')}
                            </span>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden border-2 border-accent-gold">
                        <img
                          src={secondaryFabricImage}
                          alt="Secondary Fabric"
                          className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setLightboxImage(secondaryFabricImage)}
                        />
                        <button
                          onClick={() => setSecondaryFabricImage(undefined)}
                          className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-lg shadow-md transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Select Mode */}
                {secondaryFabricMode === 'select' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-primary">
                        {t('design.ownFabric.secondaryFabric.selectTitle')}
                      </h4>
                      <button
                        onClick={() => {
                          setSecondaryFabricMode(null);
                          setSecondaryFabricType(undefined);
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        {direction === 'rtl' ? 'تغيير الخيار' : 'Change Option'}
                      </button>
                    </div>

                    <select
                      value={secondaryFabricType || ''}
                      onChange={(e) => setSecondaryFabricType(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-gold focus:outline-none"
                      dir={direction}
                    >
                      <option value="">
                        {direction === 'rtl' ? 'اختاري نوع القماش...' : 'Select fabric type...'}
                      </option>
                      {fabricTypes.map((type) => (
                        <option key={type} value={type}>
                          {t(`design.ownFabric.secondaryFabric.fabricTypes.${type}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              {direction === 'rtl' ? 'رجوع' : 'Back'}
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleContinue}
            disabled={!primaryFabricImage}
            className="flex-1"
          >
            {t('design.ownFabric.upload.continue')}
          </Button>
        </div>
      </motion.div>

      {/* Lightbox for fullscreen image preview */}
      <Lightbox
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        imageSrc={lightboxImage || ''}
        imageAlt={direction === 'rtl' ? 'معاينة القماش' : 'Fabric Preview'}
      />
    </div>
  );
}


