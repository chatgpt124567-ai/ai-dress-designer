// API Request and Response Types

export interface EnhancePromptRequest {
  description?: string; // For backward compatibility
  questionnaireAnswers?: QuestionnaireAnswers; // New questionnaire format
}

export interface EnhancePromptResponse {
  enhancedPrompt: string;
  structuredDescription?: string; // Optional structured description
  error?: string;
}

export interface GenerateImageRequest {
  prompt: string;
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

  // Section 2: Silhouette
  waistShape: string;
  waistShapeCustom?: string;
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
  hasTransparentParts: string;
  transparentPartsLocation?: string;

  // Section 6: Embellishments
  embellishments: string[];
  embellishmentsCustom?: string;
  embellishmentPlacement?: string;
  shineLevel: string;
  shineLevelCustom?: string;

  // Section 7: Colors
  primaryColor: string;
  hasAdditionalColors: string;
  additionalColors?: string;

  // Section 8: Design Style (Q15 removed: Reference Image)
  designStyle: string;
  designStyleCustom?: string;

  // Section 9: Additional Notes
  additionalNotes?: string;
}

