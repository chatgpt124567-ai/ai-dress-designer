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

interface DesignGalleryProps {
  designs: Design[];
  loading: boolean;
  onDesignsUpdate: () => void;
}

export default function DesignGallery({ designs, loading, onDesignsUpdate }: DesignGalleryProps) {
  const { t, direction } = useLanguage();
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [isEditingDesign, setIsEditingDesign] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);

      // Optimistic UI update - remove from UI immediately
      const supabase = createClient();
      const { error } = await supabase.from('designs').delete().eq('id', id);

      if (error) throw error;

      // Refresh designs list
      onDesignsUpdate();
    } catch (error) {
      console.error('Error deleting design:', error);
      alert(t('profile.designs.deleteError'));
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

  const handleEditDesign = async (editRequest: string) => {
    if (!editingDesign) return;

    console.log('Starting edit design process in DesignGallery...', {
      imageUrlLength: editingDesign.image_url.length,
      editRequestLength: editRequest.length,
      imageUrlPrefix: editingDesign.image_url.substring(0, 100),
      isBase64DataUrl: editingDesign.image_url.startsWith('data:image/'),
      imageUrlType: typeof editingDesign.image_url,
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
        console.log('Saving edited design to database...');

        try {
          // Save edited design to database
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (!user) {
            throw new Error(direction === 'rtl' ? 'المستخدم غير مسجل الدخول' : 'User not authenticated');
          }

          console.log('Inserting design into database for user:', user.id);

          const { error: dbError } = await supabase.from('designs').insert({
            user_id: user.id,
            original_description: editingDesign.original_description || JSON.stringify(editingDesign.questionnaire_answers),
            image_url: data.imageData,
            image_data: data.imageData,
            enhanced_prompt: editingDesign.enhanced_prompt + `\n\nEdit: ${editRequest}`,
            questionnaire_answers: editingDesign.questionnaire_answers,
            embellishment_placement: editingDesign.questionnaire_answers?.embellishmentPlacement || null,
          });

          if (dbError) {
            console.error('Supabase insert error:', {
              message: dbError.message,
              details: dbError.details,
              hint: dbError.hint,
              code: dbError.code,
            });
            throw new Error(
              dbError.message ||
              (direction === 'rtl' ? 'فشل في حفظ التصميم في قاعدة البيانات' : 'Failed to save design to database')
            );
          }

          console.log('Design saved successfully, refreshing designs...');

          // Refresh designs
          onDesignsUpdate();

          console.log('Designs refreshed successfully');

          setEditModalOpen(false);
          setEditingDesign(null);
          alert(direction === 'rtl' ? 'تم حفظ التصميم المعدّل بنجاح!' : 'Edited design saved successfully!');
        } catch (dbSaveError) {
          console.error('Error saving edited design to database:', dbSaveError);
          throw dbSaveError; // Re-throw to be caught by outer catch
        }
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
    </div>
  );
}

