# Dual Modification Buttons Implementation

## Overview
Successfully implemented two separate modification buttons that allow users to either:
1. **Iteratively modify** the current/latest version using `gemini-3.1-flash-image-preview`
2. **Try new modifications** on the original base image using `gemini-3-pro-image-preview`

## Implementation Summary

### 1. Translation Keys Updated
**Files Modified:**
- `public/locales/ar.json`
- `public/locales/en.json`

**Changes:**
- **Updated** `design.results.requestEdit`:
  - Arabic: "طلب تعديل آخر على هذه الصورة"
  - English: "Request Another Edit on This Version"
  
- **Added** `design.results.newAttemptOnOriginal`:
  - Arabic: "محاولة جديدة على الصورة الأصلية"
  - English: "New Attempt on Original Version"

### 2. API Route Enhanced
**File:** `app/api/edit-design/route.ts`

**Changes:**
- Added `GeminiModel` type for model selection
- Updated `EditDesignRequest` interface to include optional `model` parameter
- Modified API logic to use the selected model (defaults to `gemini-3.1-flash-image-preview`)

**New Type:**
```typescript
export type GeminiModel = 'google/gemini-3.1-flash-image-preview' | 'google/gemini-3-pro-image-preview';

export interface EditDesignRequest {
  originalImageUrl: string;
  editRequest: string;
  model?: GeminiModel; // Optional: defaults to gemini-3.1-flash-image-preview
}
```

### 3. Design Page Enhanced
**File:** `app/design/page.tsx`

**New State Variables:**
- `originalImageUrl`: Tracks the very first generated design (base image)
- `editMode`: Tracks whether user wants 'iterative' or 'original' modification

**New Functions:**
- `handleRequestIterativeEdit()`: Opens modal for iterative editing (current version + gemini-3.1-flash-image-preview)
- `handleRequestOriginalEdit()`: Opens modal for original editing (base image + gemini-3-pro-image-preview)

**Updated Functions:**
- `handleEditDesign()`: Now determines which image and model to use based on `editMode`
- Image generation: Now saves both `imageUrl` and `originalImageUrl` on first generation

**UI Changes:**
- Replaced single "Request Edit" button with two buttons:
  1. **"طلب تعديل آخر على هذه الصورة"** - Always visible, uses current image
  2. **"محاولة جديدة على الصورة الأصلية"** - Only visible when `originalImageUrl` exists, uses base image

### 4. Profile Components Updated
**File:** `components/profile/DesignDetailsModal.tsx`

**Changes:**
- Updated button text to use translation key `t('design.results.requestEdit')`
- Maintains single button for history designs (uses iterative mode by default)

## How It Works

### Workflow Comparison

#### Button 1: "طلب تعديل آخر على هذه الصورة" (Iterative)
```
User clicks button
    ↓
setEditMode('iterative')
    ↓
Modal opens (2-step workflow)
    ↓
User selects locations + enters description
    ↓
GPT-5-mini refines prompt
    ↓
API called with:
  - originalImageUrl: current/latest image
  - model: 'google/gemini-3.1-flash-image-preview'
    ↓
Gemini 3.1 Flash Image Preview generates modified version
    ↓
Result replaces current image (iterative modification)
```

#### Button 2: "محاولة جديدة على الصورة الأصلية" (Original)
```
User clicks button
    ↓
setEditMode('original')
    ↓
Modal opens (2-step workflow)
    ↓
User selects locations + enters description
    ↓
GPT-5-mini refines prompt
    ↓
API called with:
  - originalImageUrl: original base image
  - model: 'google/gemini-3-pro-image-preview'
    ↓
Gemini 3 Pro Image generates modified version
    ↓
Result replaces current image (new attempt on original)
```

### Key Differences

| Feature | Button 1 (Iterative) | Button 2 (Original) |
|---------|---------------------|---------------------|
| **Source Image** | Current/Latest version | Original base image |
| **AI Model** | gemini-3.1-flash-image-preview | gemini-3-pro-image-preview |
| **Use Case** | Build on previous modifications | Try different approach on original |
| **Visibility** | Always visible | Only when original exists |
| **Button Color** | Gold border | Primary (dark) border |

## Files Modified

1. ✅ `public/locales/ar.json` - Added/updated translation keys
2. ✅ `public/locales/en.json` - Added/updated translation keys
3. ✅ `app/api/edit-design/route.ts` - Added model selection support
4. ✅ `app/design/page.tsx` - Added dual buttons and edit mode logic
5. ✅ `components/profile/DesignDetailsModal.tsx` - Updated button text

## Testing Results

✅ **Build Status:** Successful
- No TypeScript errors
- No compilation errors
- All routes properly registered

## Usage Instructions

### For Users:

1. **Generate a dress design** using the questionnaire
2. **Two buttons appear:**
   - **"طلب تعديل آخر على هذه الصورة"**: Modify the current version (builds on previous changes)
   - **"محاولة جديدة على الصورة الأصلية"**: Start fresh from the original design with a different AI model

3. **Click either button** to open the modification workflow:
   - Step 1: Select modification location(s)
   - Step 2: Describe the modification
   - AI refines and generates the result

4. **Results:**
   - Iterative button: Modifies the current image, preserving previous changes
   - Original button: Modifies the base image, ignoring previous modifications

### For Developers:

**To test:**
```bash
npm run dev
```

**To verify:**
1. Generate a design
2. Verify both buttons appear
3. Click "طلب تعديل آخر على هذه الصورة" - should use current image + gemini-3.1-flash-image-preview
4. Click "محاولة جديدة على الصورة الأصلية" - should use original image + gemini-3-pro-image-preview
5. Check console logs to verify correct model and image are being used

## Notes

- The original image URL is preserved throughout the session
- Both buttons use the same two-step modification workflow (location selection → description)
- Both buttons use GPT-5-mini for prompt refinement
- The only differences are the source image and the AI model used for generation
- History designs only show the iterative button (original image not tracked in history)

