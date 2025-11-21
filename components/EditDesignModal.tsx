'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import Button from './Button';

interface EditDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (editRequest: string) => void;
  loading?: boolean;
}

export default function EditDesignModal({ isOpen, onClose, onSubmit, loading = false }: EditDesignModalProps) {
  const { t, direction } = useLanguage();
  const [editRequest, setEditRequest] = useState('');

  const handleSubmit = () => {
    if (editRequest.trim()) {
      onSubmit(editRequest.trim());
      setEditRequest(''); // Clear after submit
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEditRequest('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                'bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden',
                'flex flex-col'
              )}
              dir={direction}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-gold/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-accent-gold" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-primary">
                    {t('design.edit.title')}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className={cn(
                    'w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors',
                    loading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <p className="text-neutral-600 text-sm md:text-base">
                  {t('design.edit.description')}
                </p>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary">
                    {t('design.edit.label')}
                  </label>
                  <textarea
                    value={editRequest}
                    onChange={(e) => setEditRequest(e.target.value)}
                    placeholder={t('design.edit.placeholder')}
                    disabled={loading}
                    rows={6}
                    className={cn(
                      'w-full px-4 py-3 border-2 border-gray-200 rounded-lg',
                      'focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20',
                      'transition-all text-sm md:text-base resize-none',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      direction === 'rtl' ? 'text-right' : 'text-left'
                    )}
                    dir={direction}
                  />
                </div>

                {/* Examples */}
                <div className="bg-muted-beige/30 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-primary">
                    {t('design.edit.examples.title')}
                  </p>
                  <ul className={cn(
                    'text-sm text-neutral-600 space-y-1',
                    direction === 'rtl' ? 'pr-4' : 'pl-4'
                  )}>
                    <li className="list-disc">{t('design.edit.examples.example1')}</li>
                    <li className="list-disc">{t('design.edit.examples.example2')}</li>
                    <li className="list-disc">{t('design.edit.examples.example3')}</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={loading || !editRequest.trim()}
                  loading={loading}
                  className="flex-1"
                >
                  {t('design.edit.submit')}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

