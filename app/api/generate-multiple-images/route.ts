import { NextRequest, NextResponse } from 'next/server';
import type {
  GenerateMultipleImagesRequest,
  GenerateMultipleImagesResponse,
  SingleImageResult
} from '@/types';

/**
 * بناء تعليمات القماش بناءً على عدد الصور المرفقة
 */
function buildFabricInstruction(hasPrimaryFabric: boolean, hasSecondaryFabric: boolean): string {
  if (hasPrimaryFabric && hasSecondaryFabric) {
    return `

═══════════════════════════════════════════════════════════════════
🎯 FABRIC INSTRUCTION (CRITICAL - HIGHEST PRIORITY)
═══════════════════════════════════════════════════════════════════

The client has provided TWO custom fabric images (attached below).

**PRIMARY FABRIC (First Image):**
• You MUST use the EXACT fabric pattern, texture, colors, and design from the FIRST attached image
• Apply to the areas specified in the design description
• PRESERVE the original pattern scale, color saturation, and texture depth

**SECONDARY FABRIC (Second Image):**
• You MUST use the EXACT fabric pattern, texture, colors, and design from the SECOND attached image
• Apply to the accent areas specified in the design description

**STRICT RULES - VIOLATION IS UNACCEPTABLE:**
• Do NOT modify, recolor, lighten, darken, or alter the fabric in ANY way
• Do NOT invent new patterns or change the existing pattern
• Do NOT distort the fabric's original appearance
• The fabric must look IDENTICAL to the reference image when applied to the dress
• Drape the fabric naturally with realistic folds and textile behavior
• Ensure pattern alignment at seams looks professionally tailored`;
  } else if (hasPrimaryFabric) {
    return `

═══════════════════════════════════════════════════════════════════
🎯 FABRIC INSTRUCTION (CRITICAL - HIGHEST PRIORITY)
═══════════════════════════════════════════════════════════════════

The client has provided a custom fabric image (attached below).

**FABRIC APPLICATION RULES:**
• You MUST use the EXACT fabric pattern, texture, colors, and design from the attached image
• PRESERVE the original pattern scale, color saturation, and texture depth
• Apply to the entire dress or as specified in the design description

**STRICT RULES - VIOLATION IS UNACCEPTABLE:**
• Do NOT modify, recolor, lighten, darken, or alter the fabric in ANY way
• Do NOT invent new patterns or change the existing pattern
• Do NOT distort the fabric's original appearance
• The fabric must look IDENTICAL to the reference image when applied to the dress
• Drape the fabric naturally with realistic folds and textile behavior
• Ensure pattern alignment at seams looks professionally tailored
• The custom fabric is the STAR of this design - treat it with utmost precision`;
  }
  return '';
}

/**
 * توليد صورة واحدة باستخدام البرومبت وصورة القماش
 * يستخدم نفس البرومبت الأساسي من generate-image مع إضافة dual-view
 */
async function generateSingleImage(
  prompt: string,
  index: number,
  primaryFabricImage: string,
  secondaryFabricImage?: string,
  model: string = 'google/gemini-3.1-flash-image-preview'
): Promise<SingleImageResult> {
  try {
    // بناء تعليمات القماش
    const customFabricInstruction = buildFabricInstruction(!!primaryFabricImage, !!secondaryFabricImage);

    // البرومبت الكامل مع اللوجو والخلفية + dual-view
    const imagePrompt = `Generate a high-quality, fully coherent fashion design image of a dress based on the following enhanced client description:

${prompt}${customFabricInstruction}

---

═══════════════════════════════════════════════════════════════════
🎯 CRITICAL: FRONT & BACK DESIGN CONSISTENCY
═══════════════════════════════════════════════════════════════════

**THIS IS THE SAME DRESS - FRONT AND BACK MUST MATCH PERFECTLY:**

The front view and back view show THE EXACT SAME GARMENT from different angles. They MUST be perfectly consistent:

**SLEEVES CONSISTENCY (CRITICAL):**
• If front has sleeves → back MUST show the same sleeves from behind
• If front has cap sleeves → back shows cap sleeves covering the shoulders
• If front has long sleeves → back shows long sleeves running down the arms
• If front is sleeveless → back is also sleeveless
• Sleeve length, style, and coverage MUST be identical on both views

**NECKLINE & BACK CONSISTENCY:**
• Off-shoulder front → back shows the same off-shoulder line continuing around
• High neckline front → back can have different coverage but same shoulder line
• V-neck front → back should logically connect (covered back or matching V)
• Strapless front → back is also strapless with matching coverage

**STRUCTURAL ELEMENTS:**
• Same silhouette shape (A-line, mermaid, column, etc.) visible from both angles
• Same dress length visible on both mannequins
• Same waistline position (empire, natural, dropped)
• If front has a slit → back may or may not show it depending on placement
• If front has layers/tiers → back shows the same layering

**FABRIC & EMBELLISHMENTS:**
• IDENTICAL fabric pattern, color, and texture on both views
• If front has beading on bodice → back shows beading continuing logically
• If front has lace overlay → back has the same lace overlay
• Sequins, embroidery, appliqués must appear on both views consistently
• The fabric drape and folds should look natural for the same garment

**THINK OF IT AS ONE DRESS:**
Imagine physically walking around a single dress on a mannequin. What you see from the front and what you see from the back must be the same dress - not two different designs.

═══════════════════════════════════════════════════════════════════
DUAL-VIEW PRESENTATION LAYOUT
═══════════════════════════════════════════════════════════════════

**IMAGE COMPOSITION:**





• Create a SINGLE image showing TWO mannequins side by side
• LEFT SIDE: Back view of the dress (back facing viewer)
• RIGHT SIDE: Front view of the SAME dress (front facing viewer)
• Both mannequins identical in pose, height, and proportions
• Appropriate spacing between the two views

**MANNEQUIN SPECIFICATIONS:**
• Beige/cream fabric torso
• No arms (armless dress form)
• Headless mannequin
• Identical proportions for both mannequins
• Full-length view from neckline to hem

═══════════════════════════════════════════════════════════════════
DRESS RENDERING QUALITY
═══════════════════════════════════════════════════════════════════

• Complete, continuous, non-deformed garment with no missing parts
• Clean, symmetrical construction with realistic silhouette
• All fabric edges intact, smooth, and not cut off
• Highly detailed couture fashion design
• Realistic textile rendering with natural folds, texture, and flow
• Accurate color reproduction
• Dress fits naturally on the mannequin

═══════════════════════════════════════════════════════════════════
🎨 BACKGROUND - INFINITY SEAMLESS STUDIO (CRITICAL)
═══════════════════════════════════════════════════════════════════

**EXACT BACKGROUND SPECIFICATION - MUST FOLLOW PRECISELY:**

The background MUST be a seamless "infinity cove" / "cyclorama" studio setup:

**COLOR (STRICT):**
• Single uniform color: warm beige/cream (#F5F0E8 to #EDE8E0 range)
• Soft, even gradient from slightly lighter at top to slightly warmer at bottom
• NO harsh color transitions or visible color layers
• The SAME background color in EVERY generated image - no variation

**INFINITY BACKGROUND EFFECT (CRITICAL):**
• Floor and wall BLEND into ONE continuous curved surface
• NO visible horizon line where floor meets wall
• NO visible corner, edge, or seam between floor and wall
• The surface curves smoothly from vertical (behind) to horizontal (below)
• Mannequins appear to float on an infinite, seamless surface

**ABSOLUTELY NO:**
⛔ NO walls - no visible wall structures or panels
⛔ NO floor textures - no ceramic tiles, wood, marble, concrete, or any pattern
⛔ NO architectural elements - no corners, baseboards, moldings
⛔ NO visible floor surface - the floor blends seamlessly with background
⛔ NO multiple color layers or gradient bands
⛔ NO colored floor different from the background
⛔ NO shadows on walls (only soft shadows directly under mannequins)
⛔ NO windows, doors, or any room features
⛔ NO reflective surfaces or mirrors
⛔ NO props, furniture, or decorative elements

**LIGHTING:**
• Soft, diffused, even studio lighting
• Light comes from above and slightly in front
• Soft, subtle shadows ONLY directly under the mannequin bases
• Shadows should be light gray, not dark - barely visible
• No harsh shadows, no directional lighting effects
• Lighting identical across all generated images

**VISUAL REFERENCE:**
Think of a professional fashion photography infinity cove - a curved white/cream seamless backdrop that eliminates all edges and creates a pure, minimal, floating effect. The mannequins should appear suspended in a clean, infinite cream-colored space.

═══════════════════════════════════════════════════════════════════
BRANDING / LOGO
═══════════════════════════════════════════════════════════════════

Logo Placement:

Text: "Brokar Al Sharqiya" floating in the background (centered between mannequins)
Position: upper portion of image, above the mannequins
Style: luxury, elegant, high-end
Font: Elegant handwritten signature script style, sophisticated calligraphy 
Color: Black
Above the text: small hand-drawn minimal couture dress sketch in soft black line-art
Logo appears to float on the seamless background - NOT on a wall

═══════════════════════════════════════════════════════════════════
⛔ HARD RULES - VIOLATION IS UNACCEPTABLE
═══════════════════════════════════════════════════════════════════

**BACKGROUND RULES:**
• Background MUST be seamless infinity cove - NO exceptions
• NO visible floor or wall structures
• NO tiles, textures, or patterns on any surface
• Background color MUST be consistent warm beige/cream

**DRESS RULES:**
• Do NOT crop the dress
• Do NOT generate torn, incomplete, or fragmented fabric
• Do NOT distort proportions
• Do NOT create different dress designs for front vs back
• MUST show BOTH front and back views in the same image
• Front and back MUST be the same dress

**OUTPUT SPECIFICATIONS:**
• Photo size: 1:1 (square)
• 4K photorealistic output quality
• Professional fashion editorial quality

═══════════════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════════════

Two full-body mannequins side by side (left: back view, right: front view) wearing THE SAME complete dress. Mannequins are centered on a seamless warm beige/cream infinity background with NO visible floor or walls. The "yasmin-alsham" gold logo floats above them. Clean, minimal, professional fashion studio aesthetic.`;


    // بناء محتوى الرسالة (نص + صور)
    let messageContent: any;
    
    if (secondaryFabricImage) {
      // مع قماشين
      messageContent = [
        { type: 'text', text: imagePrompt },
        { type: 'image_url', image_url: { url: primaryFabricImage } },
        { type: 'image_url', image_url: { url: secondaryFabricImage } },
      ];
    } else {
      // مع قماش واحد
      messageContent = [
        { type: 'text', text: imagePrompt },
        { type: 'image_url', image_url: { url: primaryFabricImage } },
      ];
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://yasmine-al-sham-designer.com',
        'X-Title': `Yasmine Al-Sham - Design ${index + 1}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: messageContent }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // استخراج الصورة من الاستجابة (نفس طريقة generate-image)
    if (data.choices && data.choices.length > 0) {
      const message = data.choices[0].message;

      // البحث عن الصورة في الاستجابة
      if (message.images && message.images.length > 0) {
        const image = message.images[0];
        if (image.image_url && image.image_url.url) {
          return {
            index,
            prompt,
            imageData: image.image_url.url, // Base64 data URL
            success: true,
          };
        }
      }
    }

    throw new Error('لم يتم توليد صورة في الاستجابة');
  } catch (error) {
    console.error(`❌ فشل توليد التصميم ${index + 1}:`, error);
    return {
      index,
      prompt,
      error: error instanceof Error ? error.message : 'فشل توليد الصورة',
      success: false,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateMultipleImagesRequest = await request.json();
    const { prompts, primaryFabricImage, secondaryFabricImage, model } = body;

    // التحقق من البيانات
    if (!prompts || prompts.length === 0) {
      return NextResponse.json(
        { error: 'يرجى توفير البرومبتات' } as GenerateMultipleImagesResponse,
        { status: 400 }
      );
    }

    if (!primaryFabricImage) {
      return NextResponse.json(
        { error: 'يرجى رفع صورة القماش' } as GenerateMultipleImagesResponse,
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'مفتاح OpenRouter API غير موجود' } as GenerateMultipleImagesResponse,
        { status: 500 }
      );
    }

    console.log(`🎨 بدء توليد ${prompts.length} صور بالتوازي...`);

    // توليد جميع الصور بالتوازي
    const selectedModel = model || 'google/gemini-3.1-flash-image-preview';
    const imagePromises = prompts.map((prompt, index) =>
      generateSingleImage(prompt, index, primaryFabricImage, secondaryFabricImage, selectedModel)
    );

    // انتظار جميع الصور
    const results = await Promise.all(imagePromises);

    // حساب عدد الصور الناجحة
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ تم توليد ${successCount}/${prompts.length} صور بنجاح`);

    return NextResponse.json({
      results,
      successCount,
    } as GenerateMultipleImagesResponse);

  } catch (error) {
    console.error('❌ خطأ في توليد الصور:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء توليد الصور',
      } as GenerateMultipleImagesResponse,
      { status: 500 }
    );
  }
}

