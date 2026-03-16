'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Check, Upload, X, ImageIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { QuestionnaireAnswers, ReferenceImageEntry } from '@/types';
import Button from './Button';
import ProgressBar from './ProgressBar';
import QuestionStep from './QuestionStep';
import SkirtPreviewModal from './SkirtPreviewModal';
import MultiEmbellishmentPlacementModal from './MultiEmbellishmentPlacementModal';
import TransparentPartsPlacementModal from './TransparentPartsPlacementModal';
import ImageCropper from './ImageCropper';

interface SimplifiedQuestionnaireWizardProps {
  onSubmit: (answers: QuestionnaireAnswers) => void;
  loading?: boolean;
  initialAnswers?: QuestionnaireAnswers;
  onAnswersChange?: (answers: QuestionnaireAnswers) => void;
}

const STORAGE_STEP_KEY = 'ai_dress_designer_simplified_current_step';

export default function SimplifiedQuestionnaireWizard({
  onSubmit,
  loading = false,
  initialAnswers,
  onAnswersChange
}: SimplifiedQuestionnaireWizardProps) {
  const { t, direction } = useLanguage();
  // تم تحديث عدد الأسئلة إلى 10 بعد حذف سؤال مقاس الجسم
  const totalSteps = 11; // 11 سؤال لقسم تصميم باستخدام قماشك الخاص (يشمل سؤال الصورة المرجعية)
  const containerRef = useRef<HTMLDivElement>(null);
  const referenceImageInputRef = useRef<HTMLInputElement>(null);
  const [refImageCropper, setRefImageCropper] = useState<{ imageSrc: string; index: number } | null>(null);

  // تهيئة الخطوة الحالية بقيمة افتراضية لتجنب مشاكل الـ hydration
  const [currentStep, setCurrentStep] = useState(1);

  // متابعة ما إذا تم تحميل الخطوة المحفوظة لمنع التحديثات غير الضرورية
  const [hasLoadedSavedStep, setHasLoadedSavedStep] = useState(false);

  // حالة نافذة معاينة شكل التنورة
  const [skirtPreviewModalOpen, setSkirtPreviewModalOpen] = useState(false);
  const [selectedSkirtForPreview, setSelectedSkirtForPreview] = useState<string>('');

  // حالة نافذة تحديد أماكن الزينة المتعددة
  const [multiEmbellishmentModalOpen, setMultiEmbellishmentModalOpen] = useState(false);

  // حالة نافذة تحديد أماكن الأجزاء الشفافة
  const [transparentPartsModalOpen, setTransparentPartsModalOpen] = useState(false);

  // Load saved step from localStorage after component mounts (client-side only)
  useEffect(() => {
    if (hasLoadedSavedStep) return;

    try {
      const saved = localStorage.getItem(STORAGE_STEP_KEY);
      if (saved) {
        const step = parseInt(saved, 10);
        if (step >= 1 && step <= totalSteps) {
          setCurrentStep(step);
          console.log('✅ Restored saved simplified step:', step);
        }
      }
      setHasLoadedSavedStep(true);
    } catch (error) {
      console.error('Error loading saved simplified step:', error);
      setHasLoadedSavedStep(true);
    }
  }, [hasLoadedSavedStep, totalSteps]);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    if (!hasLoadedSavedStep) return;

    try {
      localStorage.setItem(STORAGE_STEP_KEY, currentStep.toString());
      console.log('💾 Saved simplified current step:', currentStep);
    } catch (error) {
      console.error('Error saving simplified current step:', error);
    }
  }, [currentStep, hasLoadedSavedStep]);

  const [answers, setAnswers] = useState<QuestionnaireAnswers>(
    initialAnswers || {
      dressType: '',
      dressLength: '',
      skirtShape: '',
      necklineType: '',
      backStyle: '', // Back design style
      sleeveType: '',
      fabricType: 'custom', // Required field - set to 'custom' for own fabric workflow
      hasTransparentParts: 'no',
      embellishments: [],
      primaryColor: '',
      hasAdditionalColors: 'no',
    }
  );

  // Notify parent of answer changes
  useEffect(() => {
    if (onAnswersChange) {
      onAnswersChange(answers);
    }
  }, [answers, onAnswersChange]);

  const updateAnswer = (key: keyof QuestionnaireAnswers, value: string | string[], customValue?: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [key]: value };
      if (customValue !== undefined) {
        const customKey = `${key}Custom` as keyof QuestionnaireAnswers;
        updated[customKey] = customValue as any;
      }
      return updated;
    });
  };

  // Scroll to top when step changes
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // دالة فتح نافذة معاينة شكل التنورة
  const handleSkirtPreview = (skirtType: string) => {
    setSelectedSkirtForPreview(skirtType);
    setSkirtPreviewModalOpen(true);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      // التحقق من الأجزاء الشفافة في السؤال 7 (بعد إضافة سؤال الظهر)
      if (currentStep === 9) {
        // إذا اختار المستخدم "نعم" للأجزاء الشفافة ولم يحدد المواقع بعد
        if (answers.transparentParts === 'yes') {
          const selectedLocations = answers.transparentPartsLocation?.split(',').filter(Boolean) || [];
          if (selectedLocations.length === 0) {
            setTransparentPartsModalOpen(true);
            return; // لا تنتقل حتى يتم تحديد المواقع
          }
        }
      }

      // التحقق من الزينة المتعددة في السؤال 8 (الإضافات والزينة)
      if (currentStep === 8) {
        const selectedEmbs = Array.isArray(answers.embellishments)
          ? answers.embellishments
          : (answers.embellishments ? [answers.embellishments] : []);
        // استبعاد 'other' و 'belt' و 'none' - لا تحتاج لتحديد مكان
        const activeEmbs = selectedEmbs.filter(e => e !== 'other' && e !== 'belt' && e !== 'none');

        // إذا تم اختيار أي زينة وأماكنها غير محددة، عرض نافذة التحديد
        if (activeEmbs.length >= 1) {
          const allPlacementsFilled = activeEmbs.every(
            (emb) => answers.embellishmentPlacements?.[emb] && answers.embellishmentPlacements[emb].trim() !== ''
          );

          if (!allPlacementsFilled) {
            setMultiEmbellishmentModalOpen(true);
            return; // لا تنتقل حتى يتم إكمال النافذة
          }
        }
      }

      setCurrentStep(currentStep + 1);
      scrollToTop();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollToTop();
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
    scrollToTop();
  };

  const handleSubmit = () => {
    // Clear saved step when submitting
    try {
      localStorage.removeItem(STORAGE_STEP_KEY);
      console.log('✅ Cleared saved simplified step on submit');
    } catch (error) {
      console.error('Error clearing saved simplified step:', error);
    }
    onSubmit(answers);
  };

  // Reference image part options
  const referencePartOptions = [
    { value: 'full_body', labelAr: 'كامل الجسم', labelEn: 'Full Body' },
    { value: 'bodice', labelAr: 'الصدر / الجزء العلوي', labelEn: 'Bodice / Upper Body' },
    { value: 'waist', labelAr: 'الخصر', labelEn: 'Waist' },
    { value: 'back', labelAr: 'الظهر', labelEn: 'Back' },
    { value: 'sleeves', labelAr: 'الأكمام', labelEn: 'Sleeves' },
    { value: 'skirt', labelAr: 'التنورة', labelEn: 'Skirt' },
    { value: 'neckline', labelAr: 'خط الرقبة', labelEn: 'Neckline' },
    { value: 'other', labelAr: 'أخرى (حدد)', labelEn: 'Other (specify)' },
  ];

  // Handle reference image file upload — adds a new entry
  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newEntry: ReferenceImageEntry = { image: base64, parts: [] };
      setAnswers(prev => ({
        ...prev,
        referenceImageEntries: [...(prev.referenceImageEntries || []), newEntry],
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Toggle a part for a specific entry
  const toggleEntryPart = (entryIndex: number, partValue: string) => {
    setAnswers(prev => {
      const entries = [...(prev.referenceImageEntries || [])];
      const entry = { ...entries[entryIndex] };
      if (entry.parts.includes(partValue)) {
        entry.parts = entry.parts.filter(p => p !== partValue);
      } else {
        entry.parts = [...entry.parts, partValue];
      }
      entries[entryIndex] = entry;
      return { ...prev, referenceImageEntries: entries };
    });
  };

  // Remove a reference image entry
  const removeReferenceEntry = (index: number) => {
    setAnswers(prev => ({
      ...prev,
      referenceImageEntries: (prev.referenceImageEntries || []).filter((_, i) => i !== index),
    }));
  };

  // ─── Reference Match Helpers ───────────────────────────────────────
  // Collect all parts from all uploaded reference images
  const allReferenceParts = useMemo(() => {
    const parts = new Set<string>();
    (answers.referenceImageEntries || []).forEach(entry => {
      entry.parts.forEach(p => parts.add(p));
    });
    return parts;
  }, [answers.referenceImageEntries]);

  // Does any reference image apply to one of the given question parts?
  const hasReferenceForQuestion = (questionParts: string[]): boolean => {
    if (allReferenceParts.has('full_body')) return true;
    return questionParts.some(p => allReferenceParts.has(p));
  };

  // Return images of reference entries whose parts overlap with the question parts
  const getMatchingReferenceImages = (questionParts: string[]): string[] =>
    (answers.referenceImageEntries || [])
      .filter(e => e.parts.includes('full_body') || e.parts.some(p => questionParts.includes(p)))
      .map(e => e.image);

  // Auto-select 'reference_match' when entering a relevant step with no prior answer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentStep === 4 && !answers.skirtShape  && hasReferenceForQuestion(['skirt', 'waist']))    updateAnswer('skirtShape',   'reference_match');
    if (currentStep === 5 && !answers.necklineType && hasReferenceForQuestion(['neckline', 'bodice'])) updateAnswer('necklineType', 'reference_match');
    if (currentStep === 6 && !answers.backStyle   && hasReferenceForQuestion(['back']))               updateAnswer('backStyle',    'reference_match');
    if (currentStep === 7 && !answers.sleeveType  && hasReferenceForQuestion(['sleeves']))            updateAnswer('sleeveType',   'reference_match');
  }, [currentStep]); // intentionally only runs on step change

  // Render a "Match Reference Image" card at the top of an affected question
  const renderReferenceMatchCard = (
    currentValue: string,
    onSelect: () => void,
    matchingImages: string[]
  ) => {
    const isSelected = currentValue === 'reference_match';
    return (
      <motion.button
        type="button"
        onClick={onSelect}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'w-full p-3 rounded-xl border-2 text-start transition-all flex items-center gap-3 mb-4',
          isSelected
            ? 'border-accent-gold bg-accent-gold/10 shadow-md'
            : 'border-accent-gold/40 bg-accent-gold/5 hover:border-accent-gold hover:bg-accent-gold/10'
        )}
      >
        {/* Reference image thumbnails (up to 3) */}
        <div className="flex gap-1 flex-shrink-0">
          {matchingImages.slice(0, 3).map((img, i) => (
            <div key={i} className="w-10 h-14 rounded-lg overflow-hidden border border-accent-gold/30 flex-shrink-0">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-sm', isSelected ? 'text-accent-gold' : 'text-primary')}>
            {direction === 'rtl' ? '✦ مطابق للصورة المرجعية' : '✦ Match Reference Image'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-tight">
            {direction === 'rtl'
              ? 'سيتم تطبيق التصميم الموجود في الصورة المرجعية على هذا الجزء'
              : 'The design from the reference image will be applied to this area'}
          </p>
        </div>
        {/* Checkbox indicator */}
        <div className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
          isSelected ? 'bg-accent-gold border-accent-gold' : 'border-gray-300'
        )}>
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      </motion.button>
    );
  };
  // ────────────────────────────────────────────────────────────────────

  const renderQuestion = () => {
    switch (currentStep) {
      case 1: { // Reference Images (Optional)
        const entries = answers.referenceImageEntries || [];
        return (
          <div className="space-y-6">
            {/* Section Header */}
            <div>
              <span className="text-xs font-medium text-accent-gold uppercase tracking-wide">
                {direction === 'rtl' ? 'صورة مرجعية — اختيارية' : 'Reference Image — Optional'}
              </span>
              <h3 className="text-lg md:text-xl font-semibold text-primary mt-1">
                {direction === 'rtl'
                  ? 'هل لديك صورة مرجعية لجزء معين من الفستان؟'
                  : 'Do you have a reference image for a specific dress part?'}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {direction === 'rtl'
                  ? 'أرفق صورة أو أكثر لتصميم معين تريد تطبيقه على جزء محدد من الفستان.'
                  : 'Attach one or more reference images for specific design areas you want to replicate.'}
              </p>
              <p className="text-xs text-accent-gold/80 mt-1 font-medium">
                {direction === 'rtl' ? '❆ هذا السؤال اختياري — يمكنك تخطيه بالضغط على التالي' : '❆ Optional step — press Next to skip'}
              </p>
            </div>

            {/* Existing entries */}
            {entries.length > 0 && (
              <div className="space-y-6">
                {entries.map((entry, idx) => (
                  <div key={idx} className="border-2 border-accent-gold/30 rounded-2xl p-4 space-y-4 bg-accent-gold/5">
                    {/* Image Preview */}
                    <div className="relative rounded-xl overflow-hidden border border-accent-gold/40 bg-gray-50">
                      <img
                        src={entry.image}
                        alt={`Reference ${idx + 1}`}
                        className="w-full max-h-64 object-contain"
                      />
                      {/* Crop Button */}
                      <button
                        type="button"
                        onClick={() => setRefImageCropper({ imageSrc: entry.image, index: idx })}
                        className="absolute top-2 left-2 bg-accent-gold/90 hover:bg-accent-gold text-white px-3 py-1 rounded-lg shadow text-xs font-medium transition-colors"
                      >
                        {direction === 'rtl' ? 'تعديل الصورة' : 'Edit Image'}
                      </button>
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeReferenceEntry(idx)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow transition-colors"
                        aria-label="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-accent-gold/90 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        {direction === 'rtl' ? `صورة ${idx + 1}` : `Image ${idx + 1}`}
                      </div>
                    </div>

                    {/* Part Selection — multi-select checkboxes */}
                    <div>
                      <p className="font-semibold text-primary mb-2 text-sm">
                        {direction === 'rtl'
                          ? 'أي جزء من الفستان يمثل هذه الصورة؟ (يمكن اختيار أكثر من جزء)'
                          : 'Which part(s) of the dress does this reference? (multiple allowed)'}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {referencePartOptions.map(part => {
                          const selected = entry.parts.includes(part.value);
                          return (
                            <button
                              key={part.value}
                              type="button"
                              onClick={() => toggleEntryPart(idx, part.value)}
                              className={cn(
                                'p-2.5 rounded-xl border-2 text-xs font-medium transition-all flex items-center gap-1.5',
                                selected
                                  ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                                  : 'border-gray-200 text-gray-700 hover:border-accent-gold/50 hover:bg-gray-50'
                              )}
                            >
                              <span className={cn(
                                'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                                selected ? 'bg-accent-gold border-accent-gold' : 'border-gray-300'
                              )}>
                                {selected && <Check className="w-2.5 h-2.5 text-white" />}
                              </span>
                              {direction === 'rtl' ? part.labelAr : part.labelEn}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom text for Other */}
                      {entry.parts.includes('other') && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2"
                        >
                          <input
                            type="text"
                            value={entry.partCustom || ''}
                            onChange={(e) => {
                              setAnswers(prev => {
                                const updated = [...(prev.referenceImageEntries || [])];
                                updated[idx] = { ...updated[idx], partCustom: e.target.value };
                                return { ...prev, referenceImageEntries: updated };
                              });
                            }}
                            placeholder={direction === 'rtl' ? 'صف الجزء المطلوب بالتفصيل...' : 'Describe the specific dress part in detail...'}
                            className="w-full p-2.5 border-2 border-accent-gold/40 rounded-xl focus:outline-none focus:border-accent-gold text-sm bg-white"
                          />
                        </motion.div>
                      )}

                      {/* Selected parts summary */}
                      {entry.parts.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 flex items-center gap-1.5 flex-wrap"
                        >
                          <Check className="w-4 h-4 text-accent-gold flex-shrink-0" />
                          <span className="text-xs text-primary">
                            {entry.parts
                              .map(p => {
                                if (p === 'other') return entry.partCustom || (direction === 'rtl' ? 'أخرى' : 'Other');
                                return direction === 'rtl'
                                  ? referencePartOptions.find(o => o.value === p)?.labelAr || p
                                  : referencePartOptions.find(o => o.value === p)?.labelEn || p;
                              })
                              .join('، ')}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add image button */}
            <button
              type="button"
              onClick={() => referenceImageInputRef.current?.click()}
              className="w-full border-2 border-dashed border-accent-gold/40 rounded-2xl p-8 text-center cursor-pointer hover:border-accent-gold/80 hover:bg-accent-gold/5 transition-all"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-accent-gold/10 flex items-center justify-center">
                  {entries.length === 0 ? <Upload className="w-7 h-7 text-accent-gold" /> : <Plus className="w-7 h-7 text-accent-gold" />}
                </div>
                <div>
                  <p className="font-semibold text-primary">
                    {direction === 'rtl'
                      ? (entries.length === 0 ? 'انقر لرفع صورة مرجعية' : 'إضافة صورة مرجعية أخرى')
                      : (entries.length === 0 ? 'Click to upload reference image' : 'Add another reference image')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {direction === 'rtl' ? 'PNG أو JPG — حد أقصى 10MB' : 'PNG or JPG — max 10MB'}
                  </p>
                </div>
              </div>
            </button>

            {/* Hidden file input */}
            <input
              ref={referenceImageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleReferenceImageUpload}
            />
          </div>
        );
      }

      case 2: // Dress Type
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section1.title')}
            questionText={t('questionnaire.section1.q1.question')}
            questionType="radio"
            options={[
              { value: 'evening', labelKey: 'questionnaire.section1.q1.options.evening' },
              { value: 'wedding', labelKey: 'questionnaire.section1.q1.options.wedding' },
              { value: 'engagement', labelKey: 'questionnaire.section1.q1.options.engagement' },
              { value: 'party', labelKey: 'questionnaire.section1.q1.options.party' },
              { value: 'other', labelKey: 'questionnaire.section1.q1.options.other', hasCustomInput: true },
            ]}
            value={answers.dressType}
            customValue={answers.dressTypeCustom}
            onChange={(value, customValue) => updateAnswer('dressType', value as string, customValue)}
            onAutoAdvance={handleNext}
          />
        );

      case 3: // Dress Length
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section1.title')}
            questionText={t('questionnaire.section1.q3.question')}
            questionType="radio"
            options={[
              { value: 'knee', labelKey: 'questionnaire.section1.q3.options.knee' },
              { value: 'floor', labelKey: 'questionnaire.section1.q3.options.floor' },
              { value: 'train', labelKey: 'questionnaire.section1.q3.options.train' },
              { value: 'other', labelKey: 'questionnaire.section1.q3.options.other', hasCustomInput: true },
            ]}
            value={answers.dressLength}
            customValue={answers.dressLengthCustom}
            onChange={(value, customValue) => updateAnswer('dressLength', value as string, customValue)}
            onAutoAdvance={handleNext}
          />
        );

      case 4: // شكل التنورة - نسخة من السؤال 5 في قسم ابتكري تصميمك
        return (
          <>
            {hasReferenceForQuestion(['skirt', 'waist']) && renderReferenceMatchCard(
              answers.skirtShape,
              () => updateAnswer('skirtShape', 'reference_match'),
              getMatchingReferenceImages(['skirt', 'waist'])
            )}
            <QuestionStep
              sectionTitle={t('questionnaire.section2.title')}
              questionText={t('questionnaire.section2.q4.question')}
              questionType="radio"
              options={[
                { value: 'straight', labelKey: 'questionnaire.section2.q4.options.straight' },
                { value: 'tight', labelKey: 'questionnaire.section2.q4.options.tight' },
                { value: 'pleated', labelKey: 'questionnaire.section2.q4.options.pleated' },
                { value: 'puffy', labelKey: 'questionnaire.section2.q4.options.puffy' },
                { value: 'layered', labelKey: 'questionnaire.section2.q4.options.layered' },
                { value: 'mermaidTail', labelKey: 'questionnaire.section2.q4.options.mermaidTail' },
                { value: 'overskirt', labelKey: 'questionnaire.section2.q4.options.overskirt' },
                { value: 'peplum', labelKey: 'questionnaire.section2.q4.options.peplum' },
                { value: 'sideDrape', labelKey: 'questionnaire.section2.q4.options.sideDrape' },
                { value: 'other', labelKey: 'questionnaire.section2.q4.options.other', hasCustomInput: true },
              ]}
              value={answers.skirtShape === 'reference_match' ? '' : answers.skirtShape}
              customValue={answers.skirtShapeCustom}
              onChange={(value, customValue) => updateAnswer('skirtShape', value as string, customValue)}
              onAutoAdvance={handleNext}
              enableSkirtPreview={true}
              onSkirtPreview={handleSkirtPreview}
              skirtPreviewOptions={['sideDrape', 'peplum', 'overskirt', 'mermaidTail', 'layered']}
            />
          </>
        );

      case 5: { // Neckline Type - Image Grid
        const necklineOptions = [
          { value: 'vNeck',        image: '/V-neck.png',               labelKey: 'questionnaire.section3.q5.options.vNeck' },
          { value: 'sweetheart',   image: '/Sweetheart.png',           labelKey: 'questionnaire.section3.q5.options.sweetheart' },
          { value: 'offShoulder',  image: '/Off-shoulder.png',         labelKey: 'questionnaire.section3.q5.options.offShoulder' },
          { value: 'strapless',    image: '/Strapless.png',            labelKey: 'questionnaire.section3.q5.options.strapless' },
          { value: 'square',       image: '/Square.png',               labelKey: 'questionnaire.section3.q5.options.square' },
          { value: 'scoop',        image: '/Scoop.png',                labelKey: 'questionnaire.section3.q5.options.scoop' },
          { value: 'halter',       image: '/Halter.png',               labelKey: 'questionnaire.section3.q5.options.halter' },
          { value: 'halterStrap',  image: '/Halter strap.png',         labelKey: 'questionnaire.section3.q5.options.halterStrap' },
          { value: 'jewel',        image: '/Jewel.png',                labelKey: 'questionnaire.section3.q5.options.jewel' },
          { value: 'surplice',     image: '/superlice.png',            labelKey: 'questionnaire.section3.q5.options.surplice' },
          { value: 'cowl',         image: '/Cowl.png',                 labelKey: 'questionnaire.section3.q5.options.cowl' },
          { value: 'asymmetric',   image: '/Asymmetric.png',           labelKey: 'questionnaire.section3.q5.options.asymmetric' },
          { value: 'illusion',     image: '/Illusion.png',             labelKey: 'questionnaire.section3.q5.options.illusion' },
          { value: 'convertible',  image: '/convertble nickline.png',  labelKey: 'questionnaire.section3.q5.options.convertible' },
          { value: 'keyhole',      image: '/keyhole neck.png',         labelKey: 'questionnaire.section3.q5.options.keyhole' },
          { value: 'spaghettiStrap', image: '/Spaghetti strap.png',   labelKey: 'questionnaire.section3.q5.options.spaghettiStrap' },
          { value: 'portrait',     image: '/Portrait Neckline.png',    labelKey: 'questionnaire.section3.q5.options.portrait' },
          { value: 'bardot',       image: '/Bardot Neckline.png',      labelKey: 'questionnaire.section3.q5.options.bardot' },
          { value: 'mockNeck',     image: '/Mock Neck.png',            labelKey: 'questionnaire.section3.q5.options.mockNeck' },
        ];

        return (
          <div className="space-y-4">
            {/* Section title */}
            <div>
              <span className="text-xs font-medium text-accent-gold uppercase tracking-wide">
                {t('questionnaire.section3.title')}
              </span>
              <h3 className="text-lg md:text-xl font-semibold text-primary mt-1">
                {t('questionnaire.section3.q5.question')}
              </h3>
            </div>

            {/* Reference match card — shown above grid if relevant */}
            {hasReferenceForQuestion(['neckline', 'bodice']) && renderReferenceMatchCard(
              answers.necklineType,
              () => updateAnswer('necklineType', 'reference_match'),
              getMatchingReferenceImages(['neckline', 'bodice'])
            )}

            {/* Image grid – 2 cols on mobile, 3 on sm, 4 on md, 5 on lg+ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {necklineOptions.map((option) => {
                const isSelected = answers.necklineType === option.value;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      updateAnswer('necklineType', option.value);
                      setTimeout(handleNext, 350);
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center cursor-pointer text-center group"
                  >
                    {/* Thumbnail */}
                    <div className={cn(
                      'relative w-1/2 mx-auto aspect-[3/4] rounded-lg overflow-hidden mb-2 transition-all',
                      isSelected ? 'ring-2 ring-accent-gold shadow-md' : 'group-hover:opacity-90'
                    )}>
                      <Image
                        src={option.image}
                        alt={t(option.labelKey)}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 18vw"
                        unoptimized
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-accent-gold/20 flex items-end justify-end p-1">
                          <div className="w-6 h-6 bg-accent-gold rounded-full flex items-center justify-center shadow">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <span className={cn(
                      'text-xs font-medium leading-tight',
                      isSelected ? 'text-accent-gold' : 'text-gray-700'
                    )}>
                      {t(option.labelKey)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      }

      case 6: // Back Style
        return (
          <>
            {hasReferenceForQuestion(['back']) && renderReferenceMatchCard(
              answers.backStyle || '',
              () => updateAnswer('backStyle', 'reference_match'),
              getMatchingReferenceImages(['back'])
            )}
            <QuestionStep
              sectionTitle={t('questionnaire.section4.title')}
              questionText={t('questionnaire.section4.q7.question')}
              questionType="radio"
              options={[
                { value: 'covered', labelKey: 'questionnaire.section4.q7.options.covered' },
                { value: 'openBack', labelKey: 'questionnaire.section4.q7.options.openBack' },
                { value: 'deepV', labelKey: 'questionnaire.section4.q7.options.deepV' },
                { value: 'keyhole', labelKey: 'questionnaire.section4.q7.options.keyhole' },
                { value: 'illusion', labelKey: 'questionnaire.section4.q7.options.illusion' },
                { value: 'laceBack', labelKey: 'questionnaire.section4.q7.options.laceBack' },
                { value: 'lowBack', labelKey: 'questionnaire.section4.q7.options.lowBack' },
                { value: 'crossBack', labelKey: 'questionnaire.section4.q7.options.crossBack' },
                { value: 'bowBack', labelKey: 'questionnaire.section4.q7.options.bowBack' },
                { value: 'corsetBack', labelKey: 'questionnaire.section4.q7.options.corsetBack' },
                { value: 'other', labelKey: 'questionnaire.section4.q7.options.other', hasCustomInput: true },
              ]}
              value={answers.backStyle === 'reference_match' ? '' : (answers.backStyle || '')}
              customValue={answers.backStyleCustom}
              onChange={(value, customValue) => updateAnswer('backStyle', value as string, customValue)}
              onAutoAdvance={handleNext}
            />
          </>
        );

      case 7: // Sleeve Type
        return (
          <>
            {hasReferenceForQuestion(['sleeves']) && renderReferenceMatchCard(
              answers.sleeveType,
              () => updateAnswer('sleeveType', 'reference_match'),
              getMatchingReferenceImages(['sleeves'])
            )}
            <QuestionStep
              sectionTitle={t('questionnaire.section3.title')}
              questionText={t('questionnaire.section3.q6.question')}
              questionType="radio"
              options={[
                { value: 'sleeveless', labelKey: 'questionnaire.section3.q6.options.sleeveless' },
                { value: 'short', labelKey: 'questionnaire.section3.q6.options.short' },
                { value: 'long', labelKey: 'questionnaire.section3.q6.options.long' },
                { value: 'sheer', labelKey: 'questionnaire.section3.q6.options.sheer' },
                { value: 'puff', labelKey: 'questionnaire.section3.q6.options.puff' },
                { value: 'offShoulder', labelKey: 'questionnaire.section3.q6.options.offShoulder' },
                { value: 'lace', labelKey: 'questionnaire.section3.q6.options.lace' },
                { value: 'other', labelKey: 'questionnaire.section3.q6.options.other', hasCustomInput: true },
              ]}
              value={answers.sleeveType === 'reference_match' ? '' : answers.sleeveType}
              customValue={answers.sleeveTypeCustom}
              onChange={(value, customValue) => updateAnswer('sleeveType', value as string, customValue)}
              onAutoAdvance={handleNext}
            />
          </>
        );

      case 8: // Transparent Parts
        const selectedTransparentLocations = answers.transparentPartsLocation?.split(',').filter(Boolean) || [];
        const transparentLocationLabels: { [key: string]: { ar: string; en: string } } = {
          sleeves: { ar: 'الأكمام', en: 'Sleeves' },
          back: { ar: 'الظهر', en: 'Back' },
          chest: { ar: 'الصدر', en: 'Chest' },
          sides: { ar: 'الجوانب', en: 'Sides' },
          waist: { ar: 'الخصر', en: 'Waist' },
          neckline: { ar: 'خط العنق', en: 'Neckline' },
          skirt: { ar: 'التنورة', en: 'Skirt' },
          hem: { ar: 'الذيل/الحاشية', en: 'Hem/Train' },
        };

        return (
          <div className="space-y-6">
            <QuestionStep
              sectionTitle={t('questionnaire.section5.title')}
              questionText={t('questionnaire.section5.q9.question')}
              questionType="yesno"
              value={answers.transparentParts || ''}
              onChange={(value) => {
                updateAnswer('transparentParts', value as string);
                // إذا اختار "لا"، امسح المواقع المحددة
                if (value === 'no') {
                  setAnswers(prev => ({ ...prev, transparentPartsLocation: '' }));
                }
              }}
              placeholder={t('questionnaire.section5.q9.placeholder')}
              onAutoAdvance={handleNext}
            />

            {/* عرض المواقع المختارة إذا كانت موجودة */}
            {answers.transparentParts === 'yes' && selectedTransparentLocations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-accent-gold/10 border-2 border-accent-gold rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-primary text-sm">
                    {direction === 'rtl' ? 'أماكن الأجزاء الشفافة:' : 'Transparent Parts Locations:'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransparentPartsModalOpen(true)}
                    className="text-xs"
                  >
                    {t('common.edit')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTransparentLocations.map(loc => (
                    <span key={loc} className="px-3 py-1 bg-accent-gold/20 text-primary rounded-full text-sm">
                      {direction === 'rtl'
                        ? transparentLocationLabels[loc]?.ar || loc
                        : transparentLocationLabels[loc]?.en || loc}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        );

      case 9: // الزينة والإضافات - نسخة من السؤال 8 في قسم ابتكري تصميمك
        // استخراج الإضافات المحددة
        const selectedEmbellishments = Array.isArray(answers.embellishments)
          ? answers.embellishments
          : (answers.embellishments ? [answers.embellishments] : []);
        const activeEmbellishments = selectedEmbellishments.filter(e => e !== 'other' && e !== 'belt' && e !== 'none');

        return (
          <div className="space-y-6">
            {/* تلميح حول الاختيار المتعدد */}
            <div className="text-sm text-accent-gold bg-accent-gold/10 px-4 py-2 rounded-lg">
              {t('questionnaire.section6.q9.multiSelectHint')}
            </div>

            <QuestionStep
              sectionTitle={t('questionnaire.section6.title')}
              questionText={t('questionnaire.section6.q9.question')}
              questionType="checkbox"
              options={[
                // خيارات محدثة من قسم ابتكري تصميمك الخاص (السؤال 8)
                { value: 'sequins', labelKey: 'questionnaire.section6.q9.options.sequins' },
                { value: 'stones', labelKey: 'questionnaire.section6.q9.options.stones' },
                { value: 'pearls', labelKey: 'questionnaire.section6.q9.options.pearls' },
                { value: 'embroideryBeads', labelKey: 'questionnaire.section6.q9.options.embroideryBeads' },
                { value: 'decorativeLace', labelKey: 'questionnaire.section6.q9.options.decorativeLace' },
                { value: '3dFlowers', labelKey: 'questionnaire.section6.q9.options.3dFlowers' },
                { value: 'feathers', labelKey: 'questionnaire.section6.q9.options.feathers' },
                { value: 'bow', labelKey: 'questionnaire.section6.q9.options.bow' },
                { value: 'ruffles', labelKey: 'questionnaire.section6.q9.options.ruffles' },
                { value: 'belt', labelKey: 'questionnaire.section6.q9.options.belt' },
                { value: 'other', labelKey: 'questionnaire.section6.q9.options.other', hasCustomInput: true },
              ]}
              value={selectedEmbellishments}
              customValue={answers.embellishmentsCustom}
              onChange={(value, customValue) => updateAnswer('embellishments', value, customValue)}
              // لا يوجد انتقال تلقائي للاختيار المتعدد - المستخدم يضغط التالي
            />

            {/* عرض ملخص الأماكن إذا تم تحديد أي إضافة */}
            {activeEmbellishments.length > 0 &&
             Object.keys(answers.embellishmentPlacements || {}).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-accent-gold/10 border-2 border-accent-gold rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-primary text-sm">
                    {direction === 'rtl' ? 'أماكن الإضافات:' : 'Embellishment Placements:'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMultiEmbellishmentModalOpen(true)}
                    className="text-xs"
                  >
                    {t('common.edit')}
                  </Button>
                </div>
                {activeEmbellishments.map(emb => (
                  answers.embellishmentPlacements?.[emb] && (
                    <p key={emb} className="text-sm text-gray-600">
                      <span className="font-medium text-accent-gold">
                        {t(`questionnaire.section6.q9.options.${emb}`)}:
                      </span>{' '}
                      {answers.embellishmentPlacements[emb]}
                    </p>
                  )
                ))}
              </motion.div>
            )}
          </div>
        );

      case 10: // أسلوب التصميم
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section8.title')}
            questionText={t('questionnaire.section8.q14.question')}
            questionType="radio"
            options={[
              // خيارات مطابقة للسؤال 9 من قسم ابتكري تصميمك الخاص
              { value: 'classic', labelKey: 'questionnaire.section8.q14.options.classic' },
              { value: 'modern', labelKey: 'questionnaire.section8.q14.options.modern' },
              { value: 'romantic', labelKey: 'questionnaire.section8.q14.options.romantic' },
              { value: 'glamorous', labelKey: 'questionnaire.section8.q14.options.glamorous' },
              { value: 'boho', labelKey: 'questionnaire.section8.q14.options.boho' },
              { value: 'dramatic', labelKey: 'questionnaire.section8.q14.options.dramatic' },
              { value: 'minimalist', labelKey: 'questionnaire.section8.q14.options.minimalist' },
              { value: 'other', labelKey: 'questionnaire.section8.q14.options.other', hasCustomInput: true },
            ]}
            value={answers.designStyle || ''}
            customValue={answers.designStyleCustom}
            onChange={(value, customValue) => updateAnswer('designStyle', value as string, customValue)}
            onAutoAdvance={handleNext}
          />
        );

      case 11: // تفاصيل إضافية
        return (
          <QuestionStep
            sectionTitle={t('questionnaire.section9.title')}
            questionText={t('questionnaire.section9.q16.question')}
            questionType="textarea"
            value={answers.additionalDetails || ''}
            onChange={(value) => updateAnswer('additionalDetails', value as string)}
            placeholder={t('questionnaire.section9.q16.placeholder')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="luxury-card p-4 md:p-6 lg:p-8">
      {/* Progress Bar */}
      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepClick={handleStepClick}
      />

      {/* Question Content */}
      <AnimatePresence mode="wait">
        <div key={currentStep} className="min-h-[300px] md:min-h-[400px]">
          {renderQuestion()}
        </div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className={cn('flex gap-3 md:gap-4 mt-6 md:mt-8', direction === 'rtl' ? 'flex-row-reverse' : '')}>
        {currentStep > 1 && (
          <Button
            variant="ghost"
            size="lg"
            onClick={handlePrevious}
            disabled={loading}
            className="flex-1 text-sm md:text-base"
          >
            {t('common.previous')}
          </Button>
        )}

        {currentStep < totalSteps ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleNext}
            disabled={loading}
            className="flex-1 text-sm md:text-base"
          >
            {t('common.next')}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 text-sm md:text-base"
          >
            {loading ? t('design.prompt.generating') : t('common.submit')}
          </Button>
        )}
      </div>

      {/* نافذة تحديد أماكن الزينة المتعددة */}
      <MultiEmbellishmentPlacementModal
        isOpen={multiEmbellishmentModalOpen}
        onClose={() => setMultiEmbellishmentModalOpen(false)}
        selectedEmbellishments={
          (Array.isArray(answers.embellishments) ? answers.embellishments : (answers.embellishments ? [answers.embellishments] : []))
            .filter(e => e !== 'other' && e !== 'belt' && e !== 'none')
        }
        embellishmentPlacements={answers.embellishmentPlacements || {}}
        onPlacementsChange={(placements) => {
          setAnswers(prev => ({
            ...prev,
            embellishmentPlacements: placements
          }));
          if (onAnswersChange) {
            onAnswersChange({
              ...answers,
              embellishmentPlacements: placements
            });
          }
        }}
        onConfirm={() => {
          // بعد تأكيد الأماكن، الانتقال للخطوة التالية
          setCurrentStep(currentStep + 1);
          scrollToTop();
        }}
        onSkip={() => {
          // تخطي تحديد الأماكن والانتقال للخطوة التالية
          setCurrentStep(currentStep + 1);
          scrollToTop();
        }}
      />

      {/* نافذة معاينة شكل التنورة */}
      <SkirtPreviewModal
        isOpen={skirtPreviewModalOpen}
        onClose={() => setSkirtPreviewModalOpen(false)}
        skirtType={selectedSkirtForPreview}
        skirtNameAr={selectedSkirtForPreview ? t(`questionnaire.section2.q4.options.${selectedSkirtForPreview}`) : ''}
        skirtNameEn={selectedSkirtForPreview ? t(`questionnaire.section2.q4.options.${selectedSkirtForPreview}`) : ''}
      />

      {/* نافذة تحديد أماكن الأجزاء الشفافة */}
      <TransparentPartsPlacementModal
        isOpen={transparentPartsModalOpen}
        onClose={() => setTransparentPartsModalOpen(false)}
        selectedLocations={answers.transparentPartsLocation?.split(',').filter(Boolean) || []}
        onLocationsChange={(locations) => {
          const locationString = locations.join(',');
          setAnswers(prev => ({
            ...prev,
            transparentPartsLocation: locationString
          }));
          if (onAnswersChange) {
            onAnswersChange({
              ...answers,
              transparentPartsLocation: locationString
            });
          }
        }}
        onConfirm={() => {
          // بعد تأكيد الأماكن، الانتقال للخطوة التالية
          setCurrentStep(currentStep + 1);
          scrollToTop();
        }}
      />

      {/* قاص الصورة المرجعية */}
      {refImageCropper && (
        <ImageCropper
          imageSrc={refImageCropper.imageSrc}
          onCrop={(croppedImage) => {
            const entryIndex = refImageCropper.index;
            setAnswers(prev => {
              const updated = [...(prev.referenceImageEntries || [])];
              updated[entryIndex] = { ...updated[entryIndex], image: croppedImage };
              return { ...prev, referenceImageEntries: updated };
            });
            setRefImageCropper(null);
          }}
          onCancel={() => setRefImageCropper(null)}
        />
      )}
    </div>
  );
}


