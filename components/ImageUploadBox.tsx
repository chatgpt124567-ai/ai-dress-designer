'use client';

import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

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

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert(direction === 'rtl' ? 'حجم الصورة كبير جداً. الحد الأقصى 5MB' : 'Image size too large. Maximum 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(direction === 'rtl' ? 'يرجى اختيار ملف صورة' : 'Please select an image file');
      return;
    }

    onImageChange(file);
  };

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

