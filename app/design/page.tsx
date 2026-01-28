'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, Home, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { EnhancePromptResponse, GenerateImageResponse, QuestionnaireAnswers, GeminiImageModel, GenerateMultiplePromptsResponse, BatchDesignQuestionnaireAnswers } from '@/types';
import Header from '@/components/Header';
import Button from '@/components/Button';
import QuestionnaireWizard from '@/components/QuestionnaireWizard';
import ImageCard from '@/components/ImageCard';
import Lightbox from '@/components/Lightbox';
import Toast, { ToastType } from '@/components/Toast';
import { ImageSkeleton } from '@/components/Skeleton';
import AuthModal from '@/components/AuthModal';
import DesignDetailsModal from '@/components/profile/DesignDetailsModal';
import EditDesignModal from '@/components/EditDesignModal';
import QuestionnaireReviewModal from '@/components/QuestionnaireReviewModal';
import DesignModeSelection from '@/components/DesignModeSelection';
import ExternalEditWorkflow from '@/components/ExternalEditWorkflow';
import ModelSelectionModal from '@/components/ModelSelectionModal';
import OwnFabricUpload from '@/components/OwnFabricUpload';
import FabricPlacementStep from '@/components/FabricPlacementStep';
import SimplifiedQuestionnaireWizard from '@/components/SimplifiedQuestionnaireWizard';
import RemoveModelWorkflow from '@/components/RemoveModelWorkflow';
import MultiDesignChoice from '@/components/MultiDesignChoice';
import MultiDesignResults from '@/components/MultiDesignResults';
import BatchDesignQuestionnaire from '@/components/BatchDesignQuestionnaire';
import { createClient } from '@/lib/supabase/client';
import type { EditDesignRequest, EditDesignResponse } from '@/app/api/edit-design/route';
import { processAndUploadDesignImage } from '@/lib/imageUtils';

type DesignMode = 'selection' | 'scratch' | 'external' | 'ownFabric' | 'removeModel';

export default function DesignPage() {
  const { t, direction } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Workflow mode state
  const [designMode, setDesignMode] = useState<DesignMode>('selection');

  // Existing state
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
  const [activeTab, setActiveTab] = useState<'results' | 'history'>('results');
  const [currentAnswers, setCurrentAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAnswers, setPendingAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [previousDesigns, setPreviousDesigns] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryDesign, setSelectedHistoryDesign] = useState<any | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [editingHistoryDesign, setEditingHistoryDesign] = useState<any | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [pendingSubmitAnswers, setPendingSubmitAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [modelSelectionModalOpen, setModelSelectionModalOpen] = useState(false); // Track model selection modal
  const [selectedModel, setSelectedModel] = useState<GeminiImageModel>('google/gemini-2.5-flash-image'); // Track selected model
  const [pendingGenerationAnswers, setPendingGenerationAnswers] = useState<QuestionnaireAnswers | null>(null); // Track answers pending model selection

  // Own Fabric Workflow State
  const [ownFabricStep, setOwnFabricStep] = useState<'upload' | 'choice' | 'placement' | 'questionnaire' | 'batchQuestionnaire' | 'multiDesign'>('upload');
  const [batchQuestionnaireAnswers, setBatchQuestionnaireAnswers] = useState<BatchDesignQuestionnaireAnswers | null>(null);
  const [primaryFabricImage, setPrimaryFabricImage] = useState<string | undefined>();
  const [secondaryFabricImage, setSecondaryFabricImage] = useState<string | undefined>();
  const [secondaryFabricType, setSecondaryFabricType] = useState<string | undefined>();
  const [primaryFabricPlacement, setPrimaryFabricPlacement] = useState<string | undefined>();
  const [secondaryFabricPlacement, setSecondaryFabricPlacement] = useState<string | undefined>();

  // Multi Design State (5 designs at once)
  interface MultiDesignResult {
    id: string;
    prompt: string;
    imageUrl?: string;
    error?: string;
    status: 'pending' | 'generating' | 'complete' | 'error' | 'editing';
  }
  const [multiDesigns, setMultiDesigns] = useState<MultiDesignResult[]>([]);
  const [multiDesignLoading, setMultiDesignLoading] = useState(false);
  const [multiDesignModelModalOpen, setMultiDesignModelModalOpen] = useState(false);

  // Multi-design edit state
  const [editingMultiDesignId, setEditingMultiDesignId] = useState<string | null>(null);
  const [editingMultiDesignModal, setEditingMultiDesignModal] = useState(false);

  // Image History State - to track previous versions after modifications
  interface ImageHistoryItem {
    id: string; // Unique ID for React key
    imageUrl: string;
    prompt: string;
    timestamp: Date;
    isOriginal: boolean;
  }
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);
  const [historyLightboxImage, setHistoryLightboxImage] = useState<string | null>(null);

  // LocalStorage keys for saving questionnaire answers and current step
  const STORAGE_KEY = 'ai_dress_designer_questionnaire_answers';
  const STORAGE_STEP_KEY = 'ai_dress_designer_current_step';
  const OAUTH_REDIRECT_FLAG = 'ai_dress_designer_oauth_redirect';
  // New keys for preserving full page state
  const STORAGE_DESIGN_MODE_KEY = 'ai_dress_designer_design_mode';
  const STORAGE_PAGE_STEP_KEY = 'ai_dress_designer_page_step';
  const STORAGE_IMAGE_URL_KEY = 'ai_dress_designer_image_url';
  const STORAGE_IMAGE_HISTORY_KEY = 'ai_dress_designer_image_history';
  const STORAGE_ENHANCED_PROMPT_KEY = 'ai_dress_designer_enhanced_prompt';
  // OwnFabric specific keys
  const STORAGE_OWNFABRIC_STEP_KEY = 'ai_dress_designer_ownfabric_step';
  const STORAGE_OWNFABRIC_PRIMARY_IMAGE_KEY = 'ai_dress_designer_ownfabric_primary_image';
  const STORAGE_OWNFABRIC_SECONDARY_IMAGE_KEY = 'ai_dress_designer_ownfabric_secondary_image';
  const STORAGE_OWNFABRIC_PLACEMENTS_KEY = 'ai_dress_designer_ownfabric_placements';

  // Load saved answers and full page state from localStorage on mount
  useEffect(() => {
    console.log('=== Design Page Mount ===');

    try {
      // Always try to restore saved answers (whether from OAuth or normal navigation)
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('Saved answers in localStorage:', saved ? 'Found' : 'Not found');

      if (saved) {
        const parsedAnswers = JSON.parse(saved);
        setSavedAnswers(parsedAnswers);
        setCurrentAnswers(parsedAnswers);
        console.log('✅ Restored saved answers:', parsedAnswers);
      }

      // Restore full page state
      const savedDesignMode = localStorage.getItem(STORAGE_DESIGN_MODE_KEY) as DesignMode | null;
      const savedPageStep = localStorage.getItem(STORAGE_PAGE_STEP_KEY) as 'input' | 'enhancing' | 'generating' | 'complete' | null;
      const savedImageUrl = localStorage.getItem(STORAGE_IMAGE_URL_KEY);
      const savedEnhancedPrompt = localStorage.getItem(STORAGE_ENHANCED_PROMPT_KEY);
      const savedImageHistory = localStorage.getItem(STORAGE_IMAGE_HISTORY_KEY);

      console.log('Restoring page state:', { savedDesignMode, savedPageStep, hasImageUrl: !!savedImageUrl, hasHistory: !!savedImageHistory });

      if (savedDesignMode && savedDesignMode !== 'selection') {
        setDesignMode(savedDesignMode);
      }

      if (savedPageStep && savedPageStep === 'complete' && savedImageUrl) {
        setStep(savedPageStep);
        setImageUrl(savedImageUrl);
        if (savedEnhancedPrompt) {
          setEnhancedPrompt(savedEnhancedPrompt);
        }
        console.log('✅ Restored complete state with image');
      }

      if (savedImageHistory) {
        try {
          const parsedHistory = JSON.parse(savedImageHistory);
          // Convert timestamp strings back to Date objects
          const historyWithDates = parsedHistory.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
          setImageHistory(historyWithDates);
          console.log('✅ Restored image history:', historyWithDates.length, 'items');
        } catch (e) {
          console.error('Error parsing image history:', e);
        }
      }

      // Restore ownFabric state if applicable
      if (savedDesignMode === 'ownFabric') {
        const savedOwnFabricStep = localStorage.getItem(STORAGE_OWNFABRIC_STEP_KEY);
        const savedPrimaryImage = localStorage.getItem(STORAGE_OWNFABRIC_PRIMARY_IMAGE_KEY);
        const savedSecondaryImage = localStorage.getItem(STORAGE_OWNFABRIC_SECONDARY_IMAGE_KEY);
        const savedPlacements = localStorage.getItem(STORAGE_OWNFABRIC_PLACEMENTS_KEY);

        if (savedPrimaryImage) {
          setPrimaryFabricImage(savedPrimaryImage);
        }
        if (savedSecondaryImage) {
          setSecondaryFabricImage(savedSecondaryImage);
        }
        if (savedPlacements) {
          try {
            const placements = JSON.parse(savedPlacements);
            setPrimaryFabricPlacement(placements.primary);
            setSecondaryFabricPlacement(placements.secondary);
            setSecondaryFabricType(placements.secondaryType);
          } catch (e) {
            console.error('Error parsing ownFabric placements:', e);
          }
        }
        if (savedOwnFabricStep) {
          setOwnFabricStep(savedOwnFabricStep as 'upload' | 'placement' | 'questionnaire');
        }
        console.log('✅ Restored ownFabric state');
      }

      // Check if we're returning from OAuth redirect
      const isOAuthRedirect = sessionStorage.getItem(OAUTH_REDIRECT_FLAG);
      console.log('OAuth redirect flag:', isOAuthRedirect);

      if (isOAuthRedirect) {
        // Clear the OAuth redirect flag
        sessionStorage.removeItem(OAUTH_REDIRECT_FLAG);
        console.log('Cleared OAuth redirect flag');
      }
    } catch (error) {
      console.error('❌ Error loading saved state:', error);
    }

    // No cleanup function - we want to keep the data even when navigating away
  }, []);

  // Read mode from URL query parameter and update designMode
  useEffect(() => {
    const modeFromUrl = searchParams.get('mode');
    const fabricModeFromUrl = searchParams.get('fabricMode');
    console.log('Mode from URL:', modeFromUrl, 'Fabric Mode:', fabricModeFromUrl);

    if (modeFromUrl && ['scratch', 'external', 'ownFabric', 'removeModel'].includes(modeFromUrl)) {
      console.log('Setting design mode from URL:', modeFromUrl);
      setDesignMode(modeFromUrl as DesignMode);

      // If ownFabric mode, check for fabricMode parameter to skip directly to the chosen workflow
      if (modeFromUrl === 'ownFabric' && fabricModeFromUrl) {
        if (fabricModeFromUrl === 'single') {
          console.log('Direct link to single custom design - skipping to questionnaire');
          // Skip choice screen and go directly to questionnaire
          setOwnFabricStep('questionnaire');
        } else if (fabricModeFromUrl === 'multi') {
          console.log('Direct link to multi-design - skipping to batch questionnaire');
          // Skip choice screen and go directly to batch questionnaire
          setOwnFabricStep('batchQuestionnaire');
        }
      }
    }
  }, [searchParams]);

  // Save page state to localStorage whenever it changes
  useEffect(() => {
    // Only save if we have meaningful state to save
    if (designMode !== 'selection') {
      localStorage.setItem(STORAGE_DESIGN_MODE_KEY, designMode);
    }
  }, [designMode]);

  // Save current step and image with quota protection
  useEffect(() => {
    if (step === 'complete' && imageUrl) {
      try {
        localStorage.setItem(STORAGE_PAGE_STEP_KEY, step);
        localStorage.setItem(STORAGE_IMAGE_URL_KEY, imageUrl);
        if (enhancedPrompt) {
          localStorage.setItem(STORAGE_ENHANCED_PROMPT_KEY, enhancedPrompt);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('⚠️ تم تجاوز حد التخزين المحلي عند حفظ الصورة الحالية');
          // مسح السجل القديم لإفساح المجال
          localStorage.removeItem(STORAGE_IMAGE_HISTORY_KEY);
        }
      }
    }
  }, [step, imageUrl, enhancedPrompt]);

  // Save image history to localStorage with quota protection
  useEffect(() => {
    if (imageHistory.length > 0) {
      try {
        // الاحتفاظ بآخر 3 صور فقط لتجنب امتلاء التخزين
        const MAX_HISTORY_ITEMS = 3;
        const limitedHistory = imageHistory.slice(-MAX_HISTORY_ITEMS);

        // حساب حجم البيانات تقريبياً (بالـ KB)
        const dataSize = JSON.stringify(limitedHistory).length / 1024;

        // تحذير إذا كان الحجم كبيراً (أكثر من 2MB)
        if (dataSize > 2048) {
          console.warn(`⚠️ حجم سجل الصور كبير: ${(dataSize / 1024).toFixed(2)} MB`);
        }

        localStorage.setItem(STORAGE_IMAGE_HISTORY_KEY, JSON.stringify(limitedHistory));
      } catch (error) {
        // معالجة خطأ امتلاء التخزين
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('⚠️ تم تجاوز حد التخزين المحلي. جاري مسح السجل القديم...');

          // حذف سجل الصور القديم
          localStorage.removeItem(STORAGE_IMAGE_HISTORY_KEY);

          // محاولة حفظ آخر صورة فقط
          try {
            const lastImage = imageHistory.slice(-1);
            localStorage.setItem(STORAGE_IMAGE_HISTORY_KEY, JSON.stringify(lastImage));
            console.log('✅ تم حفظ آخر صورة فقط بنجاح');
          } catch {
            // إذا فشل أيضاً، تنظيف كامل للتخزين المتعلق بالتصاميم
            console.warn('⚠️ جاري تنظيف التخزين المحلي بالكامل...');
            localStorage.removeItem(STORAGE_IMAGE_HISTORY_KEY);
            localStorage.removeItem(STORAGE_OWNFABRIC_PRIMARY_IMAGE_KEY);
            localStorage.removeItem(STORAGE_OWNFABRIC_SECONDARY_IMAGE_KEY);
            console.log('✅ تم تنظيف التخزين المحلي');
          }
        } else {
          console.error('❌ خطأ في حفظ سجل الصور:', error);
        }
      }
    }
  }, [imageHistory]);

  // Save ownFabric state to localStorage with quota protection
  useEffect(() => {
    if (designMode === 'ownFabric') {
      try {
        localStorage.setItem(STORAGE_OWNFABRIC_STEP_KEY, ownFabricStep);
        if (primaryFabricImage) {
          localStorage.setItem(STORAGE_OWNFABRIC_PRIMARY_IMAGE_KEY, primaryFabricImage);
        }
        if (secondaryFabricImage) {
          localStorage.setItem(STORAGE_OWNFABRIC_SECONDARY_IMAGE_KEY, secondaryFabricImage);
        }
        if (primaryFabricPlacement || secondaryFabricPlacement || secondaryFabricType) {
          localStorage.setItem(STORAGE_OWNFABRIC_PLACEMENTS_KEY, JSON.stringify({
            primary: primaryFabricPlacement,
            secondary: secondaryFabricPlacement,
            secondaryType: secondaryFabricType
          }));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('⚠️ تم تجاوز حد التخزين المحلي عند حفظ بيانات القماش');
          // مسح البيانات القديمة لإفساح المجال
          localStorage.removeItem(STORAGE_IMAGE_HISTORY_KEY);
          localStorage.removeItem(STORAGE_OWNFABRIC_PRIMARY_IMAGE_KEY);
          localStorage.removeItem(STORAGE_OWNFABRIC_SECONDARY_IMAGE_KEY);
        } else {
          console.error('❌ خطأ في حفظ بيانات القماش:', error);
        }
      }
    }
  }, [designMode, ownFabricStep, primaryFabricImage, secondaryFabricImage, primaryFabricPlacement, secondaryFabricPlacement, secondaryFabricType]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      // If user just logged in and there are saved answers AND OAuth redirect flag is set, restore them
      if (user) {
        const isOAuthRedirect = sessionStorage.getItem(OAUTH_REDIRECT_FLAG);
        if (isOAuthRedirect) {
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              const parsedAnswers = JSON.parse(saved);
              setPendingAnswers(parsedAnswers);
              console.log('Restored pending answers after OAuth login');
            }
          } catch (error) {
            console.error('Error restoring answers after login:', error);
          }
        }
      }
    };
    checkAuth();

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);

      // When user logs in via OAuth, restore saved answers if OAuth redirect flag is set
      if (event === 'SIGNED_IN' && session?.user) {
        const isOAuthRedirect = sessionStorage.getItem(OAUTH_REDIRECT_FLAG);
        if (isOAuthRedirect) {
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              const parsedAnswers = JSON.parse(saved);
              setPendingAnswers(parsedAnswers);
              console.log('Restored pending answers after OAuth redirect');
            }
          } catch (error) {
            console.error('Error restoring answers after OAuth:', error);
          }
        }
      }
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

  // Save answers to localStorage
  const saveAnswersToLocalStorage = (answers: QuestionnaireAnswers) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      console.log('💾 Auto-saved answers to localStorage');
    } catch (error) {
      console.error('Error saving answers to localStorage:', error);
    }
  };

  // Handle answers change - auto-save to localStorage
  const handleAnswersChange = (answers: QuestionnaireAnswers) => {
    saveAnswersToLocalStorage(answers);
    setSavedAnswers(answers); // Update state to reflect saved data
  };

  // Clear saved answers from localStorage
  const clearSavedAnswers = () => {
    console.log('clearSavedAnswers() called');
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_STEP_KEY); // Also clear saved step
      localStorage.removeItem('ai_dress_designer_simplified_current_step'); // Also clear simplified wizard step
      setSavedAnswers(null);
      console.log('✅ Cleared saved answers and step from localStorage and state');
    } catch (error) {
      console.error('❌ Error clearing saved answers:', error);
    }
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
    console.log('=== handleSubmit called ===');
    console.log('Is authenticated:', isAuthenticated);

    // Show review modal instead of processing immediately
    setPendingSubmitAnswers(questionnaireAnswers);
    setReviewModalOpen(true);
  };

  const handleReviewConfirm = async () => {
    console.log('=== Review confirmed ===');
    setReviewModalOpen(false);

    if (!pendingSubmitAnswers) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated - saving answers and showing auth modal');

      // Save answers to localStorage (for recovery after OAuth)
      saveAnswersToLocalStorage(pendingSubmitAnswers);
      console.log('Saved answers to localStorage');

      // Set OAuth redirect flag so we know to restore answers after login
      sessionStorage.setItem(OAUTH_REDIRECT_FLAG, 'true');
      console.log('Set OAuth redirect flag');

      // Save answers temporarily and show auth modal
      setPendingAnswers(pendingSubmitAnswers);
      setAuthModalOpen(true);
      return;
    }

    // User is authenticated - show model selection modal
    console.log('User authenticated - showing model selection modal');
    setPendingGenerationAnswers(pendingSubmitAnswers);
    setModelSelectionModalOpen(true);
    setPendingSubmitAnswers(null);
  };

  const handleReviewEdit = () => {
    console.log('=== Review edit requested ===');
    setReviewModalOpen(false);
    // User stays on questionnaire to edit answers
  };

  const handleModelSelection = async (model: GeminiImageModel) => {
    console.log('=== Model selected:', model, '===');
    setSelectedModel(model);
    setModelSelectionModalOpen(false);

    if (!pendingGenerationAnswers) return;

    // Proceed with design generation using selected model
    console.log('Proceeding with design generation using model:', model);
    await processDesign(pendingGenerationAnswers, model);
    setPendingGenerationAnswers(null);
  };

  const handleAuthSuccess = async () => {
    setAuthModalOpen(false);

    // If there are pending answers, process them
    if (pendingAnswers) {
      await processDesign(pendingAnswers);
      setPendingAnswers(null);
    }
  };

  const processDesign = async (questionnaireAnswers: QuestionnaireAnswers, model?: GeminiImageModel) => {
    setError('');
    setEnhancedPrompt('');
    setImageUrl('');
    setCurrentAnswers(questionnaireAnswers); // Store answers for later saving

    // Use provided model or default to simple model
    const selectedAIModel = model || 'google/gemini-2.5-flash-image';
    console.log('🎨 Processing design with model:', selectedAIModel);

    try {
      setLoading(true);
      setStep('enhancing');

      // Step 1: Send questionnaire answers to enhance-prompt API
      const enhancePayload: any = { questionnaireAnswers };

      // Add fabric workflow data if present
      if (primaryFabricImage) {
        enhancePayload.primaryFabricImage = primaryFabricImage;
        enhancePayload.primaryFabricPlacement = primaryFabricPlacement;

        if (secondaryFabricImage) {
          enhancePayload.secondaryFabricImage = secondaryFabricImage;
          enhancePayload.secondaryFabricPlacement = secondaryFabricPlacement;
        } else if (secondaryFabricType) {
          enhancePayload.secondaryFabricType = secondaryFabricType;
          enhancePayload.secondaryFabricPlacement = secondaryFabricPlacement;
        }
      }

      const enhanceResponse = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enhancePayload),
      });

      const enhanceData: EnhancePromptResponse = await enhanceResponse.json();

      if (!enhanceResponse.ok || enhanceData.error) {
        throw new Error(enhanceData.error || 'Failed to enhance prompt');
      }

      const finalPrompt = enhanceData.enhancedPrompt;
      setEnhancedPrompt(finalPrompt);
      setDescription(finalPrompt); // Store enhanced prompt as description

      // Print enhanced prompt to console for review
      console.log('\n🎨 البرومبت النهائي المُحسّن (Enhanced Prompt):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(finalPrompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Step 2: Generate image using enhanced prompt and selected model
      setStep('generating');

      // Include custom fabric images and model if provided
      const generatePayload: any = {
        prompt: finalPrompt,
        model: selectedAIModel
      };

      // Own Fabric Workflow
      if (primaryFabricImage) {
        generatePayload.primaryFabricImage = primaryFabricImage;
        generatePayload.questionnaireAnswers = questionnaireAnswers; // Include questionnaire answers for Design Specs
        if (secondaryFabricImage) {
          generatePayload.secondaryFabricImage = secondaryFabricImage;
        }
      }
      // Old Custom Fabric Workflow
      else if (questionnaireAnswers.customFabricImage) {
        generatePayload.fabricImage = questionnaireAnswers.customFabricImage;
      }

      const generateResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generatePayload),
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

      // Step 3: Auto-save design to database with model used
      await autoSaveDesign(questionnaireAnswers, finalPrompt, generatedImageUrl, selectedAIModel);

      // Clear saved answers from localStorage after successful generation
      clearSavedAnswers();

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

    // Clear image history when starting a new design
    setImageHistory([]);

    // Reset own fabric workflow if in that mode
    if (designMode === 'ownFabric') {
      setOwnFabricStep('upload');
      setPrimaryFabricImage(undefined);
      setSecondaryFabricImage(undefined);
      setSecondaryFabricType(undefined);
      setPrimaryFabricPlacement(undefined);
      setSecondaryFabricPlacement(undefined);
    }

    // Clear all saved state from localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_STEP_KEY);
    localStorage.removeItem('ai_dress_designer_simplified_current_step'); // Also clear simplified wizard step
    localStorage.removeItem(STORAGE_DESIGN_MODE_KEY);
    localStorage.removeItem(STORAGE_PAGE_STEP_KEY);
    localStorage.removeItem(STORAGE_IMAGE_URL_KEY);
    localStorage.removeItem(STORAGE_IMAGE_HISTORY_KEY);
    localStorage.removeItem(STORAGE_ENHANCED_PROMPT_KEY);
    // Clear ownFabric state
    localStorage.removeItem(STORAGE_OWNFABRIC_STEP_KEY);
    localStorage.removeItem(STORAGE_OWNFABRIC_PRIMARY_IMAGE_KEY);
    localStorage.removeItem(STORAGE_OWNFABRIC_SECONDARY_IMAGE_KEY);
    localStorage.removeItem(STORAGE_OWNFABRIC_PLACEMENTS_KEY);
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

  const handleEditDesign = async (editRequest: string, model: string) => {
    // Check authentication before proceeding
    if (!isAuthenticated) {
      setEditModalOpen(false);
      setAuthModalOpen(true);
      return;
    }

    // Close the edit modal immediately
    setEditModalOpen(false);

    // Use current/latest image (or from history if editing from history)
    const targetImageUrl = editingHistoryDesign?.image_url || imageUrl;

    if (!targetImageUrl) {
      showToast(direction === 'rtl' ? 'لا توجد صورة للتعديل' : 'No image to edit', 'error');
      return;
    }

    // Save current image to history before modification (only if not editing from history)
    if (!editingHistoryDesign && imageUrl) {
      // Create a copy of the current imageUrl string to avoid reference issues
      const currentImageUrlCopy = String(imageUrl);
      const historyItem: ImageHistoryItem = {
        id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageUrl: currentImageUrlCopy,
        prompt: enhancedPrompt || editRequest,
        timestamp: new Date(),
        isOriginal: imageHistory.length === 0, // First one is original
      };
      setImageHistory(prev => [historyItem, ...prev]);
    }

    console.log('Starting edit design process...', {
      editingFromHistory: !!editingHistoryDesign,
      imageUrlLength: targetImageUrl.length,
      editRequestLength: editRequest.length,
      imageUrlPrefix: targetImageUrl.substring(0, 100),
      isBase64DataUrl: targetImageUrl.startsWith('data:image/'),
      imageUrlType: typeof targetImageUrl,
      model,
    });

    try {
      setEditingDesign(true);
      // Always show full-screen loading for modifications
      setStep('generating');

      const response = await fetch('/api/edit-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalImageUrl: targetImageUrl,
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

        // Prepare the new image data URL
        const newImageData = data.imageData.startsWith('data:image/')
          ? data.imageData
          : `data:image/jpeg;base64,${data.imageData}`;

        // If editing from history, save the history image first, then show the new image
        if (editingHistoryDesign) {
          console.log('Editing from history, saving current main image and showing new image...');

          // Save the current main image to history before replacing it with the new one
          // This preserves the image that was in the main view
          if (imageUrl) {
            const currentImageUrlCopy = String(imageUrl);
            const historyItem: ImageHistoryItem = {
              id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              imageUrl: currentImageUrlCopy,
              prompt: enhancedPrompt || '',
              timestamp: new Date(),
              isOriginal: imageHistory.length === 0, // First one is original
            };
            setImageHistory(prev => [historyItem, ...prev]);
          }

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
              original_description: editingHistoryDesign.original_description || JSON.stringify(editingHistoryDesign.questionnaire_answers),
              image_url: newImageData,
              image_data: newImageData,
              enhanced_prompt: editingHistoryDesign.enhanced_prompt + `\n\nEdit: ${editRequest}`,
              questionnaire_answers: editingHistoryDesign.questionnaire_answers,
              embellishment_placement: editingHistoryDesign.questionnaire_answers?.embellishmentPlacement || null,
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

            console.log('Design saved successfully, refreshing history...');

            // Refresh history
            await fetchPreviousDesigns();

            console.log('History refreshed successfully');

          } catch (dbSaveError) {
            console.error('Error saving edited design to database:', dbSaveError);
            // Don't throw - still show the image even if DB save fails
            showToast(
              direction === 'rtl' ? 'تم التعديل لكن فشل الحفظ في قاعدة البيانات' : 'Edit successful but failed to save to database',
              'error'
            );
          }

          // Show the new edited image as the main result
          setImageUrl(newImageData);
          setEnhancedPrompt(editingHistoryDesign.enhanced_prompt + `\n\nEdit: ${editRequest}`);
          setEditingHistoryDesign(null);
          setEditingDesign(false);
          setStep('complete');
          showToast(
            direction === 'rtl' ? 'تم تعديل التصميم بنجاح!' : 'Design edited successfully!',
            'success'
          );
        } else {
          // Update current design (newImageData already prepared above)
          setImageUrl(newImageData);

          // Auto-save edited design if user is authenticated
          if (isAuthenticated && currentAnswers) {
            await autoSaveDesign(currentAnswers, enhancedPrompt, newImageData, model as GeminiImageModel);
          }

          // Hide loading and show result only after everything is ready
          setEditingDesign(false);
          setStep('complete');
          showToast(
            direction === 'rtl' ? 'تم تعديل التصميم بنجاح!' : 'Design edited successfully!',
            'success'
          );
        }

        setEditModalOpen(false);
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

      setError(errorMessage);
      showToast(errorMessage, 'error');

      // Hide loading on error
      setEditingDesign(false);

      if (!editingHistoryDesign) {
        setStep('complete');
      }
    }
  };

  // Handle edit request (edit on current version)
  const handleRequestIterativeEdit = () => {
    setEditingHistoryDesign(null);
    setEditModalOpen(true);
  };

  // Handle edit request from history
  const handleRequestEditFromHistory = (design: any) => {
    setEditingHistoryDesign(design);
    setEditModalOpen(true);
  };

  // Auto-save design after successful generation
  const autoSaveDesign = async (
    answers: QuestionnaireAnswers,
    prompt: string,
    imageUrl: string,
    modelUsed: GeminiImageModel = 'google/gemini-2.5-flash-image'
  ) => {
    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not authenticated, skipping auto-save');
        return;
      }

      console.log('Starting auto-save with storage upload...');

      // Generate a unique design ID
      const designId = crypto.randomUUID();

      // Process and upload image to storage (full + thumbnail)
      const { fullImageUrl, thumbnailUrl, fullImagePath, thumbnailPath } =
        await processAndUploadDesignImage(user.id, designId, imageUrl);

      console.log('Images uploaded to storage:', {
        fullImageUrl,
        thumbnailUrl,
      });

      // Save design to database with storage URLs
      // Build insert object conditionally to avoid errors if model_used column doesn't exist yet
      const insertData: any = {
        id: designId,
        user_id: user.id,
        original_description: JSON.stringify(answers),
        enhanced_prompt: prompt,
        image_url: fullImageUrl, // Public URL from storage
        storage_path: fullImagePath, // Storage path for full image
        thumbnail_url: thumbnailUrl, // Public URL for thumbnail
        thumbnail_storage_path: thumbnailPath, // Storage path for thumbnail
        questionnaire_answers: answers,
        embellishment_placement: answers?.embellishmentPlacement || null,
      };

      // Only add model_used if it's provided (will work after migration is applied)
      if (modelUsed) {
        insertData.model_used = modelUsed;
      }

      const { error } = await supabase.from('designs').insert(insertData);

      if (error) {
        console.error('Auto-save error:', error);
        // If error is about model_used column, log a helpful message
        if (error.message?.includes('model_used')) {
          console.warn('⚠️ Please apply the database migration: supabase/migrations/add_model_used_to_designs.sql');
        }
        return;
      }

      console.log('Design auto-saved successfully with storage URLs');
    } catch (error) {
      console.error('Error auto-saving design:', error);
      // Fallback: save with base64 if storage upload fails
      console.log('Falling back to base64 storage...');
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const fallbackData: any = {
          user_id: user.id,
          original_description: JSON.stringify(answers),
          enhanced_prompt: prompt,
          image_url: imageUrl,
          image_data: imageUrl, // Fallback to base64
          questionnaire_answers: answers,
          embellishment_placement: answers?.embellishmentPlacement || null,
        };

        // Only add model_used if it's provided (will work after migration is applied)
        if (modelUsed) {
          fallbackData.model_used = modelUsed;
        }

        await supabase.from('designs').insert(fallbackData);
        console.log('Fallback save successful');
      } catch (fallbackError) {
        console.error('Fallback save also failed:', fallbackError);
      }
    }
  };

  // Save externally edited design
  const saveExternalDesign = async (imageData: string, modificationHistory: any[]) => {
    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error(t('design.external.errors.notAuthenticated') || 'Please log in to save designs');
      }

      console.log('Saving external design...');

      // Generate a unique design ID
      const designId = crypto.randomUUID();

      // Process and upload image to storage (full + thumbnail)
      const { fullImageUrl, thumbnailUrl, fullImagePath, thumbnailPath } =
        await processAndUploadDesignImage(user.id, designId, imageData);

      console.log('External design images uploaded to storage:', {
        fullImageUrl,
        thumbnailUrl,
      });

      // Create description from modification history
      const description = modificationHistory.length > 0
        ? `External design with ${modificationHistory.length} modification(s): ${modificationHistory.map(m => m.description).join('; ')}`
        : 'External design upload';

      // Save design to database with storage URLs
      const { error } = await supabase.from('designs').insert({
        id: designId,
        user_id: user.id,
        original_description: description,
        enhanced_prompt: description,
        image_url: fullImageUrl, // Public URL from storage
        storage_path: fullImagePath, // Storage path for full image
        thumbnail_url: thumbnailUrl, // Public URL for thumbnail
        thumbnail_storage_path: thumbnailPath, // Storage path for thumbnail
        questionnaire_answers: null, // No questionnaire for external designs
        embellishment_placement: null,
      });

      if (error) {
        console.error('Save error:', error);
        throw new Error(error.message);
      }

      console.log('External design saved successfully');
      showToast(
        direction === 'rtl' ? 'تم حفظ التصميم بنجاح!' : 'Design saved successfully!',
        'success'
      );

      // Refresh history
      await fetchPreviousDesigns();
    } catch (error) {
      console.error('Error saving external design:', error);
      throw error;
    }
  };

  // Handle mode selection
  const handleModeSelect = (mode: 'scratch' | 'external' | 'ownFabric' | 'removeModel') => {
    setDesignMode(mode);
    if (mode === 'ownFabric') {
      setOwnFabricStep('upload');
    }
  };

  // Handle back to mode selection
  const handleBackToModeSelection = () => {
    setDesignMode('selection');
    // Reset own fabric workflow state
    setOwnFabricStep('upload');
    setPrimaryFabricImage(undefined);
    setSecondaryFabricImage(undefined);
    setSecondaryFabricType(undefined);
    setPrimaryFabricPlacement(undefined);
    setSecondaryFabricPlacement(undefined);

    // Clear saved page state when going back to selection
    localStorage.removeItem(STORAGE_DESIGN_MODE_KEY);
    localStorage.removeItem(STORAGE_PAGE_STEP_KEY);
    localStorage.removeItem(STORAGE_IMAGE_URL_KEY);
    localStorage.removeItem(STORAGE_IMAGE_HISTORY_KEY);
    localStorage.removeItem(STORAGE_ENHANCED_PROMPT_KEY);
    // Clear ownFabric state
    localStorage.removeItem(STORAGE_OWNFABRIC_STEP_KEY);
    localStorage.removeItem(STORAGE_OWNFABRIC_PRIMARY_IMAGE_KEY);
    localStorage.removeItem(STORAGE_OWNFABRIC_SECONDARY_IMAGE_KEY);
    localStorage.removeItem(STORAGE_OWNFABRIC_PLACEMENTS_KEY);
  };

  // Handle own fabric upload completion
  const handleOwnFabricUploadComplete = (data: {
    primaryFabricImage: string;
    secondaryFabricImage?: string;
    secondaryFabricType?: string;
  }) => {
    setPrimaryFabricImage(data.primaryFabricImage);
    setSecondaryFabricImage(data.secondaryFabricImage);
    setSecondaryFabricType(data.secondaryFabricType);

    // إذا كان هناك قماش ثانوي، اذهب للاختيار ثم placement
    // وإلا اذهب مباشرة لخطوة الاختيار
    if (data.secondaryFabricImage || data.secondaryFabricType) {
      // حالة القماش المزدوج - نحتاج للـ placement أولاً
      setOwnFabricStep('placement');
    } else {
      // قماش واحد فقط - اذهب لخطوة الاختيار بين 5 تصاميم أو الاستبيان
      setOwnFabricStep('choice');
    }
  };

  // Handle multi-design choice - user wants 5 designs
  const handleChooseMultipleDesigns = () => {
    // Update URL with fabricMode parameter
    router.push('/design?mode=ownFabric&fabricMode=multi');
    // انتقل إلى استبيان الـ 5 تصاميم أولاً
    setOwnFabricStep('batchQuestionnaire');
  };

  // Handle batch questionnaire completion
  const handleBatchQuestionnaireComplete = (answers: BatchDesignQuestionnaireAnswers) => {
    setBatchQuestionnaireAnswers(answers);
    // بعد الانتهاء من الاستبيان، افتح modal اختيار الموديل
    setMultiDesignModelModalOpen(true);
  };

  // Handle traditional questionnaire choice
  const handleChooseTraditional = () => {
    // Update URL with fabricMode parameter
    router.push('/design?mode=ownFabric&fabricMode=single');
    setOwnFabricStep('questionnaire');
  };

  // Process multiple designs (5 at once)
  const processMultipleDesigns = async (selectedModel: GeminiImageModel) => {
    setMultiDesignModelModalOpen(false);
    setOwnFabricStep('multiDesign');
    setMultiDesignLoading(true);
    setMultiDesigns([]);

    try {
      // Step 1: Generate 5 prompts from fabric analysis + questionnaire answers
      console.log('🎨 جاري توليد 5 برومبتات...');
      if (batchQuestionnaireAnswers) {
        console.log('📋 مع إجابات الاستبيان:', batchQuestionnaireAnswers);
      }
      const promptsResponse = await fetch('/api/generate-multiple-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryFabricImage,
          secondaryFabricImage,
          primaryFabricPlacement,
          secondaryFabricPlacement,
          batchQuestionnaireAnswers,
        }),
      });

      const promptsData: GenerateMultiplePromptsResponse = await promptsResponse.json();

      if (!promptsResponse.ok || promptsData.error || !promptsData.prompts) {
        throw new Error(promptsData.error || 'فشل في توليد البرومبتات');
      }

      console.log(`✅ تم توليد ${promptsData.prompts.length} برومبتات`);

      // Initialize designs with generating status (all at once)
      const initialDesigns: MultiDesignResult[] = promptsData.prompts.map((prompt, index) => ({
        id: `design-${index + 1}-${Date.now()}`,
        prompt,
        status: 'generating' as const,
      }));
      setMultiDesigns(initialDesigns);

      // Step 2: Generate all images using the dedicated multi-image API
      console.log('🖼️ جاري توليد 5 صور مع عرض الأمام والخلف...');

      const imagesResponse = await fetch('/api/generate-multiple-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: promptsData.prompts,
          primaryFabricImage,
          secondaryFabricImage,
          model: selectedModel,
        }),
      });

      const imagesData = await imagesResponse.json();

      if (!imagesResponse.ok || imagesData.error) {
        throw new Error(imagesData.error || 'فشل في توليد الصور');
      }

      // Update designs with results
      if (imagesData.results && Array.isArray(imagesData.results)) {
        const updatedDesigns: MultiDesignResult[] = initialDesigns.map((design, index) => {
          const result = imagesData.results.find((r: { index: number }) => r.index === index);
          if (result && result.success) {
            return {
              ...design,
              status: 'complete' as const,
              imageUrl: result.imageData || result.imageUrl,
            };
          } else if (result) {
            return {
              ...design,
              status: 'error' as const,
              error: result.error || 'فشل في توليد الصورة',
            };
          }
          return { ...design, status: 'error' as const, error: 'لم يتم استلام نتيجة' };
        });

        setMultiDesigns(updatedDesigns);

        // الحفظ التلقائي للتصاميم الناجحة
        if (isAuthenticated) {
          const multiDesignAnswers: QuestionnaireAnswers = {
            dressType: 'فستان',
            dressLength: 'طويل',
            skirtShape: 'مستقيم',
            necklineType: 'دائري',
            sleeveType: 'بدون أكمام',
            fabricType: 'custom',
            embellishments: [],
            designStyle: 'عصري',
          };

          for (const design of updatedDesigns) {
            if (design.status === 'complete' && design.imageUrl) {
              try {
                await autoSaveDesign(
                  currentAnswers || multiDesignAnswers,
                  design.prompt,
                  design.imageUrl,
                  selectedModel
                );
                console.log(`✅ تم حفظ التصميم ${design.id} تلقائياً`);
              } catch (saveError) {
                console.error(`⚠️ فشل حفظ التصميم ${design.id}:`, saveError);
              }
            }
          }
        }
      }

      console.log(`✅ تم الانتهاء من توليد ${imagesData.successCount || 0} صور بنجاح`);

    } catch (error) {
      console.error('❌ خطأ في توليد التصاميم المتعددة:', error);
      showToast(
        error instanceof Error ? error.message : 'حدث خطأ أثناء توليد التصاميم',
        'error'
      );
    } finally {
      setMultiDesignLoading(false);
    }
  };

  // Retry a single design (uses generate-multiple-images with single prompt)
  const handleRetryDesign = async (designId: string) => {
    const design = multiDesigns.find(d => d.id === designId);
    if (!design) return;

    const designIndex = multiDesigns.findIndex(d => d.id === designId);

    // Update to generating
    setMultiDesigns(prev => prev.map(d =>
      d.id === designId ? { ...d, status: 'generating' as const, error: undefined } : d
    ));

    try {
      // استخدام نفس API المخصص لتوليد صورة واحدة مع dual-view
      const response = await fetch('/api/generate-multiple-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: [design.prompt], // برومبت واحد فقط
          primaryFabricImage,
          secondaryFabricImage,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'فشل في توليد الصورة');
      }

      // استخراج النتيجة
      const result = data.results?.[0];
      if (!result || !result.success) {
        throw new Error(result?.error || 'فشل في توليد الصورة');
      }

      const imageUrl = result.imageData || result.imageUrl;

      setMultiDesigns(prev => prev.map(d =>
        d.id === designId ? { ...d, status: 'complete' as const, imageUrl } : d
      ));

      // الحفظ التلقائي للتصميم بعد إعادة المحاولة الناجحة
      if (imageUrl && isAuthenticated) {
        const multiDesignAnswers: QuestionnaireAnswers = {
          dressType: 'فستان',
          dressLength: 'طويل',
          skirtShape: 'مستقيم',
          necklineType: 'دائري',
          sleeveType: 'بدون أكمام',
          fabricType: 'custom',
          embellishments: [],
          designStyle: 'عصري',
        };

        try {
          await autoSaveDesign(
            currentAnswers || multiDesignAnswers,
            design.prompt,
            imageUrl,
            selectedModel
          );
          console.log(`✅ تم حفظ التصميم ${designIndex + 1} تلقائياً بعد إعادة المحاولة`);
        } catch (saveError) {
          console.error(`⚠️ فشل حفظ التصميم ${designIndex + 1}:`, saveError);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
      setMultiDesigns(prev => prev.map(d =>
        d.id === designId ? { ...d, status: 'error' as const, error: errorMsg } : d
      ));
    }
  };

  // Handle new design from multi-design results
  const handleNewMultiDesign = () => {
    setMultiDesigns([]);
    setOwnFabricStep('upload');
  };

  // Handle edit request for multi-design
  const handleMultiDesignEdit = (designId: string, imageUrl: string, prompt: string) => {
    // حفظ معرف التصميم للتعديل
    setEditingMultiDesignId(designId);
    // فتح نافذة التعديل
    setEditingMultiDesignModal(true);
    // حفظ معلومات التصميم للتعديل (نستخدم editingHistoryDesign للتوافق مع handleEditDesign)
    setEditingHistoryDesign({
      id: designId,
      image_url: imageUrl,
      enhanced_prompt: prompt,
      questionnaire_answers: currentAnswers
    });
  };

  // Handle multi-design edit submission
  const handleMultiDesignEditSubmit = async (editRequest: string, model: string) => {
    if (!editingMultiDesignId) return;

    // حفظ المعرف في متغير محلي قبل المسح لتجنب مشاكل closure
    const targetDesignId = editingMultiDesignId;

    // إغلاق نافذة التعديل ومسح المعرف مباشرة
    setEditingMultiDesignModal(false);
    setEditingMultiDesignId(null);
    setEditingHistoryDesign(null);

    const design = multiDesigns.find(d => d.id === targetDesignId);
    if (!design || !design.imageUrl) {
      showToast(direction === 'rtl' ? 'لم يتم العثور على التصميم' : 'Design not found', 'error');
      return;
    }

    console.log('🔧 بدء تعديل التصميم:', { targetDesignId, originalImageUrl: design.imageUrl?.substring(0, 50) });

    // تحديث حالة التصميم إلى "editing"
    setMultiDesigns(prev => prev.map(d =>
      d.id === targetDesignId ? { ...d, status: 'editing' as const } : d
    ));

    try {
      // استخدام نفس منطق handleEditDesign
      const response = await fetch('/api/edit-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalImageUrl: design.imageUrl,
          editRequest: editRequest,
          model: model as 'google/gemini-2.5-flash-image' | 'google/gemini-3-pro-image-preview',
        } as EditDesignRequest),
      });

      const data: EditDesignResponse = await response.json();

      console.log('📥 استجابة API التعديل:', {
        ok: response.ok,
        hasImageData: !!data.imageData,
        imageDataLength: data.imageData?.length,
        error: data.error
      });

      if (!response.ok || data.error) {
        throw new Error(data.error || 'فشل في تعديل التصميم');
      }

      if (!data.imageData) {
        throw new Error(direction === 'rtl' ? 'لم يتم إرجاع صورة معدلة' : 'No edited image returned');
      }

      // تحديث التصميم بالصورة الجديدة
      console.log('✅ تحديث التصميم بالصورة الجديدة:', targetDesignId);
      setMultiDesigns(prev => {
        const updated = prev.map(d =>
          d.id === targetDesignId ? {
            ...d,
            status: 'complete' as const,
            imageUrl: data.imageData,
            prompt: `${d.prompt}\n\n[تعديل]: ${editRequest}`
          } : d
        );
        console.log('📊 حالة التصاميم بعد التحديث:', updated.map(d => ({ id: d.id, status: d.status, hasImage: !!d.imageUrl })));
        return updated;
      });

      // حفظ التصميم المعدل تلقائياً
      if (isAuthenticated && currentAnswers) {
        await autoSaveDesign(
          currentAnswers,
          `${design.prompt}\n\n[تعديل]: ${editRequest}`,
          data.imageData,
          model as GeminiImageModel
        );
      }

      showToast(
        direction === 'rtl' ? 'تم تعديل التصميم بنجاح!' : 'Design edited successfully!',
        'success'
      );

    } catch (error) {
      console.error('❌ Error editing multi-design:', error);

      // إعادة الحالة إلى complete مع الصورة الأصلية
      setMultiDesigns(prev => prev.map(d =>
        d.id === targetDesignId ? { ...d, status: 'complete' as const } : d
      ));

      showToast(
        error instanceof Error ? error.message : (direction === 'rtl' ? 'فشل في تعديل التصميم' : 'Failed to edit design'),
        'error'
      );
    }
  };

  // Handle fabric placement completion
  const handleFabricPlacementComplete = (data: {
    primaryFabricPlacement: string;
    secondaryFabricPlacement?: string;
  }) => {
    setPrimaryFabricPlacement(data.primaryFabricPlacement);
    setSecondaryFabricPlacement(data.secondaryFabricPlacement);
    // بعد الـ placement اذهب لخطوة الاختيار
    setOwnFabricStep('choice');
  };

  // Handle back from fabric placement
  const handleBackFromFabricPlacement = () => {
    setOwnFabricStep('upload');
  };

  return (
    <div className="min-h-screen bg-muted-beige flex flex-col">
      <Header />

      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <main className="flex-1 pt-24 md:pt-32 pb-16 md:pb-24 px-4">
        <div className="container mx-auto">
          {/* Back to Mode Selection Button - Only show when not on selection screen */}
          {designMode !== 'selection' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex justify-center"
            >
              <motion.button
                onClick={handleBackToModeSelection}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'group relative overflow-hidden',
                  'inline-flex items-center gap-2.5 md:gap-3',
                  'px-5 py-2.5 md:px-6 md:py-3',
                  'bg-gradient-to-r from-white via-white to-amber-50/30',
                  'border-2 border-amber-100/50',
                  'rounded-2xl',
                  'shadow-lg shadow-amber-900/5',
                  'hover:shadow-xl hover:shadow-accent-gold/20',
                  'hover:border-accent-gold/40',
                  'transition-all duration-300',
                  'text-primary'
                )}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-gold/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </div>

                {/* Icon with Glow */}
                <div className="relative">
                  <div className="absolute inset-0 bg-accent-gold/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Home className="relative w-5 h-5 md:w-6 md:h-6 text-accent-gold group-hover:text-amber-500 transition-colors duration-300" />
                </div>

                {/* Text */}
                <span className="relative text-sm md:text-base font-semibold tracking-wide group-hover:text-accent-gold transition-colors duration-300">
                  {direction === 'rtl' ? 'العودة إلى القائمة الرئيسية' : 'Back to Main Menu'}
                </span>

                {/* Bottom Gradient Line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-gold to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </motion.div>
          )}



          {/* Mode Selection Screen */}
          {designMode === 'selection' && (
            <DesignModeSelection onSelectMode={handleModeSelect} />
          )}

          {/* External Edit Workflow */}
          {designMode === 'external' && (
            <ExternalEditWorkflow
              onBack={handleBackToModeSelection}
              onSaveDesign={saveExternalDesign}
              isAuthenticated={isAuthenticated}
              onAuthRequired={() => setAuthModalOpen(true)}
            />
          )}

          {/* Remove Model Workflow */}
          {designMode === 'removeModel' && (
            <RemoveModelWorkflow
              onBack={handleBackToModeSelection}
              isAuthenticated={isAuthenticated}
              onAuthRequired={() => setAuthModalOpen(true)}
            />
          )}

          {/* Own Fabric Workflow */}
          {designMode === 'ownFabric' && (
            <>
              {ownFabricStep === 'upload' && (
                <OwnFabricUpload
                  onComplete={handleOwnFabricUploadComplete}
                  onBack={handleBackToModeSelection}
                />
              )}

              {/* خطوة الاختيار بين 5 تصاميم أو الاستبيان التقليدي */}
              {ownFabricStep === 'choice' && (
                <MultiDesignChoice
                  fabricPreview={primaryFabricImage}
                  onChooseMultiple={handleChooseMultipleDesigns}
                  onChooseTraditional={handleChooseTraditional}
                  onBack={() => setOwnFabricStep('upload')}
                />
              )}

              {/* استبيان 5 تصاميم دفعة واحدة */}
              {ownFabricStep === 'batchQuestionnaire' && (
                <BatchDesignQuestionnaire
                  onSubmit={handleBatchQuestionnaireComplete}
                  onBack={() => setOwnFabricStep('choice')}
                />
              )}

              {ownFabricStep === 'placement' && (
                <FabricPlacementStep
                  hasSecondaryFabric={!!(secondaryFabricImage || secondaryFabricType)}
                  initialPrimaryPlacement={primaryFabricPlacement}
                  initialSecondaryPlacement={secondaryFabricPlacement}
                  onComplete={handleFabricPlacementComplete}
                  onBack={handleBackFromFabricPlacement}
                />
              )}

              {/* عرض نتائج 5 تصاميم */}
              {ownFabricStep === 'multiDesign' && (
                <MultiDesignResults
                  designs={multiDesigns}
                  loading={multiDesignLoading}
                  onRetry={handleRetryDesign}
                  onNewDesign={handleNewMultiDesign}
                  onEdit={handleMultiDesignEdit}
                  editingDesignId={editingMultiDesignId}
                />
              )}

              {ownFabricStep === 'questionnaire' && (
                <>
                  {step === 'input' && !reviewModalOpen && (
                    <SimplifiedQuestionnaireWizard
                      onSubmit={(answers) => {
                        setCurrentAnswers(answers);
                        setPendingSubmitAnswers(answers);
                        setReviewModalOpen(true);
                      }}
                      loading={loading}
                      initialAnswers={savedAnswers || undefined}
                      onAnswersChange={(answers) => {
                        // Save to localStorage
                        try {
                          localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
                        } catch (error) {
                          console.error('Error saving answers to localStorage:', error);
                        }
                      }}
                    />
                  )}

                  {/* Show loading state during generation */}
                  {(step === 'enhancing' || step === 'generating') && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-gold"></div>
                      <p className="text-lg text-gray-600">
                        {step === 'enhancing'
                          ? (direction === 'rtl' ? 'جاري تحسين الوصف...' : 'Enhancing description...')
                          : (direction === 'rtl' ? 'جاري توليد التصميم...' : 'Generating design...')
                        }
                      </p>
                    </div>
                  )}

                  {/* Show generated design */}
                  {step === 'complete' && imageUrl && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <ImageCard
                          src={imageUrl}
                          alt={t('design.results.generatedDesign')}
                          onView={() => setLightboxOpen(true)}
                        />
                      </div>

                      {/* Action Buttons - Luxurious compact design */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 md:gap-3">
                          {/* Button 1: New Design */}
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleReset}
                            className="group relative px-3 py-2.5 md:px-4 md:py-3 rounded-xl bg-white border border-gray-200 hover:border-accent-gold/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
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
                            onClick={handleRequestIterativeEdit}
                            disabled={editingDesign}
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
                            onClick={handleDownload}
                            className="group relative px-3 py-2.5 md:px-4 md:py-3 rounded-xl bg-gradient-to-r from-accent-gold to-amber-500 border border-accent-gold shadow-sm hover:shadow-lg hover:shadow-accent-gold/30 transition-all duration-300 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-accent-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="relative text-xs md:text-sm font-medium text-white">
                              {direction === 'rtl' ? 'حفظ' : 'Save'}
                            </span>
                          </motion.button>
                        </div>
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
                                      <span className={cn(
                                        "text-xs px-2 py-1 rounded-full",
                                        item.isOriginal ? "bg-accent-gold/20 text-accent-gold" : "bg-gray-200 text-gray-600"
                                      )}>
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
                                          setEditingHistoryDesign({
                                            image_url: item.imageUrl,
                                            enhanced_prompt: item.prompt,
                                            questionnaire_answers: currentAnswers
                                          });
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
                                          showToast(t('design.toast.downloaded'), 'success');
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
                </>
              )}

              {/* Questionnaire Review Modal for Own Fabric */}
              {pendingSubmitAnswers && (
                <QuestionnaireReviewModal
                  isOpen={reviewModalOpen}
                  answers={pendingSubmitAnswers}
                  onConfirm={handleReviewConfirm}
                  onEdit={handleReviewEdit}
                  onClose={() => setReviewModalOpen(false)}
                />
              )}
            </>
          )}

          {/* Scratch Mode (Original Questionnaire Workflow) */}
          {designMode === 'scratch' && (
            <>
            <div className={cn(
              "grid gap-6 md:gap-8",
              step === 'input' ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-5"
            )}>
              {/* Left Column - Questionnaire (40%) - Full width on mobile */}
              {/* Show questionnaire only during input step */}
              {step === 'input' && (
            <div className={cn(step === 'input' ? "" : "lg:col-span-2", "space-y-4 md:space-y-6")}>
              <QuestionnaireWizard
                onSubmit={handleSubmit}
                loading={loading}
                initialAnswers={savedAnswers || undefined}
                onAnswersChange={handleAnswersChange}
              />
            </div>
          )}

          {/* Right Column - Results Preview (60%) - Full width on mobile */}
          {/* Show results only after questionnaire submission */}
          {step !== 'input' && (
            <div className="lg:col-span-5">
            <div className="luxury-card p-4 md:p-6">
              {/* Results Section - No tabs anymore */}
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

                  {(loading || editingDesign) && (
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
                              ? editingDesign
                                ? 'جارٍ تعديل التصميم... ✨'
                                : 'جارٍ تصميم فستانك... ✨'
                              : editingDesign
                                ? 'Modifying design... ✨'
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

                  {imageUrl && !editingDesign && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4 md:space-y-6"
                    >
                      <div className="relative">
                        <ImageCard
                          src={imageUrl}
                          alt={t('design.results.generatedDesign')}
                          onView={() => setLightboxOpen(true)}
                          onDownload={handleDownload}
                        />
                      </div>

                      <div className="space-y-3">
                        {/* Action Buttons - Only 2 buttons now */}
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                          {/* Button 1: New Design */}
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleReset}
                            className="group relative px-3 py-2.5 md:px-4 md:py-3 rounded-xl bg-white border border-gray-200 hover:border-accent-gold/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
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
                            onClick={handleRequestIterativeEdit}
                            disabled={editingDesign}
                            className="group relative px-3 py-2.5 md:px-4 md:py-3 rounded-xl bg-gradient-to-r from-accent-gold/10 to-accent-gold/5 border border-accent-gold/30 hover:border-accent-gold shadow-sm hover:shadow-md hover:shadow-accent-gold/20 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/20 to-accent-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="relative text-xs md:text-sm font-medium text-accent-gold group-hover:text-accent-gold transition-colors">
                              {direction === 'rtl' ? 'طلب تعديل' : 'Modify'}
                            </span>
                          </motion.button>
                        </div>
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
                                  {/* Square Image with Save Icon */}
                                  <div className="w-full md:w-40 flex-shrink-0 relative group">
                                    <div className="aspect-square w-full">
                                      <img
                                        src={item.imageUrl}
                                        alt={`${direction === 'rtl' ? 'الإصدار' : 'Version'} ${imageHistory.length - index}`}
                                        className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setHistoryLightboxImage(item.imageUrl)}
                                      />
                                    </div>
                                    {/* Small Save Icon - Bottom Right Corner */}
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const link = document.createElement('a');
                                        link.href = item.imageUrl;
                                        link.download = `dress-design-v${imageHistory.length - index}-${Date.now()}.png`;
                                        link.click();
                                        showToast(t('design.toast.downloaded'), 'success');
                                      }}
                                      className={cn(
                                        "absolute bottom-2 z-10 p-2 rounded-full bg-accent-gold/90 hover:bg-accent-gold shadow-lg hover:shadow-xl transition-all duration-300",
                                        direction === 'rtl' ? 'left-2' : 'right-2'
                                      )}
                                      title={direction === 'rtl' ? 'حفظ' : 'Save'}
                                    >
                                      <Download className="w-3.5 h-3.5 text-white" />
                                    </motion.button>
                                  </div>

                                  {/* Info & Button */}
                                  <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                      <span className={cn(
                                        "text-xs px-2 py-1 rounded-full",
                                        item.isOriginal
                                          ? "bg-accent-gold/20 text-accent-gold"
                                          : "bg-gray-200 text-gray-600"
                                      )}>
                                        {item.isOriginal
                                          ? (direction === 'rtl' ? 'التصميم الأصلي' : 'Original Design')
                                          : (direction === 'rtl' ? `الإصدار ${imageHistory.length - index}` : `Version ${imageHistory.length - index}`)}
                                      </span>
                                    </div>

                                    {/* Action Button - Only Request Edit */}
                                    <div className="mt-3">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          // Set this image as the one to edit
                                          setEditingHistoryDesign({
                                            image_url: item.imageUrl,
                                            enhanced_prompt: item.prompt,
                                            questionnaire_answers: currentAnswers
                                          });
                                          setEditModalOpen(true);
                                        }}
                                        className="w-full text-xs border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-white"
                                      >
                                        {direction === 'rtl' ? 'طلب تعديل على هذا التصميم' : 'Request Edit on This Design'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View Previous Designs Button */}
                      {isAuthenticated && (
                        <div className="mt-6 md:mt-8">
                          <Link href="/profile?tab=designs">
                            <motion.button
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full group relative px-4 py-3 rounded-xl bg-white border border-gray-200 hover:border-accent-gold/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <span className="relative text-sm md:text-base font-medium text-gray-700 group-hover:text-primary transition-colors">
                                {direction === 'rtl' ? 'عرض التصاميم السابقة' : 'View Previous Designs'}
                              </span>
                            </motion.button>
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

            </div>
          </div>
          )}
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

        {/* History Lightbox - for viewing previous versions */}
        <Lightbox
          isOpen={!!historyLightboxImage}
          onClose={() => setHistoryLightboxImage(null)}
          imageSrc={historyLightboxImage || ''}
          imageAlt={direction === 'rtl' ? 'إصدار سابق' : 'Previous Version'}
        />

        {/* Questionnaire Review Modal (for scratch mode) */}
        {designMode === 'scratch' && pendingSubmitAnswers && (
          <QuestionnaireReviewModal
            isOpen={reviewModalOpen}
            answers={pendingSubmitAnswers}
            onConfirm={handleReviewConfirm}
            onEdit={handleReviewEdit}
            onClose={() => setReviewModalOpen(false)}
          />
        )}

        {/* Design Details Modal for History */}
        <DesignDetailsModal
          design={selectedHistoryDesign}
          onClose={() => setSelectedHistoryDesign(null)}
          onDelete={async (id: string) => {
            try {
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

              // Refresh history
              await fetchPreviousDesigns();
              setSelectedHistoryDesign(null);
              showToast(
                direction === 'rtl' ? 'تم حذف التصميم بنجاح' : 'Design deleted successfully',
                'success'
              );
            } catch (error) {
              console.error('❌ Error deleting design:', error);
              console.error('Error type:', typeof error);
              console.error('Error details:', JSON.stringify(error, null, 2));

              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              showToast(
                direction === 'rtl'
                  ? `فشل حذف التصميم: ${errorMessage}`
                  : `Failed to delete design: ${errorMessage}`,
                'error'
              );
            }
          }}
          onRequestEdit={handleRequestEditFromHistory}
        />


            </>
          )}
          {/* End of Scratch Mode */}

        {/* Edit Design Modal - Outside mode-specific sections so it works for all modes */}
        <EditDesignModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleEditDesign}
          loading={editingDesign}
        />

        {/* Edit Design Modal for Multi-Design mode */}
        <EditDesignModal
          isOpen={editingMultiDesignModal}
          onClose={() => {
            setEditingMultiDesignModal(false);
            setEditingMultiDesignId(null);
            setEditingHistoryDesign(null);
          }}
          onSubmit={handleMultiDesignEditSubmit}
          loading={editingMultiDesignId !== null && multiDesigns.some(d => d.id === editingMultiDesignId && d.status === 'editing')}
        />

        {/* Auth Modal - Outside scratch mode so it works for both modes */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />

        {/* Model Selection Modal - For new design generation */}
        <ModelSelectionModal
          isOpen={modelSelectionModalOpen}
          onClose={() => {
            setModelSelectionModalOpen(false);
            setPendingGenerationAnswers(null);
          }}
          onSelectModel={handleModelSelection}
          loading={loading}
          title={direction === 'rtl' ? 'اختيار نموذج الذكاء الاصطناعي' : 'Select AI Model'}
          subtitle={direction === 'rtl'
            ? 'اختاري نموذج الذكاء الاصطناعي المناسب لتوليد تصميمك'
            : 'Choose the AI model to generate your design'
          }
        />

        {/* Model Selection Modal - For multi-design generation (5 designs) */}
        <ModelSelectionModal
          isOpen={multiDesignModelModalOpen}
          onClose={() => {
            setMultiDesignModelModalOpen(false);
          }}
          onSelectModel={(model) => {
            setSelectedModel(model);
            processMultipleDesigns(model);
          }}
          loading={multiDesignLoading}
          title={direction === 'rtl' ? 'اختيار نموذج الذكاء الاصطناعي' : 'Select AI Model'}
          subtitle={direction === 'rtl'
            ? 'سيتم استخدام هذا النموذج لتوليد 5 تصاميم مختلفة'
            : 'This model will be used to generate 5 different designs'
          }
        />

        </div>
      </main>
    </div>
  );
}

