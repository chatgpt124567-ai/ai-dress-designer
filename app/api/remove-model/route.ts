import { NextRequest, NextResponse } from 'next/server';
import type { GeminiImageModel } from '@/types';

export interface RemoveModelRequest {
  imageData: string; // Base64 data URL of the image
  model: GeminiImageModel;
}

export interface RemoveModelResponse {
  imageData?: string;
  error?: string;
}

// Professional prompt for removing fashion model and replacing with mannequin
const REMOVE_MODEL_PROMPT = `You are a professional fashion photography editor specializing in product photography transformation.

TASK: Transform this fashion photograph by replacing the human fashion model with an elegant, sophisticated mannequin while preserving EVERY detail of the dress and environment.

CRITICAL REQUIREMENTS - MUST FOLLOW EXACTLY:

1. DRESS PRESERVATION (HIGHEST PRIORITY):
   - DO NOT alter ANY aspect of the dress design, structure, or details
   - Preserve exact fabric texture, color, sheen, and draping
   - Maintain all embellishments, embroidery, beading, lace, or decorative elements in their exact positions
   - Keep the exact silhouette, neckline, sleeves, waist, and hemline
   - Preserve any pleats, gathers, ruffles, or structural elements exactly as they appear
   - The dress should look identical to the original in every way

2. MANNEQUIN REQUIREMENTS:
   - Replace the human model with a high-end, elegant fashion mannequin
   - The mannequin should be neutral-toned (white, cream, or soft gray)
   - Use a realistic, photographic mannequin style - NOT cartoon or illustration
   - The mannequin should naturally support the dress in the same pose
   - No facial features - use a smooth, featureless head
   - Elegant, natural hand and arm positions if visible

3. BACKGROUND & ENVIRONMENT PRESERVATION:
   - Keep the EXACT same background, lighting, and setting
   - Preserve all shadows, reflections, and lighting conditions
   - Do not add, remove, or modify any background elements
   - Maintain the same perspective and camera angle

4. IMAGE QUALITY REQUIREMENTS:
   - Output must be photorealistic - indistinguishable from a real photograph
   - Maintain the original image resolution and quality
   - No visible artifacts, distortions, or AI-generated imperfections
   - Natural, professional lighting on the mannequin matching the scene
   - Seamless integration between mannequin and dress

5. WHAT TO AVOID:
   - Any changes to the dress design or details
   - Cartoon or illustrated style
   - Visible editing artifacts or unnatural elements
   - Changes to the environment or background
   - Unrealistic proportions or poses

Generate a single, high-quality photorealistic image with the mannequin replacement.`;

export async function POST(request: NextRequest) {
  try {
    console.log('=== Remove Model API Called ===');

    const body: RemoveModelRequest = await request.json();
    const { imageData, model = 'google/gemini-3.1-flash-image-preview' } = body;

    console.log('Request details:', {
      hasImageData: !!imageData,
      imageDataLength: imageData?.length || 0,
      model: model,
    });

    // Validation
    if (!imageData) {
      console.error('Validation failed: No image data');
      return NextResponse.json(
        { error: 'يجب إرفاق صورة للمعالجة' } as RemoveModelResponse,
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('Validation failed: No API key');
      return NextResponse.json(
        { error: 'مفتاح OpenRouter API غير موجود' } as RemoveModelResponse,
        { status: 500 }
      );
    }

    // Process with retry logic
    const maxRetries = 3;
    const retryDelay = 3000;
    let lastError: Error | null = null;
    let resultImageData: string | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries}: Calling OpenRouter API with model ${model}...`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://yasmine-al-sham-designer.com',
            'X-Title': 'Yasmine Al-Sham Smart Designer',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageData,
                    },
                  },
                  {
                    type: 'text',
                    text: REMOVE_MODEL_PROMPT,
                  },
                ],
              },
            ],
            modalities: ['text', 'image'],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        // Extract image from response
        if (data.choices && data.choices.length > 0) {
          const message = data.choices[0].message;

          if (message.images && message.images.length > 0) {
            const image = message.images[0];
            if (image.image_url && image.image_url.url) {
              resultImageData = image.image_url.url;
              break;
            }
          }
        }

        if (!resultImageData) {
          throw new Error('No image data in response');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);

        if (attempt < maxRetries) {
          console.log(`Waiting ${retryDelay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // If all attempts failed
    if (!resultImageData) {
      const errorMessage = lastError?.message.includes('503') || lastError?.message.includes('overloaded')
        ? 'الخدمة مزدحمة حالياً. يرجى المحاولة مرة أخرى بعد دقيقة.'
        : lastError?.message || 'فشل في معالجة الصورة';

      return NextResponse.json(
        { error: errorMessage } as RemoveModelResponse,
        { status: 503 }
      );
    }

    console.log('Successfully processed image');
    return NextResponse.json({
      imageData: resultImageData,
    } as RemoveModelResponse);

  } catch (error) {
    console.error('Error in remove-model API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء معالجة الصورة';
    
    return NextResponse.json(
      { error: errorMessage } as RemoveModelResponse,
      { status: 500 }
    );
  }
}

