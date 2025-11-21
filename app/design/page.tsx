'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shirt } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { EnhancePromptResponse, GenerateImageResponse, QuestionnaireAnswers } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import QuestionnaireWizard from '@/components/QuestionnaireWizard';
import ImageCard from '@/components/ImageCard';
import Lightbox from '@/components/Lightbox';
import Toast, { ToastType } from '@/components/Toast';
import { ImageSkeleton } from '@/components/Skeleton';
import AuthModal from '@/components/AuthModal';
import DesignDetailsModal from '@/components/profile/DesignDetailsModal';
import EditDesignModal from '@/components/EditDesignModal';
import { createClient } from '@/lib/supabase/client';
import type { EditDesignRequest, EditDesignResponse } from '@/app/api/edit-design/route';

export default function DesignPage() {
  const { t, direction } = useLanguage();
  const [description, setDescription] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'enhancing' | 'generating' | 'complete'>('input');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [activeTab, setActiveTab] = useState<'results' | 'history' | 'prompt'>('results');
  const [currentAnswers, setCurrentAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAnswers, setPendingAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [previousDesigns, setPreviousDesigns] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryDesign, setSelectedHistoryDesign] = useState<any | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Fetch previous designs when history tab is opened
  const fetchPreviousDesigns = async () => {
    try {
      setLoadingHistory(true);
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPreviousDesigns([]);
        return;
      }

      const { data, error } = await supabase
        .from('designs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20); // Limit to 20 most recent designs

      if (error) throw error;

      setPreviousDesigns(data || []);
    } catch (error) {
      console.error('Error fetching previous designs:', error);
      setPreviousDesigns([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch designs when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && isAuthenticated) {
      fetchPreviousDesigns();
    }
  }, [activeTab, isAuthenticated]);

  const handleSubmit = async (questionnaireAnswers: QuestionnaireAnswers) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Save answers temporarily and show auth modal
      setPendingAnswers(questionnaireAnswers);
      setAuthModalOpen(true);
      return;
    }

    // Proceed with design generation
    await processDesign(questionnaireAnswers);
  };

  const handleAuthSuccess = async () => {
    setAuthModalOpen(false);

    // If there are pending answers, process them
    if (pendingAnswers) {
      await processDesign(pendingAnswers);
      setPendingAnswers(null);
    }
  };

  const processDesign = async (questionnaireAnswers: QuestionnaireAnswers) => {
    setError('');
    setEnhancedPrompt('');
    setImageUrl('');
    setCurrentAnswers(questionnaireAnswers); // Store answers for later saving

    try {
      setLoading(true);
      setStep('enhancing');

      // Step 1: Send questionnaire answers to enhance-prompt API
      const enhanceResponse = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionnaireAnswers }),
      });

      const enhanceData: EnhancePromptResponse = await enhanceResponse.json();

      if (!enhanceResponse.ok || enhanceData.error) {
        throw new Error(enhanceData.error || 'Failed to enhance prompt');
      }

      const finalPrompt = enhanceData.enhancedPrompt;
      setEnhancedPrompt(finalPrompt);
      setDescription(finalPrompt); // Store enhanced prompt as description

      // Step 2: Generate image using enhanced prompt
      setStep('generating');

      const generateResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      const generateData: GenerateImageResponse = await generateResponse.json();

      if (!generateResponse.ok || generateData.error) {
        throw new Error(generateData.error || 'Failed to generate image');
      }

      let generatedImageUrl = '';
      if (generateData.imageUrl) {
        generatedImageUrl = generateData.imageUrl;
        setImageUrl(generateData.imageUrl);
      } else if (generateData.imageData) {
        generatedImageUrl = generateData.imageData;
        setImageUrl(generateData.imageData);
      } else {
        throw new Error('No image received from server');
      }

      // Step 3: Auto-save design to database
      await autoSaveDesign(questionnaireAnswers, finalPrompt, generatedImageUrl);

      setStep('complete');
      showToast(t('design.toast.success'), 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('design.toast.error');
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDescription('');
    setEnhancedPrompt('');
    setImageUrl('');
    setError('');
    setStep('input');
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `dress-design-${Date.now()}.png`;
      link.click();
      showToast(t('design.toast.downloaded'), 'success');
    }
  };

  const handleEditDesign = async (editRequest: string) => {
    if (!imageUrl) {
      showToast('لا توجد صورة للتعديل', 'error');
      return;
    }

    try {
      setEditingDesign(true);
      setStep('generating');

      const response = await fetch('/api/edit-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalImageUrl: imageUrl,
          editRequest,
        } as EditDesignRequest),
      });

      const data: EditDesignResponse = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to edit design');
      }

      if (data.imageData) {
        setImageUrl(data.imageData);
        setStep('complete');
        setEditModalOpen(false);
        showToast('تم تعديل التصميم بنجاح!', 'success');

        // Auto-save edited design if user is authenticated
        if (isAuthenticated && currentAnswers) {
          await autoSaveDesign(currentAnswers, enhancedPrompt, data.imageData);
        }
      }
    } catch (error) {
      console.error('Error editing design:', error);
      setError(error instanceof Error ? error.message : 'Failed to edit design');
      showToast(error instanceof Error ? error.message : 'فشل في تعديل التصميم', 'error');
      setStep('complete');
    } finally {
      setEditingDesign(false);
    }
  };

  // Auto-save design after successful generation
  const autoSaveDesign = async (
    answers: QuestionnaireAnswers,
    prompt: string,
    imageUrl: string
  ) => {
    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not authenticated, skipping auto-save');
        return;
      }

      // Save design to database
      const { error } = await supabase.from('designs').insert({
        user_id: user.id,
        original_description: JSON.stringify(answers), // Store questionnaire answers as JSON
        enhanced_prompt: prompt,
        image_url: imageUrl,
        image_data: imageUrl,
        questionnaire_answers: answers,
        embellishment_placement: answers?.embellishmentPlacement || null,
      });

      if (error) {
        console.error('Auto-save error:', error);
        return;
      }

      console.log('Design auto-saved successfully');
    } catch (error) {
      console.error('Error auto-saving design:', error);
    }
  };



  return (
    <div className="min-h-screen bg-muted-beige">
      <Header />

      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <main className="pt-24 md:pt-32 pb-16 md:pb-24 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 md:mb-12"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold text-primary mb-3 md:mb-4">
              {t('design.title')}
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-neutral-500">
              {t('design.subtitle')}
            </p>
          </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
          {/* Left Column - Questionnaire (40%) - Full width on mobile */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <QuestionnaireWizard onSubmit={handleSubmit} loading={loading} />
          </div>

          {/* Right Column - Results Preview (60%) - Full width on mobile */}
          <div className="lg:col-span-3">
            <div className="luxury-card p-4 md:p-6">
              {/* Tabs */}
              <div className={cn("flex border-b border-gray-200 mb-4 md:mb-6", direction === 'rtl' ? 'space-x-reverse space-x-2 md:space-x-4' : 'space-x-2 md:space-x-4')}>
                {(['results', 'history', 'prompt'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 md:pb-3 px-2 md:px-4 text-sm md:text-base font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-accent-gold text-primary'
                        : 'text-neutral-500 hover:text-primary'
                    }`}
                  >
                    {t(`design.tabs.${tab}`)}
                  </button>
                ))}
              </div>

              {/* Results Tab */}
              {activeTab === 'results' && (
                <div>
                  {/* Enhanced Prompt Display removed - showing image only */}

                  {!imageUrl && !loading && (
                    <div className="flex items-center justify-center h-[400px] md:h-[500px] lg:h-[600px] bg-muted-beige/50 rounded-xl md:rounded-2xl border-2 border-dashed border-gray-300">
                      <div className="text-center px-4">
                        <div className="text-4xl md:text-5xl lg:text-6xl mb-3 md:mb-4">👗</div>
                        <p className="text-neutral-500 text-sm md:text-base lg:text-lg">{t('design.results.placeholder')}</p>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-[400px] md:h-[500px] lg:h-[600px] bg-muted-beige/30 rounded-xl md:rounded-2xl"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="mb-6"
                      >
                        <Shirt className="w-20 h-20 md:w-24 md:h-24 text-gray-300" strokeWidth={1.5} />
                      </motion.div>

                      <div className="text-center px-4 space-y-2">
                        <p className="text-lg md:text-xl font-medium text-primary">
                          {step === 'enhancing' && (
                            direction === 'rtl'
                              ? 'جارٍ تحسين وصف فستانك... ✨'
                              : 'Enhancing your dress description... ✨'
                          )}
                          {step === 'generating' && (
                            direction === 'rtl'
                              ? 'جارٍ تصميم فستانك... ✨'
                              : 'Designing your dress... ✨'
                          )}
                        </p>
                        <p className="text-sm md:text-base text-neutral-500">
                          {direction === 'rtl'
                            ? 'الرجاء الانتظار قليلاً'
                            : 'Please wait a moment'}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4 md:space-y-6"
                    >
                      <ImageCard
                        src={imageUrl}
                        alt={t('design.results.generatedDesign')}
                        onView={() => setLightboxOpen(true)}
                        onDownload={handleDownload}
                      />

                      <div className="space-y-3 md:space-y-4">
                        {/* Request Edit Button */}
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setEditModalOpen(true)}
                          disabled={editingDesign}
                          className="w-full text-sm md:text-base border-2 border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-white transition-all"
                        >
                          {t('design.results.requestEdit')}
                        </Button>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                          <Button
                            variant="ghost"
                            size="lg"
                            onClick={handleReset}
                            className="flex-1 text-sm md:text-base"
                          >
                            {t('design.results.newDesign')}
                          </Button>
                          <Button
                            variant="primary"
                            size="lg"
                            onClick={handleDownload}
                            className="flex-1 text-sm md:text-base"
                          >
                            {t('design.results.download')}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {!isAuthenticated ? (
                    <div className="text-center py-12">
                      <p className="text-neutral-500 mb-4">
                        {direction === 'rtl'
                          ? 'يجب تسجيل الدخول لعرض تصاميمك السابقة'
                          : 'Please login to view your previous designs'}
                      </p>
                      <Link href="/auth/login">
                        <Button variant="primary">
                          {direction === 'rtl' ? 'تسجيل الدخول' : 'Login'}
                        </Button>
                      </Link>
                    </div>
                  ) : loadingHistory ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-gold"></div>
                      <p className="text-neutral-500 mt-4">
                        {direction === 'rtl' ? 'جارٍ التحميل...' : 'Loading...'}
                      </p>
                    </div>
                  ) : previousDesigns.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">👗</div>
                      <p className="text-neutral-500">
                        {direction === 'rtl'
                          ? 'لا توجد تصاميم سابقة بعد. ابدئي بإنشاء تصميمك الأول!'
                          : 'No previous designs yet. Start creating your first design!'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {previousDesigns.map((design) => (
                        <motion.div
                          key={design.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => {
                            // Open modal instead of switching to results tab
                            setSelectedHistoryDesign(design);
                          }}
                        >
                          <div className="aspect-square relative bg-gray-100">
                            {design.image_url ? (
                              <img
                                src={design.image_url}
                                alt="Design"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Shirt className="w-16 h-16 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-gray-500">
                              {new Date(design.created_at).toLocaleDateString(
                                direction === 'rtl' ? 'ar-SA' : 'en-US',
                                { year: 'numeric', month: 'short', day: 'numeric' }
                              )}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Prompt Tab */}
              {activeTab === 'prompt' && (
                <div className="space-y-4">
                  {enhancedPrompt ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-primary">
                          {t('design.tabs.promptTitle')}
                        </h3>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(enhancedPrompt);
                            showToast(t('design.tabs.promptCopied'), 'success');
                          }}
                        >
                          {t('design.tabs.copyPrompt')}
                        </Button>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                          {enhancedPrompt}
                        </pre>
                      </div>
                      <p className="text-xs text-gray-500 italic">
                        {t('design.tabs.promptNote')}
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-neutral-500">{t('design.tabs.promptPlaceholder')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lightbox */}
        <Lightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageSrc={imageUrl}
          imageAlt={t('design.results.generatedDesign')}
          prompt={enhancedPrompt || description}
          timestamp={new Date().toLocaleString()}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />

        {/* Design Details Modal for History */}
        <DesignDetailsModal
          design={selectedHistoryDesign}
          onClose={() => setSelectedHistoryDesign(null)}
          onDelete={async (id: string) => {
            try {
              const supabase = createClient();
              const { error } = await supabase.from('designs').delete().eq('id', id);
              if (error) throw error;

              // Refresh history
              await fetchPreviousDesigns();
              setSelectedHistoryDesign(null);
              showToast(
                direction === 'rtl' ? 'تم حذف التصميم بنجاح' : 'Design deleted successfully',
                'success'
              );
            } catch (error) {
              console.error('Error deleting design:', error);
              showToast(
                direction === 'rtl' ? 'فشل حذف التصميم' : 'Failed to delete design',
                'error'
              );
            }
          }}
        />

        {/* Edit Design Modal */}
        <EditDesignModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleEditDesign}
          loading={editingDesign}
        />

        </div>
      </main>

      <Footer />
    </div>
  );
}

