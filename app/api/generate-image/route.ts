import { NextRequest, NextResponse } from 'next/server';
import type { GenerateImageRequest, GenerateImageResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateImageRequest = await request.json();
    const { prompt, fabricImage } = body;

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
    if (fabricImage) {
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

Mannequin (fixed for all generations):
• Beige/cream fabric torso.
• No arms.
• Identical proportions and pose every time.
• Headless mannequin.

Branding / Logo Requirements:
• Logo on the wall behind the mannequin.
• Text: "yasmin-alsham"
• Style: luxury, elegant, high-end.
• Font: Playfair Display serif.
• Color: metallic gold (#C9A85A).
• Centered above the mannequin.
• Above the text: a small hand-drawn minimal couture dress sketch in soft black line-art.
• Logo and sketch must remain identical across all images (size, placement, and styling).

Background & Environment:
• Minimal luxury fashion studio.
• Soft beige/cream gradient background.
• Clean soft shadows under the mannequin.
• Consistent neutral lighting.
• No extra props or clutter.

Rendering Specifications:
• 4K photorealistic output.
• Centered full-body view of the mannequin.
• Clean composition, sharp edges, editorial quality.
• Strict consistency for mannequin, background, lighting, and logo.
• Only the dress design changes based on the enhanced client description.

Hard Rules (must follow):
• Do NOT crop the dress.
• Do NOT generate torn, incomplete, fragmented, or unrealistic fabric.
• Do NOT distort proportions.
• Dress must always be smooth, clean, symmetrical, and fully constructed.
• The garment must look wearable and professionally tailored.
  Photo siz will be 9:16
Output:
A full-body mannequin wearing the complete dress, centered, with the "yasmin-alsham" gold logo and the couture sketch above it.`;

    // نظام إعادة المحاولة
    let imageData: string | null = null;
    let lastError: Error | null = null;
    const maxRetries = 3;
    const retryDelay = 3000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // استخدام OpenRouter API مع Gemini 2.5 Flash Image لتوليد الصور
        // Build message content based on whether fabric image is provided
        let messageContent: any;
        if (fabricImage) {
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
        } else {
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
            model: 'google/gemini-2.5-flash-image', // نموذج Gemini لتوليد الصور
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

