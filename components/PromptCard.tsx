'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from './Button';
import ToggleSwitch from './ToggleSwitch';

interface PromptCardProps {
  onSubmit: (data: {
    description: string;
    useOptimizer: boolean;
    preservePose: boolean;
    image?: File;
  }) => void;
  loading?: boolean;
}

export default function PromptCard({ onSubmit, loading = false }: PromptCardProps) {
  const { t, direction } = useLanguage();
  const [description, setDescription] = useState('');
  const [useOptimizer, setUseOptimizer] = useState(true);
  const [preservePose, setPreservePose] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      description,
      useOptimizer,
      preservePose,
      image: image || undefined,
    });
  };

  return (
    <div className="luxury-card p-4 md:p-6 lg:p-8">
      <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4 md:mb-6">
        {t('design.prompt.title')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Textarea */}
        <div>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('design.prompt.placeholder')}
            className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-accent-gold focus:border-transparent resize-none"
            rows={5}
            required
            dir={direction}
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-primary mb-2">
            {t('design.prompt.imageUpload')}
          </label>
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={removeImage}
                className={cn(
                  "absolute -top-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600",
                  direction === 'rtl' ? '-left-2' : '-right-2'
                )}
                aria-label={t('design.prompt.removeImage')}
              >
                <X size={14} className="md:w-4 md:h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-28 md:h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-accent-gold transition-colors">
              <Upload className="text-gray-400 mb-2" size={20} />
              <span className="text-xs md:text-sm text-gray-500">{t('design.prompt.uploadHint')}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Toggles */}
        <div className="space-y-3 md:space-y-4">
          <ToggleSwitch
            label={t('design.prompt.useOptimizer')}
            checked={useOptimizer}
            onChange={setUseOptimizer}
          />
          <ToggleSwitch
            label={t('design.prompt.preservePose')}
            checked={preservePose}
            onChange={setPreservePose}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full text-sm md:text-base"
          disabled={loading || !description.trim()}
        >
          {loading ? t('design.prompt.generating') : t('design.prompt.generate')}
        </Button>
      </form>
    </div>
  );
}

