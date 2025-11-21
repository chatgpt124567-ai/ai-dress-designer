# i18n Implementation Guide

## ✅ Completed

### Infrastructure
- [x] Created `contexts/LanguageContext.tsx` - Language context provider with translation function
- [x] Created `public/locales/en.json` - English translations
- [x] Created `public/locales/ar.json` - Arabic translations
- [x] Created `components/LanguageToggle.tsx` - Language switcher component
- [x] Updated `app/layout.tsx` - Added Tajawal font for Arabic, wrapped app in LanguageProvider
- [x] Updated `app/globals.css` - Added Arabic font support and RTL styles

### Components Updated
- [x] `components/Header.tsx` - Added translations and language toggle
- [x] `components/Footer.tsx` - Added translations with RTL support

## 🔄 Remaining Updates

### Pages
- [ ] `app/page.tsx` - Home/Landing page
- [ ] `app/design/page.tsx` - Design studio page

### Components
- [ ] `components/PromptCard.tsx`
- [ ] `components/ImageCard.tsx`
- [ ] `components/Lightbox.tsx`
- [ ] `components/Toast.tsx`
- [ ] `components/Button.tsx` (if needed)
- [ ] `components/AdvancedPanel.tsx` (if needed)

## Implementation Pattern

### For each component:

1. **Import useLanguage hook:**
```typescript
import { useLanguage } from '@/contexts/LanguageContext';
```

2. **Use the hook:**
```typescript
const { t, direction } = useLanguage();
```

3. **Replace hardcoded text:**
```typescript
// Before
<h1>Design Your Dream Dress</h1>

// After
<h1>{t('home.hero.title')}</h1>
```

4. **Add RTL support for spacing:**
```typescript
// Before
<div className="flex space-x-4">

// After
<div className={cn("flex", direction === 'rtl' ? 'space-x-reverse space-x-4' : 'space-x-4')}>
```

## Translation Keys Structure

```
header.*
footer.*
home.hero.*
home.process.*
home.gallery.*
design.title
design.subtitle
design.tabs.*
design.prompt.*
design.advanced.*
design.results.*
design.toast.*
lightbox.*
common.*
```

## RTL Considerations

1. **Spacing**: Use `space-x-reverse` for RTL
2. **Text Alignment**: Tailwind automatically handles `text-left` → `text-right` in RTL
3. **Flex Direction**: Use `flex-row-reverse` when needed
4. **Margins/Padding**: Use logical properties or RTL-aware classes

## Testing Checklist

- [ ] Language toggle works in header
- [ ] Language preference persists on page reload
- [ ] All text is translated
- [ ] RTL layout works correctly
- [ ] Arabic font displays properly
- [ ] Animations work in both directions
- [ ] Forms work in RTL
- [ ] No layout breaks in either language

