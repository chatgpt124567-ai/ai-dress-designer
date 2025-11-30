'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, X, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import Button from './Button';

interface ImageUploadStepProps {
  onImageSelected: (imageData: string) => void;
  onBack: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ImageUploadStep({ onImageSelected, onBack }: ImageUploadStepProps) {
  const { t, direction } = useLanguage();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessImage = (file: File) => {
    setError('');

    // Validate file type
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      setError(t('design.external.upload.errors.invalidFormat'));
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(t('design.external.upload.errors.fileTooLarge'));
      return;
    }

    // Read and preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.onerror = () => {
      setError(t('design.external.upload.errors.readFailed'));
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessImage(file);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleContinue = () => {
    if (preview) {
      onImageSelected(preview);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
            {t('design.external.upload.title')}
          </h2>
          <p className="text-neutral-600">
            {t('design.external.upload.subtitle')}
          </p>
        </div>

        {/* Upload Card - matching OwnFabricUpload design */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-primary">
            {t('design.external.upload.selectImage')}
          </h3>

          {!preview ? (
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Take Photo Button */}
              <label className="flex-1 cursor-pointer">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div
                  className="px-6 py-8 border-2 border-dashed border-accent-gold rounded-lg text-center hover:bg-accent-gold/10 transition-all"
                >
                  <Camera className="w-12 h-12 mx-auto mb-3 text-accent-gold" />
                  <span className="text-base font-medium text-primary">
                    {t('design.external.upload.takePhoto')}
                  </span>
                </div>
              </label>

              {/* Choose from Gallery Button */}
              <label className="flex-1 cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FORMATS.join(',')}
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "px-6 py-8 border-2 border-dashed rounded-lg text-center transition-all",
                    isDragging
                      ? "border-accent-gold bg-accent-gold/20 scale-105"
                      : "border-accent-gold hover:bg-accent-gold/10"
                  )}
                >
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 text-accent-gold" />
                  <span className="text-base font-medium text-primary">
                    {t('design.external.upload.chooseFile')}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">
                    {t('design.external.upload.formats')}
                  </p>
                </div>
              </label>
            </div>
          ) : (
            // Image Preview - matching OwnFabricUpload style
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border-2 border-accent-gold">
                <img
                  src={preview}
                  alt="Preview"
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
                      accept={ACCEPTED_FORMATS.join(',')}
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t('design.external.upload.changeImage')}
                    </span>
                  </label>
                  {/* Remove Image Button */}
                  <button
                    onClick={handleRemoveImage}
                    className="bg-red-500/90 hover:bg-red-500 text-white px-4 py-2 rounded-lg shadow-md transition-all"
                  >
                    <span className="text-sm font-medium">
                      {t('design.external.upload.removeImage')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Action Buttons - matching OwnFabricUpload style */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            {t('common.back')}
          </Button>
          <Button
            variant="primary"
            onClick={handleContinue}
            disabled={!preview}
            className="flex-1"
          >
            {t('common.continue')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}


