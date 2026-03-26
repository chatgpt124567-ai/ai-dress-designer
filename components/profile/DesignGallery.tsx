'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import DesignCard from './DesignCard';
import DesignDetailsModal from './DesignDetailsModal';
import EditDesignModal from '@/components/EditDesignModal';
import { createClient } from '@/lib/supabase/client';
import type { QuestionnaireAnswers, Design } from '@/types';
import type { EditDesignRequest, EditDesignResponse } from '@/app/api/edit-design/route';
import { processAndUploadDesignImage } from '@/lib/imageUtils';

interface DesignGalleryProps {
  designs: Design[];
  loading: boolean;
  onDesignsUpdate: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function DesignGallery({
  designs,
  loading,
  onDesignsUpdate,
  hasMore = false,
  onLoadMore
}: DesignGalleryProps) {
  const { t, direction } = useLanguage();
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [isEditingDesign, setIsEditingDesign] = useState(false);
  const [previewImageData, setPreviewImageData] = useState<string | null>(null);
  const [pendingEditRequest, setPendingEditRequest] = useState<string>('');
  const [isSavingDesign, setIsSavingDesign] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);

      const supabase = createClient();

      console.log('=== Starting delete process for design:', id);

      // Get design details to delete storage files
      const { data: design, error: fetchError } = await supabase
        .from('designs')
        .select('storage_path, thumbnail_storage_path, user_id')
        .eq('id', id)
        .single();

      console.log('Fetch result:', { design, fetchError });

      if (fetchError) {
        console.error('❌ Error fetching design for deletion:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code,
        });
        throw new Error(`Failed to fetch design: ${fetchError.message}`);
      }

      if (!design) {
        console.error('❌ Design not found:', id);
        throw new Error('Design not found');
      }

      console.log('✅ Design fetched successfully:', design);

      // Delete from database
      console.log('Attempting to delete from database...');
      const { data: deleteData, error: deleteError } = await supabase
        .from('designs')
        .delete()
        .eq('id', id)
        .select(); // Add select() to get deleted row

      console.log('Delete result:', { deleteData, deleteError });

      if (deleteError) {
        console.error('❌ Error deleting design from database:', {
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint,
          code: deleteError.code,
        });
        throw new Error(`Failed to delete from database: ${deleteError.message}`);
      }

      console.log('✅ Design deleted from database successfully');

      // Manually delete storage files as backup (in case trigger doesn't work)
      if (design?.storage_path || design?.thumbnail_storage_path) {
        const filesToDelete = [];
        if (design.storage_path) filesToDelete.push(design.storage_path);
        if (design.thumbnail_storage_path) filesToDelete.push(design.thumbnail_storage_path);

        if (filesToDelete.length > 0) {
          console.log('Attempting to delete storage files:', filesToDelete);
          const { data: storageData, error: storageError } = await supabase.storage
            .from('design-images')
            .remove(filesToDelete);

          console.log('Storage delete result:', { storageData, storageError });

          if (storageError) {
            console.error('⚠️ Error deleting storage files:', storageError);
            // Don't throw - design is already deleted from DB
          } else {
            console.log('✅ Storage files deleted successfully');
          }
        }
      }

      console.log('=== Delete process completed successfully');

      // Refresh designs list
      onDesignsUpdate();
    } catch (error) {
      console.error('❌ Error deleting design:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`${t('profile.designs.deleteError')}\n\n${errorMessage}`);

      // Refresh to restore the design if delete failed
      onDesignsUpdate();
    } finally {
      setDeletingId(null);
    }
  };

  const handleCardClick = (design: Design) => {
    setSelectedDesign(design);
  };

  const handleRequestEdit = (design: Design) => {
    setEditingDesign(design);
    setEditModalOpen(true);
  };

  const handleEditDesign = async (editRequest: string, model: string) => {
    if (!editingDesign) return;

    console.log('Starting edit design process in DesignGallery...', {
      imageUrlLength: editingDesign.image_url.length,
      editRequestLength: editRequest.length,
      imageUrlPrefix: editingDesign.image_url.substring(0, 100),
      isBase64DataUrl: editingDesign.image_url.startsWith('data:image/'),
      imageUrlType: typeof editingDesign.image_url,
      model,
    });

    try {
      setIsEditingDesign(true);

      const response = await fetch('/api/edit-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalImageUrl: editingDesign.image_url,
          editRequest,
          model,
        } as EditDesignRequest),
      });

      console.log('API Response status:', response.status, response.statusText);

      let data: EditDesignResponse;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error(direction === 'rtl'
          ? 'خطأ في الاستجابة من الخادم'
          : 'Invalid response from server');
      }

      console.log('API Response data:', { hasImageData: !!data.imageData, error: data.error });

      if (!response.ok || data.error) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.imageData) {
        console.log('Received image data from API, length:', data.imageData.length);

        // Close edit modal and show preview
        setEditModalOpen(false);
        setPendingEditRequest(editRequest);
        setPreviewImageData(data.imageData);

        // Auto-save to library in background
        autoSaveEditedDesign(data.imageData, editRequest);
      }
    } catch (error) {
      console.error('Error editing design:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        raw: error,
      });

      let errorMessage = direction === 'rtl' ? 'فشل في تعديل التصميم' : 'Failed to edit design';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }

      alert(errorMessage);
    } finally {
      setIsEditingDesign(false);
    }
  };

  const autoSaveEditedDesign = async (imageData: string, editRequest: string) => {
    if (!editingDesign) return;

    try {
      setIsSavingDesign(true);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const designId = crypto.randomUUID();
      const { fullImageUrl, thumbnailUrl, fullImagePath, thumbnailPath } =
        await processAndUploadDesignImage(user.id, designId, imageData);

      const { error: dbError } = await supabase.from('designs').insert({
        id: designId,
        user_id: user.id,
        original_description: editingDesign.original_description || JSON.stringify(editingDesign.questionnaire_answers),
        image_url: fullImageUrl,
        storage_path: fullImagePath,
        thumbnail_url: thumbnailUrl,
        thumbnail_storage_path: thumbnailPath,
        enhanced_prompt: editingDesign.enhanced_prompt + `\n\nEdit: ${editRequest}`,
        questionnaire_answers: editingDesign.questionnaire_answers,
        embellishment_placement: editingDesign.questionnaire_answers?.embellishmentPlacement || null,
      });

      if (dbError) throw new Error(dbError.message);

      onDesignsUpdate();
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSavingDesign(false);
    }
  };

  const handleDownloadPreview = () => {
    if (!previewImageData) return;
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${previewImageData}`;
    a.download = `edited-design-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRequestAnotherEdit = () => {
    if (!previewImageData || !editingDesign) return;
    // Use the current preview image as the new base for editing
    setEditingDesign({
      ...editingDesign,
      image_url: `data:image/png;base64,${previewImageData}`,
    });
    setPreviewImageData(null);
    setPendingEditRequest('');
    setEditModalOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewImageData(null);
    setEditingDesign(null);
    setPendingEditRequest('');
  };

  // Filter out designs that are being deleted (optimistic UI)
  const visibleDesigns = designs.filter(d => d.id !== deletingId);

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="elegant-frame">
              <div className="aspect-[3/4] bg-gradient-to-br from-accent-gold/10 to-primary/5 rounded-lg animate-pulse" />
              <div className="mt-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleDesigns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-6xl mb-4">👗</div>
          <p className="text-xl text-neutral-500 mb-4">{t('profile.designs.empty')}</p>
          <p className="text-neutral-400 mb-6">{t('profile.designs.createFirst')}</p>
          <a
            href="/design"
            className="inline-block px-6 py-3 bg-accent-gold text-white rounded-lg hover:bg-accent-gold/90 transition-colors"
          >
            {t('profile.designs.goToDesign')}
          </a>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {visibleDesigns.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  onDelete={handleDelete}
                  onClick={handleCardClick}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Load More Button */}
          {hasMore && onLoadMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={onLoadMore}
                disabled={loading}
                className="px-8 py-3 bg-accent-gold text-white rounded-lg hover:bg-accent-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? (direction === 'rtl' ? 'جارٍ التحميل...' : 'Loading...')
                  : (direction === 'rtl' ? 'تحميل المزيد' : 'Load More')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Design Details Modal */}
      <DesignDetailsModal
        design={selectedDesign}
        onClose={() => setSelectedDesign(null)}
        onDelete={handleDelete}
        onRequestEdit={handleRequestEdit}
      />

      {/* Edit Design Modal */}
      <EditDesignModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingDesign(null);
        }}
        onSubmit={handleEditDesign}
        loading={isEditingDesign}
      />

      {/* Edit Result Preview Modal */}
      <AnimatePresence>
        {previewImageData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            dir={direction}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-primary">
                    {direction === 'rtl' ? 'نتيجة التعديل' : 'Edit Result'}
                  </h2>
                  {/* Auto-save status */}
                  <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                    isSavingDesign
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-green-50 text-green-600'
                  }`}>
                    {isSavingDesign ? (
                      <>
                        <div className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-500 rounded-full animate-spin" />
                        {direction === 'rtl' ? 'جارٍ الحفظ...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {direction === 'rtl' ? 'تم الحفظ في المكتبة' : 'Saved to Library'}
                      </>
                    )}
                  </span>
                </div>
                <button
                  onClick={handleClosePreview}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Image Preview */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-50">
                  <img
                    src={`data:image/png;base64,${previewImageData}`}
                    alt="Edited Design Preview"
                    className="w-full object-contain max-h-[55vh]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-5 border-t border-gray-200">
                <button
                  onClick={handleDownloadPreview}
                  className="flex-1 px-5 py-3 rounded-xl border-2 border-gray-200 text-neutral-700 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {direction === 'rtl' ? 'حفظ الصورة' : 'Save Image'}
                </button>
                <button
                  onClick={handleRequestAnotherEdit}
                  disabled={isSavingDesign}
                  className="flex-1 px-5 py-3 rounded-xl bg-accent-gold text-white font-semibold hover:bg-accent-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {direction === 'rtl' ? 'طلب تعديل آخر' : 'Request Another Edit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

