'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Eye, Loader2, AlertCircle, RefreshCw, Pencil } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import Button from './Button';
import Lightbox from './Lightbox';

interface DesignResult {
  id: string;
  prompt: string;
  imageUrl?: string;
  error?: string;
  status: 'pending' | 'generating' | 'complete' | 'error' | 'editing';
}

interface MultiDesignResultsProps {
  designs: DesignResult[];
  loading: boolean;
  onRetry?: (designId: string) => void;
  onNewDesign?: () => void;
  onDownload?: (imageUrl: string, index: number) => void;
  onEdit?: (designId: string, imageUrl: string, prompt: string) => void;
  editingDesignId?: string | null; // التصميم الذي يتم تعديله حالياً
}

export default function MultiDesignResults({
  designs,
  loading,
  onRetry,
  onNewDesign,
  onDownload,
  onEdit,
  editingDesignId,
}: MultiDesignResultsProps) {
  const { direction } = useLanguage();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const handleDownload = async (imageUrl: string, index: number) => {
    if (onDownload) {
      onDownload(imageUrl, index);
      return;
    }
    // تحميل افتراضي
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `design-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const completedCount = designs.filter(d => d.status === 'complete').length;
  const totalCount = designs.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* العنوان والتقدم */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            {direction === 'rtl' ? 'التصاميم المقترحة' : 'Suggested Designs'}
          </h2>
          {loading && (
            <div className="flex items-center justify-center gap-2 text-neutral-600">
              <Loader2 className="w-5 h-5 animate-spin text-accent-gold" />
              <span>
                {direction === 'rtl'
                  ? `جاري إنشاء التصاميم... (${completedCount}/${totalCount})`
                  : `Creating designs... (${completedCount}/${totalCount})`}
              </span>
            </div>
          )}
        </div>

        {/* شريط التقدم */}
        {loading && (
          <div className="w-full max-w-md mx-auto">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-gold to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* شبكة الصور */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {designs.map((design, index) => (
            <motion.div
              key={design.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative bg-white rounded-2xl overflow-hidden',
                'border-2 transition-all',
                design.status === 'complete' ? 'border-accent-gold shadow-lg' : 'border-gray-200'
              )}
            >
              {/* حالة التحميل */}
              {(design.status === 'pending' || design.status === 'generating') && (
                <div className="aspect-[3/4] flex items-center justify-center bg-gray-50">
                  <div className="text-center p-6">
                    <Loader2 className="w-12 h-12 animate-spin text-accent-gold mx-auto mb-4" />
                    <p className="text-sm text-neutral-600">
                      {design.status === 'pending'
                        ? (direction === 'rtl' ? 'في الانتظار...' : 'Waiting...')
                        : (direction === 'rtl' ? 'جاري الإنشاء...' : 'Generating...')}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {direction === 'rtl' ? `تصميم ${index + 1}` : `Design ${index + 1}`}
                    </p>
                  </div>
                </div>
              )}

              {/* حالة الخطأ */}
              {design.status === 'error' && (
                <div className="aspect-[3/4] flex items-center justify-center bg-red-50">
                  <div className="text-center p-6">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-sm text-red-600 mb-4">
                      {design.error || (direction === 'rtl' ? 'فشل الإنشاء' : 'Generation failed')}
                    </p>
                    {onRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetry(design.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {direction === 'rtl' ? 'إعادة المحاولة' : 'Retry'}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* حالة التعديل */}
              {design.status === 'editing' && design.imageUrl && (
                <>
                  <div className="aspect-[3/4] relative">
                    <img
                      src={design.imageUrl}
                      alt={`Design ${index + 1}`}
                      className="w-full h-full object-cover opacity-50"
                    />
                    {/* Overlay التعديل */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-3" />
                        <p className="text-white font-medium">
                          {direction === 'rtl' ? 'جاري تعديل التصميم...' : 'Editing design...'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* رقم التصميم */}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                </>
              )}

              {/* الصورة الناجحة */}
              {design.status === 'complete' && design.imageUrl && (
                <>
                  <div className="aspect-[3/4] relative group">
                    <img
                      src={design.imageUrl}
                      alt={`Design ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay مع الأزرار */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => setLightboxImage(design.imageUrl!)}
                        className="p-3 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                        title={direction === 'rtl' ? 'معاينة' : 'Preview'}
                      >
                        <Eye className="w-5 h-5 text-primary" />
                      </button>
                      <button
                        onClick={() => handleDownload(design.imageUrl!, index)}
                        className="p-3 bg-accent-gold rounded-full shadow-lg hover:scale-110 transition-transform"
                        title={direction === 'rtl' ? 'تحميل' : 'Download'}
                      >
                        <Download className="w-5 h-5 text-white" />
                      </button>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(design.id, design.imageUrl!, design.prompt)}
                          className="p-3 bg-purple-500 rounded-full shadow-lg hover:scale-110 transition-transform"
                          title={direction === 'rtl' ? 'طلب تعديل' : 'Request Edit'}
                        >
                          <Pencil className="w-5 h-5 text-white" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* رقم التصميم */}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-bold text-primary">
                    {index + 1}
                  </div>

                  {/* زر طلب تعديل (ظاهر دائماً على الموبايل) */}
                  {onEdit && (
                    <div className="p-3 border-t border-gray-100 sm:hidden">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(design.id, design.imageUrl!, design.prompt)}
                        className="w-full text-purple-600 border-purple-300 hover:bg-purple-50"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        {direction === 'rtl' ? 'طلب تعديل' : 'Request Edit'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* أزرار الإجراءات */}
        {!loading && completedCount > 0 && (
          <div className="flex justify-center pt-6">
            <Button variant="primary" onClick={onNewDesign}>
              {direction === 'rtl' ? 'تصميم جديد' : 'New Design'}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Lightbox */}
      <Lightbox
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        imageSrc={lightboxImage || ''}
        imageAlt={direction === 'rtl' ? 'معاينة التصميم' : 'Design Preview'}
      />
    </div>
  );
}

