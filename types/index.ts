// API Request and Response Types

export interface EnhancePromptRequest {
  description?: string; // For backward compatibility
  questionnaireAnswers?: QuestionnaireAnswers; // New questionnaire format
  fabricImage?: string; // NEW: Custom fabric image (Base64 data URL)
}

export interface EnhancePromptResponse {
  enhancedPrompt: string;
  structuredDescription?: string; // Optional structured description
  error?: string;
}

export interface GenerateImageRequest {
  prompt: string;
  fabricImage?: string; // NEW: Custom fabric image (Base64 data URL)
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
  sleeveType: string;
  sleeveTypeCustom?: string;

  // Section 5: Fabric & Materials (Section 4 removed: Back Design)
  fabricType: string;
  fabricTypeCustom?: string;
  customFabricImage?: string; // NEW: Custom fabric image (Base64 data URL)
  fabricPlacement?: 'full' | 'bodice' | 'skirt' | 'sleeves' | 'custom'; // NEW: Where to use custom fabric
  fabricPlacementDetails?: string; // NEW: Details if placement is 'custom'
  hasTransparentParts: string;
  transparentPartsLocation?: string;

  // Section 6: Embellishments & Body Size
  embellishments: string[];
  embellishmentsCustom?: string;
  embellishmentPlacement?: string;
  bodySize: string; // XS, S, M, L, XL, XXL

  // Section 7: Colors
  primaryColor: string;
  hasAdditionalColors: string;
  additionalColors?: string;

  // Section 9: Additional Notes (Q13 Design Style removed)
  additionalNotes?: string;
}

// Design Type (for saved designs from database)
export interface Design {
  id: string;
  image_url: string;
  enhanced_prompt: string;
  created_at: string;
  is_favorite: boolean;
  questionnaire_answers?: QuestionnaireAnswers | null;
  original_description?: string; // Optional: JSON string of questionnaire answers or text description
  image_data?: string; // Optional: Base64 image data
  embellishment_placement?: string | null; // Optional: Embellishment placement details
}

