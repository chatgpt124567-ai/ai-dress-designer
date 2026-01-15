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

FABRIC INSTRUCTION (CRITICAL - HIGHEST PRIORITY):
• The client has provided TWO custom fabric images (attached below)
• PRIMARY FABRIC: You MUST use the EXACT fabric pattern, texture, colors, and design from the first attached fabric image
• SECONDARY FABRIC: You MUST use the EXACT fabric pattern, texture, colors, and design from the second attached fabric image
• Apply both fabrics EXACTLY as specified in the dress description above
• Do NOT modify, recolor, or alter either fabric pattern in ANY way
• Do NOT change the pattern repeat, print, texture, or any visual characteristic
• Maintain photorealistic accuracy when applying both fabrics to the dress
• The fabrics should drape naturally and realistically on the dress with proper folds and textile behavior
• Ensure the fabric patterns align correctly and look professionally tailored
• The custom fabrics are the PRIMARY design elements - treat them with utmost precision`;
  } else if (hasPrimaryFabric) {
    return `

FABRIC INSTRUCTION (CRITICAL - HIGHEST PRIORITY):
• A custom fabric image has been provided by the client (attached below)
• You MUST use the EXACT fabric pattern, texture, colors, and design from the attached custom fabric image
• Apply this fabric EXACTLY as specified in the dress description above
• Do NOT modify, recolor, or alter the fabric pattern in ANY way
• Do NOT change the pattern repeat, print, texture, or any visual characteristic
• Maintain photorealistic accuracy when applying the fabric to the dress
• The fabric should drape naturally and realistically on the dress with proper folds and textile behavior
• Ensure the fabric pattern aligns correctly and looks professionally tailored
• The custom fabric is the PRIMARY design element - treat it with utmost precision`;
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
  model: string = 'google/gemini-2.5-flash-image'
): Promise<SingleImageResult> {
  try {
    // بناء تعليمات القماش
    const customFabricInstruction = buildFabricInstruction(!!primaryFabricImage, !!secondaryFabricImage);

    // البرومبت الكامل مع اللوجو والخلفية + dual-view
    const imagePrompt = `Generate a high-quality, fully coherent fashion design image of a dress based on the following enhanced client description:

${prompt}${customFabricInstruction}

---

Dress Rendering Requirements:
• The dress must appear as a complete, continuous, non-deformed garment with no missing parts.
• Maintain clean, symmetrical construction with a realistic silhouette.
• Ensure all fabric edges are intact, smooth, and not cut off.
• Highly detailed couture fashion design.
• Realistic textile rendering with natural folds, fabric texture, fabric flow, and proper reflections.
• Accurate color reproduction.
• The dress must fit the mannequin naturally and consistently.

═══════════════════════════════════════════════════════════════════
DUAL-VIEW PRESENTATION (FRONT & BACK) - CRITICAL REQUIREMENT
═══════════════════════════════════════════════════════════════════

**IMAGE LAYOUT:**
• Create a SINGLE image showing TWO separate mannequins/dress forms side by side
• LEFT SIDE: Front view of the dress (facing the viewer)
• RIGHT SIDE: Back view of the SAME dress (showing the back to the viewer)
• Both mannequins should be identical in pose and height
• Leave appropriate spacing between the two views

**MANNEQUIN REQUIREMENTS (for BOTH views):**
• Beige/cream fabric torso.
• No arms.
• Identical proportions and pose for both mannequins.
• Headless mannequin.
• Full-length view showing the entire dress from neckline to hem.

**VISUAL CONSISTENCY:**
• SAME fabric pattern, color, and texture on both views
• Identical embellishments placement (front and back as described)
• Matching lighting and shadows on both mannequins
• Same scale and proportion for both views

**IMPORTANT - BOTH VIEWS MANDATORY:**
• Do NOT show just the front view - BOTH front and back views are required
• The back view must clearly show: back neckline, closure details, back embellishments, and train/hem as seen from behind

---

Branding / Logo Requirements:
• Logo on the wall behind the mannequins (centered between both).
• Text: "yasmin-alsham"
• Style: luxury, elegant, high-end.
• Font: Playfair Display serif.
• Color: metallic gold (#C9A85A).
• Centered above the mannequins.
• Above the text: a small hand-drawn minimal couture dress sketch in soft black line-art.
• Logo and sketch must remain identical across all images (size, placement, and styling).

Background & Environment:
• Minimal luxury fashion studio.
• Soft beige/cream gradient background.
• Clean soft shadows under both mannequins.
• Consistent neutral lighting.
• No extra props or clutter.

Rendering Specifications:
• 4K photorealistic output.
• Centered view showing both mannequins (front and back views).
• Clean composition, sharp edges, editorial quality.
• Strict consistency for mannequins, background, lighting, and logo.
• Only the dress design changes based on the enhanced client description.
• Photo size will be 9:16

Hard Rules (must follow):
• Do NOT crop the dress.
• Do NOT generate torn, incomplete, fragmented, or unrealistic fabric.
• Do NOT distort proportions.
• Dress must always be smooth, clean, symmetrical, and fully constructed.
• The garment must look wearable and professionally tailored.
• MUST show BOTH front and back views in the same image.

Output:
Two full-body mannequins side by side (left: front view, right: back view) wearing the complete dress, centered, with the "yasmin-alsham" gold logo and the couture sketch above them.`;


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
    const selectedModel = model || 'google/gemini-2.5-flash-image';
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

