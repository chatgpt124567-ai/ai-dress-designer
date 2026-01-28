import { NextRequest, NextResponse } from 'next/server';
import type {
  GenerateMultiplePromptsRequest,
  GenerateMultiplePromptsResponse,
  BatchDesignQuestionnaireAnswers
} from '@/types';

/**
 * التحقق من اكتمال التصميم - يجب أن يحتوي على Design Specs و Front View و Back View
 */
function validateDesignCompleteness(content: string): {
  isComplete: boolean;
  hasSpecs: boolean;
  hasFront: boolean;
  hasBack: boolean;
  missingParts: string[]
} {
  // البحث عن المكونات الأساسية
  const hasSpecs = /design\s*specs|type:|length:|style:|back:/i.test(content);
  const hasFront = /front\s*view|front view/i.test(content);
  const hasBack = /back\s*view|back view/i.test(content);

  const missingParts: string[] = [];
  if (!hasSpecs) missingParts.push('Design Specs');
  if (!hasFront) missingParts.push('Front View');
  if (!hasBack) missingParts.push('Back View');

  const isComplete = hasSpecs && hasFront && hasBack;

  return { isComplete, hasSpecs, hasFront, hasBack, missingParts };
}

/**
 * دالة لفصل البرومبتات الخمسة من النص المُولد
 * تستخدم عدة طرق للتحليل لضمان استخراج أكبر عدد ممكن من التصاميم
 */
function parseMultiplePrompts(generatedText: string): { prompts: string[]; rawText: string; method: string } {
  console.log('📝 بدء تحليل النص المُولد...');
  console.log(`📏 طول النص: ${generatedText.length} حرف`);

  // الطريقة 1: استخدام العلامات الدقيقة (الأفضل والأكثر دقة)
  let prompts = parseWithExactMarkers(generatedText);
  let validPrompts = prompts.filter(p => validateDesignCompleteness(p).isComplete);

  if (validPrompts.length === 5) {
    console.log('✅ الطريقة 1 (علامات دقيقة): نجحت - 5 تصاميم مكتملة');
    logDesignValidation(validPrompts);
    return { prompts: validPrompts, rawText: generatedText, method: 'exact_markers' };
  }
  console.log(`⚠️ الطريقة 1: استخرجت ${prompts.length} تصاميم (${validPrompts.length} مكتملة)`);

  // الطريقة 2: استخدام regex مرن
  const regexPrompts = parseWithFlexibleRegex(generatedText);
  const validRegexPrompts = regexPrompts.filter(p => validateDesignCompleteness(p).isComplete);

  if (validRegexPrompts.length > validPrompts.length) {
    prompts = regexPrompts;
    validPrompts = validRegexPrompts;
    if (validPrompts.length === 5) {
      console.log('✅ الطريقة 2 (regex مرن): نجحت - 5 تصاميم مكتملة');
      logDesignValidation(validPrompts);
      return { prompts: validPrompts, rawText: generatedText, method: 'flexible_regex' };
    }
  }
  console.log(`⚠️ الطريقة 2: استخرجت ${regexPrompts.length} تصاميم (${validRegexPrompts.length} مكتملة)`);

  // الطريقة 3: تقسيم بناءً على أنماط Design (محسّنة)
  const patternPrompts = parseWithDesignPatterns(generatedText);
  const validPatternPrompts = patternPrompts.filter(p => validateDesignCompleteness(p).isComplete);

  if (validPatternPrompts.length > validPrompts.length) {
    prompts = patternPrompts;
    validPrompts = validPatternPrompts;
    if (validPrompts.length === 5) {
      console.log('✅ الطريقة 3 (أنماط Design): نجحت - 5 تصاميم مكتملة');
      logDesignValidation(validPrompts);
      return { prompts: validPrompts, rawText: generatedText, method: 'design_patterns' };
    }
  }
  console.log(`⚠️ الطريقة 3: استخرجت ${patternPrompts.length} تصاميم (${validPatternPrompts.length} مكتملة)`);

  // الطريقة 4: تقسيم بناءً على الأرقام (محسّنة)
  const numberedPrompts = parseWithNumberedSections(generatedText);
  const validNumberedPrompts = numberedPrompts.filter(p => validateDesignCompleteness(p).isComplete);

  if (validNumberedPrompts.length > validPrompts.length) {
    prompts = numberedPrompts;
    validPrompts = validNumberedPrompts;
    if (validPrompts.length === 5) {
      console.log('✅ الطريقة 4 (أقسام مرقمة): نجحت - 5 تصاميم مكتملة');
      logDesignValidation(validPrompts);
      return { prompts: validPrompts, rawText: generatedText, method: 'numbered_sections' };
    }
  }
  console.log(`⚠️ الطريقة 4: استخرجت ${numberedPrompts.length} تصاميم (${validNumberedPrompts.length} مكتملة)`);

  // استخدام أفضل نتيجة متاحة (حتى لو أقل من 5)
  const bestPrompts = validPrompts.length > 0 ? validPrompts : prompts;

  console.log(`📊 النتيجة النهائية: ${bestPrompts.length} تصاميم من 5`);
  logDesignValidation(bestPrompts);

  return { prompts: bestPrompts, rawText: generatedText, method: 'best_effort' };
}

/**
 * طباعة تفاصيل التحقق من التصاميم
 */
function logDesignValidation(prompts: string[]): void {
  prompts.forEach((prompt, index) => {
    const validation = validateDesignCompleteness(prompt);
    const status = validation.isComplete ? '✅' : '⚠️';
    const details = validation.isComplete
      ? 'مكتمل'
      : `ناقص: ${validation.missingParts.join(', ')}`;
    console.log(`   ${status} التصميم ${index + 1}: ${details} (${prompt.length} حرف)`);
  });
}

// الطريقة 1: العلامات الدقيقة (محسّنة لاستخراج المحتوى الكامل)
function parseWithExactMarkers(text: string): string[] {
  const prompts: string[] = [];

  for (let i = 1; i <= 5; i++) {
    // استخدام regex أكثر مرونة للعلامات
    const startPatterns = [
      `===DESIGN_${i}===`,
      `=== DESIGN_${i} ===`,
      `===DESIGN ${i}===`,
      `=== DESIGN ${i} ===`,
      `==DESIGN_${i}==`,
      `== DESIGN_${i} ==`,
    ];

    const endPatterns = [
      `===END_DESIGN_${i}===`,
      `=== END_DESIGN_${i} ===`,
      `===END DESIGN_${i}===`,
      `=== END DESIGN_${i} ===`,
      `===END_DESIGN ${i}===`,
      `=== END_DESIGN ${i} ===`,
      `==END_DESIGN_${i}==`,
      `== END_DESIGN_${i} ==`,
    ];

    let startIndex = -1;
    let startMarkerLength = 0;

    // البحث عن علامة البداية
    for (const marker of startPatterns) {
      const idx = text.indexOf(marker);
      if (idx !== -1) {
        startIndex = idx;
        startMarkerLength = marker.length;
        break;
      }
    }

    // البحث عن علامة النهاية
    let endIndex = -1;
    for (const marker of endPatterns) {
      const idx = text.indexOf(marker);
      if (idx !== -1 && (endIndex === -1 || idx < endIndex)) {
        endIndex = idx;
      }
    }

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const content = text.substring(startIndex + startMarkerLength, endIndex).trim();
      // التحقق من أن المحتوى ذو معنى (يحتوي على Front View و Back View)
      if (content.length > 50) {
        prompts.push(content);
      }
    }
  }

  return prompts;
}

// الطريقة 2: Regex مرن محسّن (يتعامل مع جميع الاختلافات)
function parseWithFlexibleRegex(text: string): string[] {
  const prompts: string[] = [];

  for (let i = 1; i <= 5; i++) {
    // regex مرن جداً يتعامل مع مسافات ونقاط وأقواس مختلفة
    // يستخدم lazy matching (.*?) لتجنب التطابق الجشع
    const regexPatterns = [
      // النمط الأساسي: ===DESIGN_X=== ... ===END_DESIGN_X===
      new RegExp(
        `={2,}\\s*DESIGN[_\\s-]*${i}\\s*={2,}([\\s\\S]*?)={2,}\\s*END[_\\s-]*DESIGN[_\\s-]*${i}\\s*={2,}`,
        'i'
      ),
      // نمط بديل مع نقطتين
      new RegExp(
        `DESIGN[_\\s]*${i}[:\\s]*([\\s\\S]*?)(?:END[_\\s]*DESIGN[_\\s]*${i}|DESIGN[_\\s]*${i + 1}|$)`,
        'i'
      ),
    ];

    for (const regex of regexPatterns) {
      const match = text.match(regex);
      if (match && match[1]) {
        const content = match[1].trim();
        // التحقق من اكتمال المحتوى
        if (content.length > 100 && validateDesignCompleteness(content).isComplete) {
          prompts.push(content);
          break; // وجدنا تطابق جيد، ننتقل للتصميم التالي
        }
      }
    }
  }

  return prompts;
}

// الطريقة 3: أنماط Design (محسّنة - لا تستخدم split)
function parseWithDesignPatterns(text: string): string[] {
  const prompts: string[] = [];

  // البحث عن كل نقطة بداية تصميم
  const designStartPattern = /(?:^|\n)\s*(?:#{1,3}\s*)?(?:\*\*)?Design\s*#?\s*(\d)\s*(?:\*\*)?[:\-–—\s]*(?:\n|$)/gi;

  const matches: { index: number; designNum: number }[] = [];
  let match;

  while ((match = designStartPattern.exec(text)) !== null) {
    const designNum = parseInt(match[1], 10);
    if (designNum >= 1 && designNum <= 5) {
      matches.push({
        index: match.index + match[0].length,
        designNum
      });
    }
  }

  // ترتيب المطابقات حسب رقم التصميم
  matches.sort((a, b) => a.designNum - b.designNum);

  // استخراج المحتوى بين كل تصميم والذي يليه
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index - 50 : text.length; // -50 لاستبعاد العنوان التالي

    let content = text.substring(start, end).trim();

    // إزالة علامات النهاية إذا وُجدت
    content = content.replace(/={2,}\s*END[_\s-]*DESIGN[_\s-]*\d\s*={2,}/gi, '').trim();

    if (content.length > 100) {
      prompts.push(content);
    }
  }

  return prompts;
}

// الطريقة 4: أقسام مرقمة (محسّنة - تحافظ على المحتوى الكامل)
function parseWithNumberedSections(text: string): string[] {
  const prompts: string[] = [];

  // البحث عن أنماط ترقيم شائعة للتصاميم
  const sectionPatterns = [
    // **1.** أو **Design 1:**
    /(?:^|\n)\s*\*\*\s*(?:Design\s*)?(\d)[.\):]\s*\*\*/gi,
    // ## Design 1 أو ### 1.
    /(?:^|\n)\s*#{1,3}\s*(?:Design\s*)?(\d)[.\):]?\s*/gi,
    // 1. أو 1) أو 1:
    /(?:^|\n)\s*(\d)[.\):][\s]+(?=\S)/gi,
  ];

  for (const pattern of sectionPatterns) {
    const matches: { index: number; num: number; matchLength: number }[] = [];
    let match;

    // إعادة تعيين lastIndex للـ regex
    pattern.lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 5) {
        matches.push({
          index: match.index + match[0].length,
          num,
          matchLength: match[0].length
        });
      }
    }

    if (matches.length >= 5) {
      // ترتيب حسب الترقيم
      matches.sort((a, b) => a.num - b.num);

      // استخراج المحتوى
      const extracted: string[] = [];
      for (let i = 0; i < Math.min(matches.length, 5); i++) {
        const start = matches[i].index;
        const end = i + 1 < matches.length ? matches[i + 1].index - matches[i + 1].matchLength : text.length;

        const content = text.substring(start, end).trim();
        if (content.length > 100) {
          extracted.push(content);
        }
      }

      if (extracted.length >= 5) {
        return extracted.slice(0, 5);
      }
    }
  }

  return prompts;
}

/**
 * ترجمة قيم الاستبيان إلى نصوص مقروءة
 */
const translationMaps = {
  dressTypes: {
    evening: 'evening gown',
    wedding: 'wedding dress',
    engagement: 'engagement dress',
    party: 'party dress',
  } as Record<string, string>,
  dressLengths: {
    knee: 'knee-length',
    long: 'long (ankle-length)',
    floor: 'floor-length',
    train: 'floor-length with train',
  } as Record<string, string>,
  embellishments: {
    sequins: 'sequins',
    stones: 'rhinestones/crystals',
    pearls: 'pearls',
    embroideryBeads: 'embroidery & beads',
    decorativeLace: 'decorative lace',
    '3dFlowers': '3D flowers',
    feathers: 'feathers',
    bow: 'bow',
    ruffles: 'ruffles',
    none: 'no embellishments (clean fabric-focused design)',
  } as Record<string, string>,
  designStyles: {
    classic: 'classic/timeless',
    modern: 'modern/contemporary',
    romantic: 'romantic/soft',
    glamorous: 'glamorous/luxurious',
    boho: 'boho/natural',
    dramatic: 'dramatic/bold',
    minimalist: 'minimalist/elegant',
  } as Record<string, string>,
  backStyles: {
    covered: 'fully covered back',
    openBack: 'open back',
    deepV: 'deep V-back',
    keyhole: 'keyhole back',
    illusion: 'illusion back with sheer fabric',
    laceBack: 'lace back',
    lowBack: 'low back',
    crossBack: 'cross-back straps',
    bowBack: 'bow detail on back',
    corsetBack: 'corset lace-up back',
  } as Record<string, string>,
};

/**
 * بناء تعليمات ذكية للاستبيان - تتعامل مع كل سيناريو بشكل مختلف
 */
function buildQuestionnaireInstructions(answers?: BatchDesignQuestionnaireAnswers): string {
  const sections: string[] = [];

  // ========== 1. نوع الفستان ==========
  const dressTypes = answers?.dressTypes?.filter(t => t !== 'other') || [];
  const dressTypesTranslated = dressTypes.map(t => translationMaps.dressTypes[t] || t);
  if (answers?.dressTypesCustom) dressTypesTranslated.push(answers.dressTypesCustom);

  if (dressTypesTranslated.length === 0) {
    sections.push(`**DRESS TYPE:** ⚡ CLIENT SKIPPED - You must AUTO-GENERATE appropriate dress types for each design based on the fabric's characteristics. Choose from: evening gown, wedding dress, engagement dress, or party dress. Create variety across the 5 designs.`);
  } else if (dressTypesTranslated.length === 1) {
    sections.push(`**DRESS TYPE:** 🔒 FIXED - ALL 5 designs MUST be "${dressTypesTranslated[0]}". Do NOT vary this.`);
  } else {
    sections.push(`**DRESS TYPE:** 📊 DISTRIBUTE - Use ONLY these types across the 5 designs: [${dressTypesTranslated.join(', ')}]. Each type must appear in at least one design. Suggested: Design 1=${dressTypesTranslated[0] || 'auto'}, Design 2=${dressTypesTranslated[1] || 'auto'}, Design 3=${dressTypesTranslated[2] || dressTypesTranslated[0]}, Design 4=${dressTypesTranslated[3] || dressTypesTranslated[1] || dressTypesTranslated[0]}, Design 5=${dressTypesTranslated[4] || dressTypesTranslated[0]}.`);
  }

  // ========== 2. طول الفستان ==========
  const dressLengths = answers?.dressLengths?.filter(l => l !== 'other') || [];
  const dressLengthsTranslated = dressLengths.map(l => translationMaps.dressLengths[l] || l);
  if (answers?.dressLengthsCustom) dressLengthsTranslated.push(answers.dressLengthsCustom);

  if (dressLengthsTranslated.length === 0) {
    sections.push(`**DRESS LENGTH:** ⚡ CLIENT SKIPPED - You must AUTO-GENERATE appropriate lengths based on the fabric weight and drape. For flowing fabrics prefer floor-length; for structured fabrics vary between knee and floor-length. Create variety across the 5 designs.`);
  } else if (dressLengthsTranslated.length === 1) {
    sections.push(`**DRESS LENGTH:** 🔒 FIXED - ALL 5 designs MUST be "${dressLengthsTranslated[0]}". Do NOT vary this.`);
  } else {
    const distribution = dressLengthsTranslated.map((l, i) => `Design ${i + 1}=${l}`);
    // ملء التصاميم المتبقية بالتكرار
    for (let i = dressLengthsTranslated.length; i < 5; i++) {
      distribution.push(`Design ${i + 1}=${dressLengthsTranslated[i % dressLengthsTranslated.length]}`);
    }
    sections.push(`**DRESS LENGTH:** 📊 DISTRIBUTE - Use ONLY these lengths: [${dressLengthsTranslated.join(', ')}]. Assignment: ${distribution.join(', ')}.`);
  }

  // ========== 3. الزينة ==========
  const embellishments = answers?.embellishments?.filter(e => e !== 'other') || [];
  const embellishmentsTranslated = embellishments.map(e => translationMaps.embellishments[e] || e);
  if (answers?.embellishmentsCustom) embellishmentsTranslated.push(answers.embellishmentsCustom);

  if (embellishmentsTranslated.length === 0) {
    sections.push(`**EMBELLISHMENTS:** ⚡ CLIENT SKIPPED - You must AUTO-GENERATE embellishment choices that complement the fabric. Analyze the fabric's texture and pattern: if fabric is already ornate/patterned, use minimal embellishments; if fabric is plain, add creative embellishments. Create variety across designs.`);
  } else if (embellishmentsTranslated.length === 1) {
    sections.push(`**EMBELLISHMENTS:** 🔒 FIXED - ALL 5 designs MUST feature "${embellishmentsTranslated[0]}" as the primary embellishment. You may combine it with subtle complementary details.`);
  } else {
    sections.push(`**EMBELLISHMENTS:** 🎨 MIX & MATCH - Available embellishments: [${embellishmentsTranslated.join(', ')}]. You CAN combine multiple embellishments in ONE design. Each embellishment should appear in at least one design. Be creative: some designs can have 2-3 combined, others can feature just one prominently.`);
  }

  // ========== 4. أسلوب التصميم ==========
  const designStyles = answers?.designStyles?.filter(s => s !== 'other') || [];
  const designStylesTranslated = designStyles.map(s => translationMaps.designStyles[s] || s);
  if (answers?.designStylesCustom) designStylesTranslated.push(answers.designStylesCustom);

  if (designStylesTranslated.length === 0) {
    sections.push(`**DESIGN STYLE:** ⚡ CLIENT SKIPPED - You must AUTO-GENERATE design styles based on the fabric. Luxurious fabrics = glamorous; soft flowing fabrics = romantic; structured fabrics = modern or classic. Create variety across the 5 designs.`);
  } else if (designStylesTranslated.length === 1) {
    sections.push(`**DESIGN STYLE:** 🔒 FIXED - ALL 5 designs MUST follow the "${designStylesTranslated[0]}" aesthetic. Do NOT vary the overall style.`);
  } else {
    const distribution = designStylesTranslated.map((s, i) => `Design ${i + 1}=${s}`);
    for (let i = designStylesTranslated.length; i < 5; i++) {
      distribution.push(`Design ${i + 1}=${designStylesTranslated[i % designStylesTranslated.length]}`);
    }
    sections.push(`**DESIGN STYLE:** 📊 DISTRIBUTE - Use ONLY these styles: [${designStylesTranslated.join(', ')}]. Assignment: ${distribution.join(', ')}.`);
  }

  // ========== 5. شكل الظهر ==========
  const backStyles = answers?.backStyles?.filter(b => b !== 'other') || [];
  const backStylesTranslated = backStyles.map(b => translationMaps.backStyles[b] || b);
  if (answers?.backStylesCustom) backStylesTranslated.push(answers.backStylesCustom);

  if (backStylesTranslated.length === 0) {
    sections.push(`**BACK DESIGN:** ⚡ CLIENT SKIPPED - You must AUTO-GENERATE back designs that complement each front design. Create variety: some open backs, some covered, some with unique closures. The back should enhance the overall design coherence.`);
  } else if (backStylesTranslated.length === 1) {
    sections.push(`**BACK DESIGN:** 🔒 FIXED - ALL 5 designs MUST have "${backStylesTranslated[0]}". Do NOT vary the back style.`);
  } else if (backStylesTranslated.length === 5) {
    // 5 أنواع = كل تصميم يحصل على واحد
    sections.push(`**BACK DESIGN:** 🎯 EXACT MATCH - You selected exactly 5 back styles. Each design gets ONE: Design 1="${backStylesTranslated[0]}", Design 2="${backStylesTranslated[1]}", Design 3="${backStylesTranslated[2]}", Design 4="${backStylesTranslated[3]}", Design 5="${backStylesTranslated[4]}".`);
  } else {
    const distribution = backStylesTranslated.map((b, i) => `Design ${i + 1}=${b}`);
    for (let i = backStylesTranslated.length; i < 5; i++) {
      distribution.push(`Design ${i + 1}=${backStylesTranslated[i % backStylesTranslated.length]}`);
    }
    sections.push(`**BACK DESIGN:** 📊 DISTRIBUTE - Use ONLY these back styles: [${backStylesTranslated.join(', ')}]. Assignment: ${distribution.join(', ')}.`);
  }

  // ========== 6. العناصر التي يجب على AI توليدها تلقائياً ==========
  const autoGenerateItems: string[] = [];
  autoGenerateItems.push('Neckline type (V-neck, sweetheart, off-shoulder, high neck, etc.)');
  autoGenerateItems.push('Sleeve type (sleeveless, long, short, bell, etc.)');
  autoGenerateItems.push('Skirt shape (A-line, mermaid, ball gown, straight, etc.)');
  autoGenerateItems.push('Waist style (fitted, empire, dropped, natural, etc.)');

  sections.push(`
**🤖 AUTO-GENERATE THESE ELEMENTS (Client did not answer):**
The following elements were NOT specified by the client. You MUST generate them creatively based on the fabric's characteristics:
- ${autoGenerateItems.join('\n- ')}

Choose these elements to:
1. Complement the fabric's weight, drape, and texture
2. Create cohesive designs where all elements work together
3. Ensure variety across the 5 designs (don't repeat the same neckline 5 times, etc.)
`);

  return `
═══════════════════════════════════════════════════════════════════
🎨 CLIENT PREFERENCES & DESIGN INSTRUCTIONS
═══════════════════════════════════════════════════════════════════

LEGEND:
🔒 FIXED = Client selected ONE option → ALL 5 designs must use it
📊 DISTRIBUTE = Client selected multiple → Spread them across designs
🎨 MIX & MATCH = Can combine multiple in one design
⚡ AUTO-GENERATE = Client skipped → You decide based on fabric

─────────────────────────────────────────────────────────────────

${sections.join('\n\n')}

═══════════════════════════════════════════════════════════════════
`;
}

/**
 * بناء البرومبت الرئيسي الذي سيُرسل للذكاء الاصطناعي لتوليد 5 تصاميم مختلفة
 * يعتمد على تحليل صورة القماش + إجابات المستخدم
 */
function buildMultiDesignPrompt(
  primaryFabricPlacement?: string,
  secondaryFabricPlacement?: string,
  hasSecondaryFabric?: boolean,
  questionnaireAnswers?: BatchDesignQuestionnaireAnswers
): string {
  const primaryPlacement = primaryFabricPlacement || 'the entire dress';

  // تعليمات القماش المخصص
  let fabricInstruction = '';
  if (hasSecondaryFabric && secondaryFabricPlacement) {
    fabricInstruction = `Use the EXACT fabric pattern, texture, and colors from the attached PRIMARY fabric image for ${primaryPlacement}. Use the SECONDARY fabric for ${secondaryFabricPlacement}. Do NOT modify, recolor, or alter the fabrics. Apply with photorealistic precision.`;
  } else {
    fabricInstruction = `Use the EXACT fabric pattern, texture, and colors from the attached fabric image for ${primaryPlacement}. Do NOT modify, recolor, or alter the fabric. Apply with photorealistic precision maintaining all original details.`;
  }

  // الحصول على تعليمات الاستبيان
  const questionnaireInstructions = buildQuestionnaireInstructions(questionnaireAnswers);

  return `You are an elite couture fashion designer AI. Your task is to generate EXACTLY 5 COMPLETELY DIFFERENT and UNIQUE dress designs based on the client's fabric image AND their preferences below.

⚠️ CRITICAL: You MUST generate ALL 5 DESIGNS with proper markers. Incomplete output is unacceptable.
⚠️   Warning: The back design must be perfectly consistent with the front design. The gown must read as one fully integrated, cohesive piece. Avoid creating any back design that feels disconnected, contradictory, or visually inconsistent with the front.
═══════════════════════════════════════════════════════════════════
📷 STEP 1: ANALYZE THE FABRIC IMAGE
═══════════════════════════════════════════════════════════════════

Look at the attached fabric image and identify:
• Fabric Type (satin, silk, chiffon, velvet, lace, organza, crepe, tulle, etc.)
• Texture (smooth, textured, embroidered, beaded)
• Weight & Drape (lightweight/flowing, medium/structured, heavy/luxurious)
• Colors (primary, secondary, solid/gradient/patterned)
• Pattern (plain, floral, geometric, abstract, traditional motifs)
• Sheen (matte, subtle sheen, high shine)

Your design choices MUST complement these fabric characteristics.

═══════════════════════════════════════════════════════════════════
🎯 FABRIC INSTRUCTION (HIGHEST PRIORITY)
═══════════════════════════════════════════════════════════════════

${fabricInstruction}

The fabric should drape naturally and realistically with proper folds and textile behavior.

${questionnaireInstructions}
═══════════════════════════════════════════════════════════════════
🎨 DESIGN VARIETY REQUIREMENTS
═══════════════════════════════════════════════════════════════════

Each of the 5 designs MUST be distinctly different in the following aspects:

• Silhouette (Cut / Shape)

Choose from a wide range of evening-appropriate silhouettes, such as:

A-line
Mermaid / Fishtail
Ball Gown
Column
Fit-and-Flare
Trumpet
Empire Waist
Asymmetrical Cut
Sculpted Corset Silhouette
Draped Grecian Silhouette

• Neckline

Each design must feature a different neckline, including but not limited to:
V-neck
Deep Plunging V
Sweetheart
Straight Strapless
Asymmetrical One-Shoulder
Off-Shoulder
Halter Neck
High Neck
Illusion Neckline
Square Neck
Draped Cowl Neck

• Sleeve Style

Sleeve treatments must vary clearly between designs:
Sleeveless
Cap Sleeves
Long Fitted Sleeves
Sheer Long Sleeves
Bell Sleeves
Bishop Sleeves
Puff Sleeves
Off-Shoulder Sleeves
Draped Sleeves
One-Sleeve Design

• Skirt Shape

The skirt construction must differ significantly across designs:
Straight / Column Skirt
Flowing A-line Skirt
Fully Layered Skirt
Soft Tulle Volume
High Slit Skirt
Wrap Skirt
High-Low Hem
Overskirt
Draped Skirt
Sculpted Structured Skirt

• Embellishment Placement & Intensity

Embellishment must vary in both placement and density:
Minimal embroidery concentrated at bodice
Vertical embroidery elongating the silhouette
Gradient embellishment fading toward the hem
Asymmetrical embellishment placement
Heavy embellishment on bodice with clean skirt
Scattered crystal or bead detailing
Tone-on-tone embroidery for subtle luxury

❌ DO NOT create variations of the same dress.
✔️ Each design must feel like a completely unique evening gown vision

═══════════════════════════════════════════════════════════════════
✏️ OUTPUT FORMAT (MANDATORY - Follow EXACTLY)
═══════════════════════════════════════════════════════════════════

===DESIGN_1===
**Design Specs:** Type: [X] | Length: [X] | Style: [X] | Back: [X]  Silhouette: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Neckline: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Sleeve Style: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Skirt Shape: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Embellishment Placement & Intensity: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]


**Front View:** [3-4 detailed sentences: neckline, bodice construction, waist definition, skirt shape, embellishment placement, how the fabric drapes and moves]

**Back View:** [3-4 detailed sentences: back neckline style, closure type (hidden zipper/buttons/corset lacing), back embellishments, train details if applicable, how it complements the front]
===END_DESIGN_1===

===DESIGN_2===
**Design Specs:** Type: [X] | Length: [X] | Style: [X] | Back: [X]  Silhouette: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Neckline: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Sleeve Style: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Skirt Shape: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Embellishment Placement & Intensity: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]

**Front View:** [Completely different design approach]

**Back View:** [Complementary back design]
===END_DESIGN_2===

===DESIGN_3===
**Design Specs:** Type: [X] | Length: [X] | Style: [X] | Back: [X]  Silhouette: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Neckline: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Sleeve Style: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Skirt Shape: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Embellishment Placement & Intensity: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]

**Front View:** [Another unique vision]

**Back View:** [Matching back design]
===END_DESIGN_3===

===DESIGN_4===
**Design Specs:** Type: [X] | Length: [X] | Style: [X] | Back: [X]  Silhouette: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Neckline: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Sleeve Style: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Skirt Shape: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Embellishment Placement & Intensity: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]

**Front View:** [Distinct design direction]

**Back View:** [Complementary back]
===END_DESIGN_4===

===DESIGN_5===
**Design Specs:** Type: [X] | Length: [X] | Style: [X] | Back: [X]  Silhouette: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Neckline: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Sleeve Style: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Skirt Shape: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]
Embellishment Placement & Intensity: [Choose from the DESIGN VARIETY REQUIREMENTS section. The selected option must be appropriate for the provided fabric image and aligned with the overall design concept.]

**Front View:** [Final unique creation]

**Back View:** [Stunning back design]
===END_DESIGN_5===

═══════════════════════════════════════════════════════════════════
⚠️ ABSOLUTE RULES
═══════════════════════════════════════════════════════════════════

1. OUTPUT ALL 5 DESIGNS - Missing designs = failure
2. USE EXACT MARKERS: ===DESIGN_X=== and ===END_DESIGN_X===
3. INCLUDE BOTH Front View AND Back View for each design
4. DESCRIBE ONLY THE DRESS - no background, mannequin, lighting, or camera
5. FOLLOW CLIENT PREFERENCES exactly as specified above (🔒=fixed, 📊=distribute)
6. FOR SKIPPED QUESTIONS (⚡), generate creative choices based on the fabric
7. Each design must be coherent: all elements should work together harmoniously
8. Write like an elite fashion designer describing couture masterpieces

═══════════════════════════════════════════════════════════════════
✅ FINAL CHECKLIST
═══════════════════════════════════════════════════════════════════

Before submitting, verify:
☑ Design 1 complete with ===DESIGN_1=== and ===END_DESIGN_1=== markers
☑ Design 2 complete with ===DESIGN_2=== and ===END_DESIGN_2=== markers
☑ Design 3 complete with ===DESIGN_3=== and ===END_DESIGN_3=== markers
☑ Design 4 complete with ===DESIGN_4=== and ===END_DESIGN_4=== markers
☑ Design 5 complete with ===DESIGN_5=== and ===END_DESIGN_5=== markers
☑ Client preferences followed (fixed items appear in ALL designs)
☑ All 5 designs are visually distinct from each other
☑ Each design has both Front View and Back View

Now analyze the attached fabric image and generate ALL 5 unique designs:`;
}
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 [${requestId}] بدء طلب توليد 5 تصاميم`);
  console.log(`${'='.repeat(60)}`);

  try {
    const body: GenerateMultiplePromptsRequest = await request.json();
    const {
      primaryFabricImage,
      secondaryFabricImage,
      primaryFabricPlacement,
      secondaryFabricPlacement,
      batchQuestionnaireAnswers
    } = body;

    // تسجيل تفاصيل الطلب
    console.log(`📍 [${requestId}] موضع القماش الأساسي: ${primaryFabricPlacement || 'غير محدد'}`);
    console.log(`📍 [${requestId}] موضع القماش الثانوي: ${secondaryFabricPlacement || 'غير محدد'}`);
    console.log(`🖼️ [${requestId}] صورة ثانوية: ${secondaryFabricImage ? 'نعم' : 'لا'}`);

    // التحقق من وجود صورة القماش الأساسي
    if (!primaryFabricImage) {
      console.error(`❌ [${requestId}] خطأ: لا توجد صورة قماش`);
      return NextResponse.json(
        { error: 'يرجى رفع صورة القماش أولاً' } as GenerateMultiplePromptsResponse,
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error(`❌ [${requestId}] خطأ: مفتاح API غير موجود`);
      return NextResponse.json(
        { error: 'مفتاح OpenRouter API غير موجود' } as GenerateMultiplePromptsResponse,
        { status: 500 }
      );
    }

    // طباعة إجابات الاستبيان إذا وُجدت
    if (batchQuestionnaireAnswers) {
      console.log(`📋 [${requestId}] إجابات الاستبيان:`);
      console.log(`   - أنواع الفساتين: ${batchQuestionnaireAnswers.dressTypes?.join(', ') || 'لم يُحدد'}`);
      console.log(`   - أطوال الفساتين: ${batchQuestionnaireAnswers.dressLengths?.join(', ') || 'لم يُحدد'}`);
      console.log(`   - الزينة: ${batchQuestionnaireAnswers.embellishments?.join(', ') || 'لم يُحدد'}`);
      console.log(`   - أساليب التصميم: ${batchQuestionnaireAnswers.designStyles?.join(', ') || 'لم يُحدد'}`);
      console.log(`   - شكل الظهر: ${batchQuestionnaireAnswers.backStyles?.join(', ') || 'لم يُحدد'}`);
    } else {
      console.log(`📋 [${requestId}] لا توجد إجابات استبيان (تخطى المستخدم)`);
    }

    // بناء البرومبت لتوليد 5 تصاميم
    const hasSecondaryFabric = !!secondaryFabricImage;
    const systemPrompt = buildMultiDesignPrompt(
      primaryFabricPlacement,
      secondaryFabricPlacement,
      hasSecondaryFabric,
      batchQuestionnaireAnswers
    );
    console.log(`📝 [${requestId}] طول البرومبت: ${systemPrompt.length} حرف`);

    // نظام إعادة المحاولة
    let generatedText = '';
    let lastError: Error | null = null;
    const maxRetries = 3;
    const retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🎨 محاولة ${attempt}/${maxRetries} لتوليد 5 برومبتات...`);

        // بناء محتوى الرسالة مع الصور (multimodal)
        const messageContent: any[] = [
          {
            type: 'text',
            text: systemPrompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: primaryFabricImage, // Base64 data URL
            },
          },
        ];

        // إضافة الصورة الثانية إذا وُجدت
        if (secondaryFabricImage) {
          messageContent.push({
            type: 'image_url',
            image_url: {
              url: secondaryFabricImage,
            },
          });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://yasmine-al-sham-designer.com',
            'X-Title': 'Yasmine Al-Sham Smart Designer - Multi Design',
          },
          body: JSON.stringify({
            model: 'openai/gpt-5-mini', // نموذج GPT-5 Mini (يدعم الصور)
            messages: [
              {
                role: 'user',
                content: messageContent,
              },
            ],
            max_tokens: 4000, // زيادة الحد لاستيعاب 5 تصاميم
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
          generatedText = data.choices[0].message.content.trim();
          console.log('✅ تم توليد النص بنجاح');

          // طباعة النص الخام الكامل لفحص المشكلة
          console.log(`\n${'🔍'.repeat(40)}`);
          console.log(`📜 النص الخام المُولد من AI (كامل):`);
          console.log(`${'🔍'.repeat(40)}`);
          console.log(generatedText);
          console.log(`${'🔍'.repeat(40)}\n`);

          break;
        } else {
          throw new Error('لا توجد استجابة من OpenRouter API');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ محاولة ${attempt}/${maxRetries} فشلت:`, lastError.message);

        if (attempt < maxRetries) {
          console.log(`⏳ انتظار ${retryDelay}ms قبل المحاولة التالية...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // إذا فشلت جميع المحاولات
    if (!generatedText) {
      const errorMessage = lastError?.message.includes('503') || lastError?.message.includes('overloaded')
        ? 'الخدمة مزدحمة حالياً. يرجى المحاولة مرة أخرى بعد قليل.'
        : lastError?.message || 'فشل في توليد البرومبتات';

      return NextResponse.json(
        { error: errorMessage } as GenerateMultiplePromptsResponse,
        { status: 503 }
      );
    }

    // فصل البرومبتات الخمسة من النص المُولد
    const parseResult = parseMultiplePrompts(generatedText);
    let finalPrompts = parseResult.prompts;

    console.log(`📊 نتيجة التحليل: ${finalPrompts.length} تصاميم باستخدام طريقة "${parseResult.method}"`);

    // التحقق من استخراج جميع البرومبتات
    if (finalPrompts.length < 5) {
      console.warn(`⚠️ تم استخراج ${finalPrompts.length} برومبت فقط من 5`);
      console.log('📜 النص الخام المُولد (أول 1000 حرف):');
      console.log(parseResult.rawText.substring(0, 1000));

      // إذا استخرجنا أقل من 5، نحاول تكملة الباقي بتكرار آخر تصميم مع تعديلات
      if (finalPrompts.length > 0 && finalPrompts.length < 5) {
        console.log(`🔄 محاولة تكملة ${5 - finalPrompts.length} تصاميم ناقصة...`);
        const lastPrompt = finalPrompts[finalPrompts.length - 1];
        const variations = [
          'with a more dramatic silhouette and enhanced embellishments',
          'with a simpler, more elegant approach',
          'with a bolder, more modern interpretation',
          'with a romantic, flowing design',
          'with a structured, architectural feel'
        ];

        while (finalPrompts.length < 5) {
          const variationIndex = finalPrompts.length - 1;
          const variation = variations[variationIndex % variations.length];
          // إنشاء تصميم جديد بناءً على الأخير مع تعديل
          const newPrompt = `${lastPrompt}\n\n[VARIATION: This design features ${variation}]`;
          finalPrompts.push(newPrompt);
          console.log(`➕ أضيف تصميم بديل ${finalPrompts.length}`);
        }
      }
    }

    // تسجيل النتيجة النهائية
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ [${requestId}] اكتمل التوليد بنجاح`);
    console.log(`📊 [${requestId}] النتيجة النهائية:`);
    console.log(`   - عدد التصاميم: ${finalPrompts.length}/5`);
    console.log(`   - طريقة التحليل: ${parseResult.method}`);
    console.log(`   - تم إكمال تصاميم ناقصة: ${parseResult.prompts.length < 5 ? 'نعم' : 'لا'}`);
    console.log(`${'='.repeat(80)}\n`);

    // طباعة البرومبتات الخمسة الكاملة
    console.log(`\n${'🎨'.repeat(40)}`);
    console.log(`📋 البرومبتات الخمسة المُولدة (التي سترسل لتوليد الصور):`);
    console.log(`${'🎨'.repeat(40)}\n`);

    finalPrompts.forEach((prompt, index) => {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`🎯 التصميم ${index + 1} من 5`);
      console.log(`${'─'.repeat(60)}`);
      console.log(prompt);
      console.log(`${'─'.repeat(60)}\n`);
    });

    console.log(`\n${'🎨'.repeat(40)}`);
    console.log(`✅ نهاية البرومبتات الخمسة`);
    console.log(`${'🎨'.repeat(40)}\n`);

    return NextResponse.json({
      prompts: finalPrompts,
    } as GenerateMultiplePromptsResponse);

  } catch (error) {
    console.error(`\n${'='.repeat(60)}`);
    console.error(`❌ [${requestId}] خطأ في توليد البرومبتات:`, error);
    console.error(`${'='.repeat(60)}\n`);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء توليد البرومبتات',
      } as GenerateMultiplePromptsResponse,
      { status: 500 }
    );
  }
}

