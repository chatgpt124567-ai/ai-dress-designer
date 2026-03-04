'use client';

import { useState } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { compressImage, base64ToBlob } from '@/lib/imageUtils';

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(direction === 'rtl' ? 'يرجى اختيار ملف صورة' : 'Please select an image file');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const fileSizeMB = file.size / (1024 * 1024);

    // Smart compression for images > 5MB
    if (file.size > MAX_SIZE) {
      try {
        setIsCompressing(true);
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        const targetSizeMB = 4.99;
        const quality = Math.max(0.75, targetSizeMB / fileSizeMB);
        const compressed = await compressImage(base64, 99999, quality);
        const compressedBlob = base64ToBlob(compressed);
        const compressedSizeMB = compressedBlob.size / (1024 * 1024);

        if (compressedBlob.size > MAX_SIZE) {
          setIsCompressing(false);
          alert(
            direction === 'rtl'
              ? `الصورة كبيرة جداً (${fileSizeMB.toFixed(1)} ميجا). حتى بعد الضغط بأقصى درجة، الحجم (${compressedSizeMB.toFixed(1)} ميجا) لا يزال أكبر من 5 ميجا. يرجى اختيار صورة أصغر.`
              : `Image too large (${fileSizeMB.toFixed(1)}MB). Even after maximum compression, size (${compressedSizeMB.toFixed(1)}MB) still exceeds 5MB. Please choose a smaller image.`
          );
          return;
        }

        // Convert compressed base64 back to File
        const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });

        const message = direction === 'rtl'
          ? `✅ تم ضغط الصورة: ${fileSizeMB.toFixed(1)} ميجا ← ${compressedSizeMB.toFixed(1)} ميجا`
          : `✅ Image compressed: ${fileSizeMB.toFixed(1)}MB → ${compressedSizeMB.toFixed(1)}MB`;
        setTimeout(() => alert(message), 100);

        onImageChange(compressedFile);
      } catch (error) {
        console.error('Compression error:', error);
        alert(
          direction === 'rtl'
            ? 'فشل في ضغط الصورة. يرجى اختيار صورة أصغر من 5 ميجا.'
            : 'Failed to compress image. Please choose an image smaller than 5MB.'
        );
      } finally {
        setIsCompressing(false);
      }
      return;
    }

    onImageChange(file);
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

