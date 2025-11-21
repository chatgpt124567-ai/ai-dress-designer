'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import DesignCard from './DesignCard';
import DesignDetailsModal from './DesignDetailsModal';
import { createClient } from '@/lib/supabase/client';
import type { QuestionnaireAnswers } from '@/types';

interface Design {
  id: string;
  image_url: string;
  enhanced_prompt: string;
  created_at: string;
  is_favorite: boolean;
  questionnaire_answers?: QuestionnaireAnswers | null;
}

interface DesignGalleryProps {
  designs: Design[];
  loading: boolean;
  onDesignsUpdate: () => void;
}

export default function DesignGallery({ designs, loading, onDesignsUpdate }: DesignGalleryProps) {
  const { t } = useLanguage();
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      />
    </div>
  );
}

