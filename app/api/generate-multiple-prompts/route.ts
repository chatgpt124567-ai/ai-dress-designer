import { NextRequest, NextResponse } from 'next/server';
import type {
  GenerateMultiplePromptsRequest,
  GenerateMultiplePromptsResponse,
  BatchDesignQuestionnaireAnswers
} from '@/types';

/**
 * دالة لفصل البرومبتات الخمسة من النص المُولد
 * تستخدم عدة طرق للتحليل لضمان استخراج أكبر عدد ممكن من التصاميم
 */
function parseMultiplePrompts(generatedText: string): { prompts: string[]; rawText: string; method: string } {
  console.log('📝 بدء تحليل النص المُولد...');
  console.log(`📏 طول النص: ${generatedText.length} حرف`);

  // الطريقة 1: استخدام العلامات الدقيقة
  let prompts = parseWithExactMarkers(generatedText);
  if (prompts.length === 5) {
    console.log('✅ الطريقة 1 (علامات دقيقة): نجحت - 5 تصاميم');
    return { prompts, rawText: generatedText, method: 'exact_markers' };
  }
  console.log(`⚠️ الطريقة 1: استخرجت ${prompts.length} تصاميم فقط`);

  // الطريقة 2: استخدام regex مرن
  const regexPrompts = parseWithFlexibleRegex(generatedText);
  if (regexPrompts.length > prompts.length) {
    prompts = regexPrompts;
    if (prompts.length === 5) {
      console.log('✅ الطريقة 2 (regex مرن): نجحت - 5 تصاميم');
      return { prompts, rawText: generatedText, method: 'flexible_regex' };
    }
  }
  console.log(`⚠️ الطريقة 2: استخرجت ${prompts.length} تصاميم`);

  // الطريقة 3: تقسيم بناءً على أنماط Design
  const patternPrompts = parseWithDesignPatterns(generatedText);
  if (patternPrompts.length > prompts.length) {
    prompts = patternPrompts;
    if (prompts.length === 5) {
      console.log('✅ الطريقة 3 (أنماط Design): نجحت - 5 تصاميم');
      return { prompts, rawText: generatedText, method: 'design_patterns' };
    }
  }
  console.log(`⚠️ الطريقة 3: استخرجت ${prompts.length} تصاميم`);

  // الطريقة 4: تقسيم بناءً على الأرقام
  const numberedPrompts = parseWithNumberedSections(generatedText);
  if (numberedPrompts.length > prompts.length) {
    prompts = numberedPrompts;
    if (prompts.length === 5) {
      console.log('✅ الطريقة 4 (أقسام مرقمة): نجحت - 5 تصاميم');
      return { prompts, rawText: generatedText, method: 'numbered_sections' };
    }
  }
  console.log(`⚠️ الطريقة 4: استخرجت ${prompts.length} تصاميم`);

  console.log(`📊 النتيجة النهائية: ${prompts.length} تصاميم من 5`);
  return { prompts, rawText: generatedText, method: 'best_effort' };
}

// الطريقة 1: العلامات الدقيقة
function parseWithExactMarkers(text: string): string[] {
  const prompts: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const startMarker = `===DESIGN_${i}===`;
    const endMarker = `===END_DESIGN_${i}===`;
    const startIndex = text.indexOf(startMarker);
    const endIndex = text.indexOf(endMarker);
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const content = text.substring(startIndex + startMarker.length, endIndex).trim();
      if (content.length > 50) prompts.push(content);
    }
  }
  return prompts;
}

// الطريقة 2: Regex مرن (يتعامل مع اختلافات المسافات)
function parseWithFlexibleRegex(text: string): string[] {
  const prompts: string[] = [];
  for (let i = 1; i <= 5; i++) {
    // regex مرن يتعامل مع مسافات ونقاط وأقواس
    const regex = new RegExp(
      `={2,}\\s*DESIGN[_\\s-]*${i}\\s*={2,}([\\s\\S]*?)={2,}\\s*END[_\\s-]*DESIGN[_\\s-]*${i}\\s*={2,}`,
      'i'
    );
    const match = text.match(regex);
    if (match && match[1] && match[1].trim().length > 50) {
      prompts.push(match[1].trim());
    }
  }
  return prompts;
}

// الطريقة 3: أنماط Design
function parseWithDesignPatterns(text: string): string[] {
  // تقسيم بناءً على عناوين Design مختلفة
  const patterns = [
    /Design\s*#?\s*(\d)\s*[:\-–—]/gi,
    /DESIGN\s*#?\s*(\d)\s*[:\-–—]/gi,
    /\*\*Design\s*#?\s*(\d)\*\*/gi,
    /#{1,3}\s*Design\s*#?\s*(\d)/gi,
  ];

  for (const pattern of patterns) {
    const parts = text.split(pattern).filter(p => p.trim().length > 0);
    // إزالة الأرقام المنفردة من التقسيم
    const validParts = parts.filter(p => !/^\d$/.test(p.trim()) && p.trim().length > 50);
    if (validParts.length >= 5) {
      return validParts.slice(0, 5).map(p => p.trim());
    }
  }

  return [];
}

// الطريقة 4: أقسام مرقمة
function parseWithNumberedSections(text: string): string[] {
  // البحث عن أنماط ترقيم مختلفة
  const splitPatterns = [
    /(?:^|\n)\s*(?:\d+[\.\)\-:]|\*\*\d+\*\*)\s*/,
    /(?:^|\n)\s*Design\s+\d+/i,
    /(?:^|\n)\s*#{1,3}\s*\d+/,
  ];

  for (const pattern of splitPatterns) {
    const parts = text.split(pattern).filter(p => p.trim().length > 100);
    if (parts.length >= 5) {
      return parts.slice(0, 5).map(p => p.trim());
    }
  }

  // محاولة أخيرة: تقسيم على أساس الفقرات الكبيرة
  const paragraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 150);
  if (paragraphs.length >= 5) {
    return paragraphs.slice(0, 5).map(p => p.trim());
  }

  return [];
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
    long: 'long/floor-length',
    floor: 'floor-length',
    train: 'with train',
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
  } as Record<string, string>,
  designStyles: {
    classic: 'classic',
    modern: 'modern',
    romantic: 'romantic',
    glamorous: 'glamorous',
    boho: 'boho',
    dramatic: 'dramatic',
    minimalist: 'minimalist',
  } as Record<string, string>,
};

/**
 * بناء تعليمات الاستبيان المخصص للإضافة على البرومبت
 */
function buildQuestionnaireInstructions(answers?: BatchDesignQuestionnaireAnswers): string {
  if (!answers) return '';

  const instructions: string[] = [];

  // نوع الفستان
  if (answers.dressTypes && answers.dressTypes.length > 0) {
    const types = answers.dressTypes.map(t => translationMaps.dressTypes[t] || t).join(', ');
    instructions.push(`- **DRESS TYPES to include across the 5 designs:** ${types}`);
  }

  // طول الفستان
  if (answers.dressLengths && answers.dressLengths.length > 0) {
    const lengths = answers.dressLengths.map(l => translationMaps.dressLengths[l] || l).join(', ');
    instructions.push(`- **DRESS LENGTHS to distribute across designs:** ${lengths}`);
  }

  // الزينة
  if (answers.embellishments && answers.embellishments.length > 0) {
    const embs = answers.embellishments.map(e => translationMaps.embellishments[e] || e).join(', ');
    instructions.push(`- **EMBELLISHMENTS to incorporate:** ${embs}`);
  }

  // أسلوب التصميم
  if (answers.designStyles && answers.designStyles.length > 0) {
    const styles = answers.designStyles.map(s => translationMaps.designStyles[s] || s).join(', ');
    instructions.push(`- **DESIGN STYLES to express:** ${styles}`);
  }

  if (instructions.length === 0) return '';

  return `
═══════════════════════════════════════════════════════════════════
CLIENT PREFERENCES (MUST BE INCLUDED IN THE 5 DESIGNS)
═══════════════════════════════════════════════════════════════════

The client has specified the following preferences. You MUST distribute these choices across the 5 designs:

${instructions.join('\n')}

**IMPORTANT:** Make sure each of the selected options appears in at least one design. If the client selected 3 dress lengths (e.g., long, knee-length, with train), the 5 designs should include these 3 lengths distributed among them.

`;
}

/**
 * بناء البرومبت الرئيسي الذي سيُرسل للذكاء الاصطناعي لتوليد 5 تصاميم مختلفة
 * يعتمد على تحليل صورة القماش لاختيار التصاميم المناسبة
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
    fabricInstruction = `"Use the exact fabric pattern, texture, and colors shown in the attached PRIMARY fabric image for ${primaryPlacement}. Use the SECONDARY fabric for ${secondaryFabricPlacement}. Do NOT modify, recolor, or alter the fabric designs in any way. Apply both fabrics with photorealistic precision maintaining all original details, including pattern repeats, texture depth, and color accuracy. The fabrics should drape naturally and realistically on the dress."`;
  } else {
    fabricInstruction = `"Use the exact fabric pattern, texture, and colors shown in the attached fabric image for ${primaryPlacement}. Do NOT modify, recolor, or alter the fabric design in any way. Apply it with photorealistic precision maintaining all original details, including the pattern repeat, texture depth, and color accuracy. The fabric should drape naturally and realistically on the dress."`;
  }

  return `You are an elite couture fashion designer AI. Your task is to generate EXACTLY 5 COMPLETELY DIFFERENT and UNIQUE dress designs based on your analysis of the client's provided fabric image.

⚠️ CRITICAL REQUIREMENT: You MUST generate ALL 5 DESIGNS. Do not stop after 3 or 4 designs. The output is incomplete unless it contains all 5 designs with their proper markers.

═══════════════════════════════════════════════════════════════════
STEP 1: FABRIC ANALYSIS (Do this first)
═══════════════════════════════════════════════════════════════════

Before designing, carefully analyze the attached fabric image and identify:
- **Fabric Type**: Is it satin, silk, chiffon, velvet, lace, organza, crepe, tulle, or another material?
- **Texture**: Is it smooth, textured, embroidered, beaded, or has special surface treatment?
- **Weight & Drape**: Is it lightweight and flowing, medium-weight structured, or heavy and luxurious?
- **Colors**: What are the primary and secondary colors? Is it solid, gradient, or patterned?
- **Pattern**: Is it plain, floral, geometric, abstract, traditional, or has special motifs?
- **Sheen Level**: Is it matte, subtle sheen, or high shine?

Use this analysis to select the most suitable design elements for each of the 5 designs.

═══════════════════════════════════════════════════════════════════
STEP 2: DESIGN DECISIONS (Choose based on fabric analysis)
═══════════════════════════════════════════════════════════════════

For each design, you must decide on the following elements. Choose what works BEST with the analyzed fabric:

**1. DRESS LENGTH**
Choose the most suitable length based on fabric weight and drape.

**2. SKIRT SHAPE**
Choose a shape that complements the fabric's characteristics and movement.

**3. NECKLINE TYPE**
Select a neckline that enhances the fabric's beauty and suits the overall design.

**4. SLEEVE TYPE**
Pick sleeves that work harmoniously with the fabric texture and weight.

**5. EMBELLISHMENTS & DETAILS**
Decide on decorative elements that enhance without overwhelming the fabric.

**6. DESIGN STYLE**
Choose an overall aesthetic direction that maximizes the fabric's potential.



═══════════════════════════════════════════════════════════════════
COHERENCE RULES
═══════════════════════════════════════════════════════════════════

Each design must be internally consistent:
- If the fabric is delicate/lightweight → prefer flowing silhouettes
- If the fabric is structured/heavy → can support dramatic shapes
- If the fabric has bold patterns → use simpler silhouettes
- If the fabric is plain → can add more embellishments
- Sleeves, neckline, and skirt must work together harmoniously
- Design style must match all chosen elements

═══════════════════════════════════════════════════════════════════
CRITICAL CUSTOM FABRIC INSTRUCTION (MUST BE IN EVERY DESIGN)
═══════════════════════════════════════════════════════════════════

${fabricInstruction}

${buildQuestionnaireInstructions(questionnaireAnswers)}
═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT - Follow this EXACT structure
═══════════════════════════════════════════════════════════════════

===DESIGN_1===
**Fabric Analysis Applied:** [Brief note on how this design suits the fabric]
**Design Choices:** Length: [X] | Skirt: [X] | Neckline: [X] | Sleeves: [X] | Embellishments: [X] | Style: [X]

[Write 4-6 sentences of detailed couture-level description. Focus on: how the specific fabric will drape in this silhouette, the proportions, neckline details, sleeve construction, skirt shape and movement, embellishment placement if any, and overall aesthetic. Write as an elite fashion designer describing a masterpiece.]
===END_DESIGN_1===

===DESIGN_2===
**Fabric Analysis Applied:** [Brief note on how this design suits the fabric]
**Design Choices:** Length: [X] | Skirt: [X] | Neckline: [X] | Sleeves: [X] | Embellishments: [X] | Style: [X]

[Write 4-6 sentences - completely different design approach]
===END_DESIGN_2===

===DESIGN_3===
**Fabric Analysis Applied:** [Brief note on how this design suits the fabric]
**Design Choices:** Length: [X] | Skirt: [X] | Neckline: [X] | Sleeves: [X] | Embellishments: [X] | Style: [X]

[Write 4-6 sentences - another unique vision]
===END_DESIGN_3===

===DESIGN_4===
**Fabric Analysis Applied:** [Brief note on how this design suits the fabric]
**Design Choices:** Length: [X] | Skirt: [X] | Neckline: [X] | Sleeves: [X] | Embellishments: [X] | Style: [X]

[Write 4-6 sentences - distinct design direction]
===END_DESIGN_4===

===DESIGN_5===
**Fabric Analysis Applied:** [Brief note on how this design suits the fabric]
**Design Choices:** Length: [X] | Skirt: [X] | Neckline: [X] | Sleeves: [X] | Embellishments: [X] | Style: [X]

[Write 4-6 sentences - final unique creation]
===END_DESIGN_5===

═══════════════════════════════════════════════════════════════════
IMPORTANT RULES
═══════════════════════════════════════════════════════════════════

- ⚠️ YOU MUST OUTPUT ALL 5 DESIGNS - THIS IS MANDATORY
- Describe the DRESS ONLY - no background, environment, mannequin, lighting, or camera
- Write in the tone of an elite fashion designer describing couture masterpieces
- Be precise and technical in fabric behavior and construction details
- Each design must feel like a unique, complete vision optimized for THIS specific fabric
- Do NOT repeat the same combinations between designs
- The fabric's characteristics should influence every design decision
- Use EXACTLY the format shown above with ===DESIGN_X=== and ===END_DESIGN_X=== markers

═══════════════════════════════════════════════════════════════════
FINAL CHECK BEFORE SUBMITTING
═══════════════════════════════════════════════════════════════════

Before finishing, verify you have included:
✓ ===DESIGN_1=== ... ===END_DESIGN_1===
✓ ===DESIGN_2=== ... ===END_DESIGN_2===
✓ ===DESIGN_3=== ... ===END_DESIGN_3===
✓ ===DESIGN_4=== ... ===END_DESIGN_4===
✓ ===DESIGN_5=== ... ===END_DESIGN_5===

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
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ [${requestId}] اكتمل التوليد بنجاح`);
    console.log(`📊 [${requestId}] النتيجة النهائية:`);
    console.log(`   - عدد التصاميم: ${finalPrompts.length}/5`);
    console.log(`   - طريقة التحليل: ${parseResult.method}`);
    console.log(`   - تم إكمال تصاميم ناقصة: ${parseResult.prompts.length < 5 ? 'نعم' : 'لا'}`);
    finalPrompts.forEach((p, i) => {
      console.log(`   - تصميم ${i + 1}: ${p.substring(0, 80)}...`);
    });
    console.log(`${'='.repeat(60)}\n`);

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

