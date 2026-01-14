import { NextRequest, NextResponse } from 'next/server';
import type { 
  GenerateMultiplePromptsRequest, 
  GenerateMultiplePromptsResponse 
} from '@/types';

/**
 * دالة لفصل البرومبتات الخمسة من النص المُولد
 * تستخدم علامات فاصلة واضحة لضمان الفصل الدقيق
 */
function parseMultiplePrompts(generatedText: string): string[] {
  const prompts: string[] = [];
  
  // استخدام تعبير نمطي لاستخراج كل تصميم
  for (let i = 1; i <= 5; i++) {
    const startMarker = `===DESIGN_${i}===`;
    const endMarker = `===END_DESIGN_${i}===`;
    
    const startIndex = generatedText.indexOf(startMarker);
    const endIndex = generatedText.indexOf(endMarker);
    
    if (startIndex !== -1 && endIndex !== -1) {
      const promptContent = generatedText
        .substring(startIndex + startMarker.length, endIndex)
        .trim();
      
      if (promptContent) {
        prompts.push(promptContent);
      }
    }
  }
  
  return prompts;
}

/**
 * بناء البرومبت الرئيسي الذي سيُرسل للذكاء الاصطناعي لتوليد 5 تصاميم مختلفة
 * يعتمد على تحليل صورة القماش لاختيار التصاميم المناسبة
 */
function buildMultiDesignPrompt(
  primaryFabricPlacement?: string,
  secondaryFabricPlacement?: string,
  hasSecondaryFabric?: boolean
): string {
  const primaryPlacement = primaryFabricPlacement || 'the entire dress';

  // تعليمات القماش المخصص
  let fabricInstruction = '';
  if (hasSecondaryFabric && secondaryFabricPlacement) {
    fabricInstruction = `"Use the exact fabric pattern, texture, and colors shown in the attached PRIMARY fabric image for ${primaryPlacement}. Use the SECONDARY fabric for ${secondaryFabricPlacement}. Do NOT modify, recolor, or alter the fabric designs in any way. Apply both fabrics with photorealistic precision maintaining all original details, including pattern repeats, texture depth, and color accuracy. The fabrics should drape naturally and realistically on the dress."`;
  } else {
    fabricInstruction = `"Use the exact fabric pattern, texture, and colors shown in the attached fabric image for ${primaryPlacement}. Do NOT modify, recolor, or alter the fabric design in any way. Apply it with photorealistic precision maintaining all original details, including the pattern repeat, texture depth, and color accuracy. The fabric should drape naturally and realistically on the dress."`;
  }

  return `You are an elite couture fashion designer AI. Your task is to generate 5 COMPLETELY DIFFERENT and UNIQUE dress designs based on your analysis of the client's provided fabric image.

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

- Describe the DRESS ONLY - no background, environment, mannequin, lighting, or camera
- Write in the tone of an elite fashion designer describing couture masterpieces
- Be precise and technical in fabric behavior and construction details
- Each design must feel like a unique, complete vision optimized for THIS specific fabric
- Do NOT repeat the same combinations between designs
- The fabric's characteristics should influence every design decision

Now analyze the attached fabric image and generate 5 unique designs:`;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateMultiplePromptsRequest = await request.json();
    const {
      primaryFabricImage,
      secondaryFabricImage,
      primaryFabricPlacement,
      secondaryFabricPlacement
    } = body;

    // التحقق من وجود صورة القماش الأساسي
    if (!primaryFabricImage) {
      return NextResponse.json(
        { error: 'يرجى رفع صورة القماش أولاً' } as GenerateMultiplePromptsResponse,
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'مفتاح OpenRouter API غير موجود' } as GenerateMultiplePromptsResponse,
        { status: 500 }
      );
    }

    // بناء البرومبت لتوليد 5 تصاميم
    const hasSecondaryFabric = !!secondaryFabricImage;
    const systemPrompt = buildMultiDesignPrompt(
      primaryFabricPlacement,
      secondaryFabricPlacement,
      hasSecondaryFabric
    );

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
    const prompts = parseMultiplePrompts(generatedText);

    // التحقق من استخراج جميع البرومبتات
    if (prompts.length < 5) {
      console.warn(`⚠️ تم استخراج ${prompts.length} برومبت فقط من 5`);
      
      // إذا لم نستخرج أي برومبت، حاول تقسيم النص بطريقة بديلة
      if (prompts.length === 0) {
        // محاولة تقسيم بديلة باستخدام أرقام
        const alternativePrompts = generatedText
          .split(/Design\s*[1-5]:|DESIGN\s*[1-5]:/i)
          .filter(p => p.trim().length > 50)
          .slice(0, 5);
        
        if (alternativePrompts.length > 0) {
          return NextResponse.json({
            prompts: alternativePrompts.map(p => p.trim()),
          } as GenerateMultiplePromptsResponse);
        }
      }
    }

    console.log(`✅ تم استخراج ${prompts.length} برومبتات بنجاح`);

    return NextResponse.json({
      prompts,
    } as GenerateMultiplePromptsResponse);

  } catch (error) {
    console.error('❌ خطأ في توليد البرومبتات:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء توليد البرومبتات',
      } as GenerateMultiplePromptsResponse,
      { status: 500 }
    );
  }
}

