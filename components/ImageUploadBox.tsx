'use client';

import { useState } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { smartCompressImage } from '@/lib/imageUtils';

interface ImageUploadBoxProps {
  image?: string;
  onImageChange: (file: File | null) => void;
  onImageRemove?: () => void;
  onImageClick?: () => void;
  label?: string;
  showCamera?: boolean;
  showGallery?: boolean;
  imageHeight?: string;
  variant?: 'primary' | 'secondary';
}

export default function ImageUploadBox({
  image,
  onImageChange,
  onImageRemove,
  onImageClick,
  label,
  showCamera = true,
  showGallery = true,
  imageHeight = 'h-64',
  variant = 'primary',
}: ImageUploadBoxProps) {
  const { t, direction } = useLanguage();
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(direction === 'rtl' ? 'يرجى اختيار ملف صورة' : 'Please select an image file');
      return;
    }

    try {
      setIsCompressing(true);
      const result = await smartCompressImage(file);

      if (result.exceedsTarget) {
        alert(
          direction === 'rtl'
            ? `الصورة كبيرة جداً (${result.originalSizeMB.toFixed(1)} ميجا). حتى بعد الضغط بأقصى درجة، حجمها (${result.finalSizeMB.toFixed(1)} ميجا) لا يزال كبيراً جداً. يرجى اختيار صورة أصغر.`
            : `Image too large (${result.originalSizeMB.toFixed(1)}MB). Even after maximum compression, size (${result.finalSizeMB.toFixed(1)}MB) is still too large. Please choose a smaller image.`
        );
        return;
      }

      const finalFile = result.wasCompressed
        ? new File([result.blob], file.name, { type: 'image/jpeg' })
        : file;
      onImageChange(finalFile);

      if (result.wasCompressed) {
        const message = direction === 'rtl'
          ? `✅ تم ضغط الصورة: ${result.originalSizeMB.toFixed(1)} ميجا ← ${result.finalSizeMB.toFixed(1)} ميجا`
          : `✅ Image compressed: ${result.originalSizeMB.toFixed(1)}MB → ${result.finalSizeMB.toFixed(1)}MB`;
        setTimeout(() => alert(message), 100);
      }
    } catch (error) {
      console.error('Compression error:', error);
      alert(
        direction === 'rtl'
          ? 'فشل في معالجة الصورة. يرجى المحاولة مرة أخرى.'
          : 'Failed to process image. Please try again.'
      );
    } finally {
      setIsCompressing(false);
    }
  };

  if (isCompressing) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <div className="w-10 h-10 border-4 border-accent-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-600 font-medium">
          {direction === 'rtl' ? 'جارٍ ضغط الصورة...' : 'Compressing image...'}
        </p>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Take Photo Button */}
        {showCamera && (
          <label className="flex-1 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            <div className={cn(
              "px-6 py-8 border-2 border-dashed rounded-lg text-center transition-all",
              variant === 'primary' 
                ? "border-accent-gold hover:bg-accent-gold/5" 
                : "border-gray-300 hover:border-accent-gold hover:bg-accent-gold/5"
            )}>
              <Camera className={cn(
                "w-12 h-12 mx-auto mb-3",
                variant === 'primary' ? "text-accent-gold" : "text-gray-400"
              )} />
              <span className={cn(
                "text-base font-medium",
                variant === 'primary' ? "text-primary" : "text-gray-600"
              )}>
                {t('design.ownFabric.upload.takePhoto')}
              </span>
            </div>
          </label>
        )}

        {/* Choose from Gallery Button */}
        {showGallery && (
          <label className="flex-1 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            <div className={cn(
              "px-6 py-8 border-2 border-dashed rounded-lg text-center transition-all",
              variant === 'primary' 
                ? "border-accent-gold hover:bg-accent-gold/5" 
                : "border-gray-300 hover:border-accent-gold hover:bg-accent-gold/5"
            )}>
              <ImageIcon className={cn(
                "w-12 h-12 mx-auto mb-3",
                variant === 'primary' ? "text-accent-gold" : "text-gray-400"
              )} />
              <span className={cn(
                "text-base font-medium",
                variant === 'primary' ? "text-primary" : "text-gray-600"
              )}>
                {t('design.ownFabric.upload.chooseFromGallery')}
              </span>
            </div>
          </label>
        )}
      </div>
    );
  }

  // Image Preview with unified design
  return (
    <div className="relative rounded-lg overflow-hidden border-2 border-accent-gold">
      <img
        src={image}
        alt={label || 'Uploaded Image'}
        className={cn(
          "w-full object-cover cursor-pointer hover:opacity-90 transition-opacity",
          imageHeight
        )}
        onClick={onImageClick}
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
            {t('design.ownFabric.upload.changeImage')}
          </span>
        </label>
        {/* Remove Image Button */}
        {onImageRemove && (
          <button
            onClick={onImageRemove}
            className="bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-lg shadow-md transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

