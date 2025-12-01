'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import ImageUploadStep from './ImageUploadStep';
import EditDesignModal from './EditDesignModal';
import ImageCard from './ImageCard';
import Button from './Button';
import Lightbox from './Lightbox';
import { ImageSkeleton } from './Skeleton';
import type { EditDesignRequest, EditDesignResponse } from '@/app/api/edit-design/route';
import { createClient } from '@/lib/supabase/client';
import { processAndUploadDesignImage } from '@/lib/imageUtils';

interface ExternalEditWorkflowProps {
  onBack: () => void;
  onSaveDesign: (imageData: string, modificationHistory: ModificationRecord[]) => Promise<void>;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}

interface ModificationRecord {
  imageData: string;
  description: string;
  timestamp: number;
}

interface ImageHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: Date;
  isOriginal: boolean;
}

type WorkflowStep = 'upload' | 'modify' | 'result';

// localStorage keys for external workflow state persistence
const STORAGE_EXTERNAL_STEP_KEY = 'external_workflow_step';
const STORAGE_EXTERNAL_IMAGE_KEY = 'external_current_image';
const STORAGE_EXTERNAL_HISTORY_KEY = 'external_image_history';

export default function ExternalEditWorkflow({
  onBack,
  onSaveDesign,
  isAuthenticated,
  onAuthRequired,
}: ExternalEditWorkflowProps) {
  const { t, direction } = useLanguage();
  const router = useRouter();

  // Workflow state
  const [step, setStep] = useState<WorkflowStep>('upload');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [currentImage, setCurrentImage] = useState<string>('');
  const [previousImage, setPreviousImage] = useState<string>('');
  const [modificationHistory, setModificationHistory] = useState<ModificationRecord[]>([]);

  // Image History State - to track previous versions after modifications
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);
  const [historyLightboxImage, setHistoryLightboxImage] = useState<string | null>(null);
  const [editingHistoryImage, setEditingHistoryImage] = useState<string | null>(null);
  const [mainLightboxOpen, setMainLightboxOpen] = useState(false);

  // UI state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const savedStep = localStorage.getItem(STORAGE_EXTERNAL_STEP_KEY);
      const savedImage = localStorage.getItem(STORAGE_EXTERNAL_IMAGE_KEY);
      const savedHistory = localStorage.getItem(STORAGE_EXTERNAL_HISTORY_KEY);

      if (savedStep === 'result' && savedImage) {
        setStep('result');
        setCurrentImage(savedImage);
        setUploadedImage(savedImage);

        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          setImageHistory(parsedHistory.map((item: ImageHistoryItem) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })));
        }
      }
    } catch (error) {
      console.error('Error restoring external workflow state:', error);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (step === 'result' && currentImage) {
      try {
        localStorage.setItem(STORAGE_EXTERNAL_STEP_KEY, step);
        localStorage.setItem(STORAGE_EXTERNAL_IMAGE_KEY, currentImage);
        localStorage.setItem(STORAGE_EXTERNAL_HISTORY_KEY, JSON.stringify(imageHistory));
      } catch (error) {
        console.error('Error saving external workflow state:', error);
      }
    }
  }, [step, currentImage, imageHistory]);

  // Clear localStorage when starting over
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(STORAGE_EXTERNAL_STEP_KEY);
      localStorage.removeItem(STORAGE_EXTERNAL_IMAGE_KEY);
      localStorage.removeItem(STORAGE_EXTERNAL_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing external workflow localStorage:', error);
    }
  };

  const handleImageSelected = (imageData: string) => {
    setUploadedImage(imageData);
    setCurrentImage(imageData);
    setStep('modify');
    setEditModalOpen(true);
  };

  // Auto-save modified design to database
  const autoSaveModifiedDesign = async (
    originalImageData: string,
    modifiedImageData: string,
    modificationRequest: string,
    modelUsed: string
  ) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('⚠️ User not authenticated, skipping auto-save');
        return;
      }

      console.log('📤 Uploading modified design to storage for user:', user.id);

      // Generate a unique design ID
      const designId = crypto.randomUUID();

      // Process and upload image to storage (full + thumbnail)
      const { fullImageUrl, thumbnailUrl, fullImagePath, thumbnailPath } =
        await processAndUploadDesignImage(user.id, designId, modifiedImageData);

      console.log('✅ Images uploaded to storage, saving to modified_designs table...');

      // Save to modified_designs table (separate table for edited designs)
      const { error: dbError } = await supabase.from('modified_designs').insert({
        id: designId,
        user_id: user.id,
        original_image_url: originalImageData, // Store original uploaded image
        modified_image_url: fullImageUrl,
        modified_storage_path: fullImagePath,
        modified_thumbnail_url: thumbnailUrl,
        modified_thumbnail_storage_path: thumbnailPath,
        modification_request: modificationRequest,
        model_used: modelUsed, // Store the selected model
      });

      if (dbError) {
        console.error('❌ Database save error:', dbError);
        throw new Error(dbError.message);
      }

      console.log('✅ Modified design auto-saved successfully!');
    } catch (error) {
      console.error('❌ Error auto-saving modified design:', error);
      // Don't throw - we don't want to interrupt the user's workflow
      // The design is still displayed, they can manually save if needed
    }
  };

  const handleEditDesign = async (editRequest: string, model: string) => {
    // Check authentication before proceeding
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    // Determine which image to edit (from history or current)
    const imageToEdit = editingHistoryImage || currentImage;

    try {
      setLoading(true);
      setError('');
      setEditModalOpen(false);

      // Save current main image to history before modification
      if (currentImage && step === 'result') {
        const currentImageCopy = String(currentImage);
        const historyItem: ImageHistoryItem = {
          id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          imageUrl: currentImageCopy,
          prompt: editRequest,
          timestamp: new Date(),
          isOriginal: imageHistory.length === 0,
        };
        setImageHistory(prev => [historyItem, ...prev]);
      }

      console.log('=== External Edit: Starting modification ===');
      console.log('Image to edit length:', imageToEdit.length);
      console.log('Edit request:', editRequest);

      const response = await fetch('/api/edit-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalImageUrl: imageToEdit,
          editRequest,
          model: model,
        } as EditDesignRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: EditDesignResponse = await response.json();

      console.log('\n\n=== CLIENT RECEIVED RESPONSE ===');
      console.log('Full response:', JSON.stringify(data, null, 2));
      console.log('Has error:', !!data.error);
      console.log('Has imageData:', !!data.imageData);
      console.log('imageData type:', typeof data.imageData);
      console.log('=== END CLIENT RESPONSE ===\n\n');

      if (data.error) {
        console.error('❌ API returned error:', data.error);
        throw new Error(data.error);
      }

      if (!data.imageData) {
        console.error('❌ No imageData in response');
        throw new Error(t('design.external.errors.noImageData'));
      }

      console.log('✅ Modification successful');
      console.log('Received imageData length:', data.imageData?.length || 0);
      console.log('Received imageData prefix:', data.imageData?.substring(0, 50) || '');

      // Save previous image for reference
      setPreviousImage(currentImage);

      // Update current image
      const newImageData = `data:image/jpeg;base64,${data.imageData}`;
      console.log('New image data created, length:', newImageData.length);
      console.log('Setting new image as current image...');
      setCurrentImage(newImageData);

      // Clear editing history image
      setEditingHistoryImage(null);

      // 🆕 AUTO-SAVE: Automatically save modified design to database
      console.log('🔄 Auto-saving modified design to database...');
      await autoSaveModifiedDesign(imageToEdit, newImageData, editRequest, model);

      // Add to modification history
      setModificationHistory(prev => {
        const newHistory = [
          ...prev,
          {
            imageData: newImageData,
            description: editRequest,
            timestamp: Date.now(),
          },
        ];
        console.log('Updated modification history, total modifications:', newHistory.length);
        return newHistory;
      });

      console.log('Setting step to result...');
      setStep('result');
    } catch (err) {
      console.error('❌ Modification failed:', err);
      setError(err instanceof Error ? err.message : t('design.external.errors.modificationFailed'));
      setEditModalOpen(true); // Reopen modal to try again
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAnotherModification = () => {
    setEditModalOpen(true);
  };

  const handleTryAgainOnPrevious = () => {
    if (previousImage) {
      setCurrentImage(previousImage);
      setEditModalOpen(true);
    }
  };

  const handleSaveDesign = async () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    try {
      setSaving(true);
      setError(''); // Clear any previous errors
      await onSaveDesign(currentImage, modificationHistory);
      // Success is handled by the parent component (shows toast)
    } catch (err) {
      console.error('Failed to save design:', err);
      setError(err instanceof Error ? err.message : t('design.external.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleStartOver = () => {
    clearLocalStorage();
    setUploadedImage('');
    setCurrentImage('');
    setPreviousImage('');
    setModificationHistory([]);
    setImageHistory([]);
    setEditingHistoryImage(null);
    setStep('upload');
    setError('');
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ImageUploadStep
              onImageSelected={handleImageSelected}
              onBack={onBack}
            />
          </motion.div>
        )}

        {(step === 'modify' || step === 'result') && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto px-4 py-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                {t('design.external.result.title')}
              </h2>
              <p className="text-neutral-600">
                {modificationHistory.length > 0
                  ? t('design.external.result.subtitle')
                  : t('design.external.result.subtitleFirst')}
              </p>
            </div>

            {/* Loading State - matching scratch section design */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-gold"></div>
                <p className="text-lg text-gray-600">
                  {direction === 'rtl' ? 'جاري تعديل التصميم...' : 'Modifying design...'}
                </p>
              </div>
            )}

            {/* Result Image */}
            {!loading && currentImage && (
              <div className="space-y-6">
                <ImageCard
                  src={currentImage}
                  alt={direction === 'rtl' ? 'التصميم المعدل' : 'Modified Design'}
                  onView={() => setMainLightboxOpen(true)}
                  onDownload={() => {
                    const link = document.createElement('a');
                    link.href = currentImage;
                    link.download = `modified-design-${Date.now()}.jpg`;
                    link.click();
                  }}
                />

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Action Buttons - Luxurious compact design */}
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {/* Button 1: New Design */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartOver}
                    disabled={loading || saving}
                    className="group relative px-3 py-2.5 md:px-4 md:py-3 rounded-xl bg-white border border-gray-200 hover:border-accent-gold/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative text-xs md:text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                      {direction === 'rtl' ? 'تصميم جديد' : 'New Design'}
                    </span>
                  </motion.button>

                  {/* Button 2: Request Modification */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleApplyAnotherModification}
                    disabled={loading || saving}
                    className="group relative px-3 py-2.5 md:px-4 md:py-3 rounded-xl bg-gradient-to-r from-accent-gold/10 to-accent-gold/5 border border-accent-gold/30 hover:border-accent-gold shadow-sm hover:shadow-md hover:shadow-accent-gold/20 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/20 to-accent-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative text-xs md:text-sm font-medium text-accent-gold group-hover:text-accent-gold transition-colors">
                      {direction === 'rtl' ? 'طلب تعديل' : 'Modify'}
                    </span>
                  </motion.button>

                  {/* Button 3: Save Image */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveDesign}
                    disabled={loading || saving}
                    className="group relative px-3 py-2.5 md:px-4 md:py-3 rounded-xl bg-gradient-to-r from-accent-gold to-amber-500 border border-accent-gold shadow-sm hover:shadow-lg hover:shadow-accent-gold/30 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="relative flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    ) : (
                      <span className="relative text-xs md:text-sm font-medium text-white">
                        {direction === 'rtl' ? 'حفظ' : 'Save'}
                      </span>
                    )}
                  </motion.button>
                </div>

                {/* Previous Versions History */}
                {imageHistory.length > 0 && (
                  <div className="mt-6 md:mt-8">
                    <h3 className="text-lg font-semibold text-primary mb-4">
                      {direction === 'rtl' ? 'الإصدارات السابقة' : 'Previous Versions'}
                    </h3>
                    <div className="space-y-4">
                      {imageHistory.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4"
                        >
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* Square Image */}
                            <div className="w-full md:w-40 flex-shrink-0">
                              <div className="aspect-square w-full">
                                <img
                                  src={item.imageUrl}
                                  alt={`${direction === 'rtl' ? 'الإصدار' : 'Version'} ${imageHistory.length - index}`}
                                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setHistoryLightboxImage(item.imageUrl)}
                                />
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  item.isOriginal ? "bg-accent-gold/20 text-accent-gold" : "bg-gray-200 text-gray-600"
                                }`}>
                                  {item.isOriginal
                                    ? (direction === 'rtl' ? 'التصميم الأصلي' : 'Original Design')
                                    : (direction === 'rtl' ? `الإصدار ${imageHistory.length - index}` : `Version ${imageHistory.length - index}`)}
                                </span>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingHistoryImage(item.imageUrl);
                                    setEditModalOpen(true);
                                  }}
                                  className="flex-1 text-xs border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-white"
                                >
                                  {direction === 'rtl' ? 'طلب تعديل على هذا التصميم' : 'Request Edit on This Design'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = item.imageUrl;
                                    link.download = `dress-design-v${imageHistory.length - index}-${Date.now()}.png`;
                                    link.click();
                                  }}
                                  className="flex-1 text-xs border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-white"
                                >
                                  {direction === 'rtl' ? 'حفظ الصورة' : 'Save Image'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <EditDesignModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingHistoryImage(null);
        }}
        onSubmit={handleEditDesign}
        loading={loading}
      />

      {/* History Lightbox */}
      <Lightbox
        isOpen={!!historyLightboxImage}
        onClose={() => setHistoryLightboxImage(null)}
        imageSrc={historyLightboxImage || ''}
        imageAlt={direction === 'rtl' ? 'إصدار سابق' : 'Previous Version'}
      />

      {/* Main Result Lightbox */}
      <Lightbox
        isOpen={mainLightboxOpen}
        onClose={() => setMainLightboxOpen(false)}
        imageSrc={currentImage}
        imageAlt={direction === 'rtl' ? 'التصميم المعدل' : 'Modified Design'}
      />
    </div>
  );
}


