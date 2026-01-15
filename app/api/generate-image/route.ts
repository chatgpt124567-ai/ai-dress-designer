import { NextRequest, NextResponse } from 'next/server';
import type { GenerateImageRequest, GenerateImageResponse, GeminiImageModel } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateImageRequest = await request.json();
    const {
      prompt,
      fabricImage,
      primaryFabricImage,
      secondaryFabricImage,
      model = 'google/gemini-2.5-flash-image'
    } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'الرجاء إدخال برومبت' } as GenerateImageResponse,
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'مفتاح OpenRouter API غير موجود' } as GenerateImageResponse,
        { status: 500 }
      );
    }

    // Build custom fabric instruction if fabric image is provided
    let customFabricInstruction = '';

    // Own Fabric Workflow (new)
    if (primaryFabricImage) {
      if (secondaryFabricImage) {
        customFabricInstruction = `

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
      } else {
        customFabricInstruction = `

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
    }
    // Old Custom Fabric Workflow (from questionnaire)
    else if (fabricImage) {
      customFabricInstruction = `

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
• RIGHT SIDE: Front view of the dress (facing the viewer)
• LEFT SIDE: Back view of the SAME dress (showing the back to the viewer)
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
• The back view (LEFT) must clearly show: back neckline, closure details, back embellishments, and train/hem as seen from behind
• The front view (RIGHT) must clearly show: front neckline, bodice details, front embellishments

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
• Centered view showing both mannequins (left: back view, right: front view).
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
Two full-body mannequins side by side (left: back view, right: front view) wearing the complete dress, centered, with the "yasmin-alsham" gold logo and the couture sketch above them.`;

    // نظام إعادة المحاولة
    let imageData: string | null = null;
    let lastError: Error | null = null;
    const maxRetries = 3;
    const retryDelay = 3000;

    console.log(`🎨 Using AI model: ${model}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries}: Calling OpenRouter API with model: ${model}...`);
        // Build message content based on whether fabric images are provided
        let messageContent: any;

        // Own Fabric Workflow (new)
        if (primaryFabricImage) {
          if (secondaryFabricImage) {
            // Multimodal request: text + 2 fabric images
            messageContent = [
              {
                type: 'text',
                text: imagePrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: primaryFabricImage, // Base64 data URL
                },
              },
              {
                type: 'image_url',
                image_url: {
                  url: secondaryFabricImage, // Base64 data URL
                },
              },
            ];
          } else {
            // Multimodal request: text + 1 fabric image
            messageContent = [
              {
                type: 'text',
                text: imagePrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: primaryFabricImage, // Base64 data URL
                },
              },
            ];
          }
        }
        // Old Custom Fabric Workflow (from questionnaire)
        else if (fabricImage) {
          // Multimodal request: text + image
          messageContent = [
            {
              type: 'text',
              text: imagePrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: fabricImage, // Base64 data URL or image URL
              },
            },
          ];
        }
        // No fabric images
        else {
          // Text-only request
          messageContent = imagePrompt;
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://yasmine-al-sham-designer.com',
            'X-Title': 'Yasmine Al-Sham Smart Designer',
          },
          body: JSON.stringify({
            model: model, // Use selected model (gemini-2.5-flash-image or gemini-3-pro-image-preview)
            messages: [
              {
                role: 'user',
                content: messageContent,
              },
            ],
            modalities: ['image', 'text'], // طلب توليد صورة
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        // استخراج الصورة من الاستجابة
        if (data.choices && data.choices.length > 0) {
          const message = data.choices[0].message;

          // البحث عن الصورة في الاستجابة
          if (message.images && message.images.length > 0) {
            const image = message.images[0];
            if (image.image_url && image.image_url.url) {
              imageData = image.image_url.url; // Base64 data URL
              break;
            }
          }
        }

        if (!imageData) {
          throw new Error('No image data in response');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`محاولة ${attempt}/${maxRetries} فشلت:`, lastError.message);

        if (attempt < maxRetries) {
          console.log(`انتظار ${retryDelay}ms قبل المحاولة التالية...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // إذا فشلت جميع المحاولات
    if (!imageData) {
      const errorMessage = lastError?.message.includes('503') || lastError?.message.includes('overloaded')
        ? 'الخدمة مزدحمة حالياً. يرجى المحاولة مرة أخرى بعد دقيقة.'
        : lastError?.message || 'فشل في توليد الصورة';

      return NextResponse.json(
        { error: errorMessage } as GenerateImageResponse,
        { status: 503 }
      );
    }

    return NextResponse.json({
      imageData,
    } as GenerateImageResponse);

  } catch (error) {
    console.error('Error generating image:', error);
    
    let errorMessage = 'حدث خطأ أثناء توليد الصورة';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // رسائل خطأ مخصصة
      if (errorMessage.includes('API key')) {
        errorMessage = 'مفتاح API غير صالح';
      } else if (errorMessage.includes('quota')) {
        errorMessage = 'تم تجاوز حد الاستخدام';
      } else if (errorMessage.includes('model')) {
        errorMessage = 'النموذج غير متاح حالياً';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage } as GenerateImageResponse,
      { status: 500 }
    );
  }
}

