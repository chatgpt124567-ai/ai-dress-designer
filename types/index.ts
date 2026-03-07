// API Request and Response Types

export interface EnhancePromptRequest {
  description?: string; // For backward compatibility
  questionnaireAnswers?: QuestionnaireAnswers; // New questionnaire format
  fabricImage?: string; // NEW: Custom fabric image (Base64 data URL)
  // Own Fabric Workflow
  primaryFabricImage?: string; // Primary fabric image (Base64)
  secondaryFabricImage?: string; // Secondary fabric image (Base64)
  secondaryFabricType?: string; // Secondary fabric type (if not image)
  primaryFabricPlacement?: string; // Where to use primary fabric
  secondaryFabricPlacement?: string; // Where to use secondary fabric
  secondaryFabricColor?: string; // Color of the secondary fabric
  // Reference Image
  referenceImage?: string; // Reference image (Base64) for a specific dress part (legacy)
  referenceImagePart?: string; // The dress part the reference applies to (legacy)
  referenceImageEntries?: Array<{ image: string; parts: string[] }>; // Multiple reference images (new)
}

export interface EnhancePromptResponse {
  enhancedPrompt: string;
  structuredDescription?: string; // Optional structured description
  error?: string;
}

export type GeminiImageModel = 'google/gemini-3.1-flash-image-preview' | 'google/gemini-3-pro-image-preview';

export interface GenerateImageRequest {
  prompt: string;
  fabricImage?: string; // NEW: Custom fabric image (Base64 data URL)
  model?: GeminiImageModel; // Optional: defaults to gemini-3.1-flash-image-preview
  // Own Fabric Workflow
  primaryFabricImage?: string; // Primary fabric image (Base64)
  secondaryFabricImage?: string; // Secondary fabric image (Base64)
  questionnaireAnswers?: QuestionnaireAnswers; // Questionnaire answers for Design Specs
  // Reference Image
  referenceImage?: string; // Reference image (Base64) for a specific dress part (legacy)
  referenceImagePart?: string; // The dress part the reference applies to (legacy)
  referenceImageEntries?: Array<{ image: string; parts: string[] }>; // Multiple reference images (new)
}

export interface GenerateImageResponse {
  imageUrl?: string;
  imageData?: string;
  error?: string;
}

export interface DressDesign {
  id: string;
  originalDescription: string;
  enhancedPrompt: string;
  imageUrl: string;
  createdAt: Date;
}

// Reference Image Entry (for multiple reference images)
export interface ReferenceImageEntry {
  image: string; // Base64 data URL
  parts: string[]; // Selected dress parts (multi-select)
  partCustom?: string; // Custom text when 'other' is in parts
}

// Questionnaire Types

export interface QuestionOption {
  value: string;
  label: string;
  hasCustomInput?: boolean; // If true, shows text input when selected
}

export interface Question {
  id: string;
  type: 'radio' | 'checkbox' | 'text' | 'textarea';
  translationKey: string;
  options?: QuestionOption[];
  required?: boolean;
}

export interface QuestionSection {
  id: string;
  titleKey: string;
  questions: Question[];
}

export interface QuestionnaireAnswers {
  // Section 1: Basics
  dressType: string;
  dressTypeCustom?: string;
  dressLength: string;
  dressLengthCustom?: string;

  // Section 2: Silhouette (Q3 Waist Shape removed)
  skirtShape: string;
  skirtShapeCustom?: string;

  // Section 3: Upper Body
  necklineType: string;
  necklineTypeCustom?: string;

  // Section 4: Back Design
  backStyle?: string;
  backStyleCustom?: string;

  // Section 5: Sleeves
  sleeveType: string;
  sleeveTypeCustom?: string;

  // Section 6: Fabric & Materials
  fabricType: string | string[]; // Can be single or multiple fabric types
  fabricTypeCustom?: string;
  fabricPlacements?: { [fabricType: string]: string }; // Description of where each fabric is used
  customFabricImage?: string; // NEW: Custom fabric image (Base64 data URL)
  fabricPlacement?: 'full' | 'bodice' | 'skirt' | 'sleeves' | 'custom'; // NEW: Where to use custom fabric
  fabricPlacementDetails?: string; // NEW: Details if placement is 'custom'
  hasTransparentParts?: string; // Full questionnaire
  transparentParts?: string; // Simplified questionnaire (own fabric workflow)
  transparentPartsLocation?: string;

  // Section 6: Embellishments & Body Size
  embellishments: string[];
  embellishmentsCustom?: string;
  embellishmentPlacement?: string; // Legacy: single text field
  embellishmentPlacements?: { [embellishmentType: string]: string }; // New: placements for each embellishment
  bodySize?: string; // XS, S, M, L, XL, XXL (full questionnaire)
  bodyType?: string; // XS, S, M, L, XL, XXL (simplified questionnaire - own fabric workflow)
  bodyTypeCustom?: string;

  // Section 7: Colors
  primaryColor?: string;
  hasAdditionalColors?: string;
  additionalColors?: string;

  // Section 8: Design Style
  designStyle?: string;
  designStyleCustom?: string;

  // Section 9: Additional Notes
  additionalNotes?: string; // Full questionnaire
  additionalDetails?: string; // Simplified questionnaire (own fabric workflow)

  // Reference Image (Optional - for matching a specific dress part to a reference)
  referenceImage?: string; // Base64 data URL of reference image (legacy single image)
  referenceImagePart?: string; // Dress part (legacy single selection)
  referenceImagePartCustom?: string; // Custom text when referenceImagePart is 'other' (legacy)
  referenceImageEntries?: ReferenceImageEntry[]; // Multiple reference images (new)
}

// ===== أنواع ميزة توليد 5 تصاميم دفعة واحدة =====

// إجابات استبيان 5 تصاميم المخصص
export interface BatchDesignQuestionnaireAnswers {
  dressTypes?: string[]; // أنواع الفساتين المختارة (حد أقصى 5)
  dressTypesCustom?: string; // وصف مخصص لنوع الفستان
  dressLengths?: string[]; // أطوال الفساتين المختارة (حد أقصى 5)
  dressLengthsCustom?: string; // وصف مخصص لطول الفستان
  embellishments?: string[]; // الزينة المختارة (حد أقصى 5)
  embellishmentsCustom?: string; // وصف مخصص للزينة
  designStyles?: string[]; // أساليب التصميم المختارة (حد أقصى 5)
  designStylesCustom?: string; // وصف مخصص لأسلوب التصميم
  backStyles?: string[]; // أشكال ظهر الفستان المختارة (حد أقصى 5)
  backStylesCustom?: string; // وصف مخصص لشكل الظهر
}

// طلب توليد 5 برومبتات مختلفة
export interface GenerateMultiplePromptsRequest {
  primaryFabricImage: string; // صورة القماش الأساسي (Base64)
  secondaryFabricImage?: string; // صورة القماش الثانوي (اختياري)
  primaryFabricPlacement?: string; // موضع القماش الأساسي
  secondaryFabricPlacement?: string; // موضع القماش الثانوي
  batchQuestionnaireAnswers?: BatchDesignQuestionnaireAnswers; // إجابات الاستبيان المخصص
}

// استجابة توليد 5 برومبتات
export interface GenerateMultiplePromptsResponse {
  prompts?: string[]; // مصفوفة البرومبتات الخمسة
  error?: string;
}

// طلب توليد 5 صور دفعة واحدة
export interface GenerateMultipleImagesRequest {
  prompts: string[]; // مصفوفة البرومبتات (5 برومبتات)
  primaryFabricImage: string; // صورة القماش الأساسي (Base64)
  secondaryFabricImage?: string; // صورة القماش الثانوي (اختياري)
  model?: GeminiImageModel; // نموذج الذكاء الاصطناعي
}

// نتيجة توليد صورة واحدة
export interface SingleImageResult {
  index: number; // رقم التصميم (0-4)
  prompt: string; // البرومبت المستخدم
  imageData?: string; // بيانات الصورة (Base64)
  imageUrl?: string; // رابط الصورة
  error?: string; // الخطأ إن وجد
  success: boolean;
}

// استجابة توليد 5 صور
export interface GenerateMultipleImagesResponse {
  results?: SingleImageResult[]; // نتائج الصور الخمسة
  successCount?: number; // عدد الصور الناجحة
  error?: string;
}

// ===== نهاية أنواع ميزة 5 تصاميم =====

// Design Type (for saved designs from database)
export interface Design {
  id: string;
  image_url: string;
  thumbnail_url?: string; // Optional: Thumbnail URL from storage
  storage_path?: string; // Optional: Storage path for full image
  thumbnail_storage_path?: string; // Optional: Storage path for thumbnail
  enhanced_prompt: string;
  created_at: string;
  is_favorite: boolean;
  questionnaire_answers?: QuestionnaireAnswers | null;
  original_description?: string; // Optional: JSON string of questionnaire answers or text description
  image_data?: string; // Optional: Base64 image data (legacy)
  embellishment_placement?: string | null; // Optional: Embellishment placement details
  model_used?: string; // Optional: AI model used for generation (e.g., 'google/gemini-3.1-flash-image-preview')
}

