import { NextRequest, NextResponse } from 'next/server';

export interface EditDesignRequest {
  originalImageUrl: string;
  editRequest: string;
}

export interface EditDesignResponse {
  imageData?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EditDesignRequest = await request.json();
    const { originalImageUrl, editRequest } = body;

    if (!editRequest || editRequest.trim().length === 0) {
      return NextResponse.json(
        { error: 'الرجاء إدخال التعديل المطلوب' } as EditDesignResponse,
        { status: 400 }
      );
    }

    if (!originalImageUrl || originalImageUrl.trim().length === 0) {
      return NextResponse.json(
        { error: 'الصورة الأصلية غير موجودة' } as EditDesignResponse,
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'مفتاح OpenRouter API غير موجود' } as EditDesignResponse,
        { status: 500 }
      );
    }

    // Professional prompt for design editing
    const editPrompt = `You are an expert fashion design AI assistant specializing in precise design modifications. You have been given an existing dress design image and a specific modification request from the client.

**CRITICAL INSTRUCTIONS:**
• Make ONLY the requested modification with surgical precision
• Do NOT change any other details, elements, or aspects of the design
• Maintain the exact same:
  - Overall silhouette and proportions
  - Lighting, shadows, and studio setup
  - Background and presentation
  - Mannequin pose and positioning
  - Fabric textures (except where modification is requested)
  - All embellishments and details (except where modification is requested)
  - Color scheme (except where modification is requested)
  - The "yasmin-alsham" gold logo and couture sketch positioning

**Client's Modification Request:**
${editRequest}

**Design Consistency Requirements:**
• The modified dress must look like a natural evolution of the original design
• Maintain the same level of quality, detail, and professionalism
• Keep the same photorealistic rendering style
• Preserve the luxury couture aesthetic
• Ensure the modification blends seamlessly with unchanged elements

**Technical Specifications:**
• 4K photorealistic output
• Centered full-body view of the mannequin
• Clean composition, sharp edges, editorial quality
• Same lighting setup and studio environment
• Photo size: 9:16 aspect ratio

**Hard Rules:**
• Do NOT crop the dress
• Do NOT generate torn, incomplete, or fragmented fabric
• Do NOT distort proportions
• The garment must remain smooth, clean, symmetrical, and professionally tailored
• The modification must be the ONLY visible change from the original

Please generate a new version of this dress design that incorporates ONLY the requested modification while keeping everything else identical to the original design.`;

    // Retry logic
    let imageData: string | null = null;
    let lastError: Error | null = null;
    const maxRetries = 3;
    const retryDelay = 3000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use OpenRouter API with Gemini 2.5 Flash Image
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://yasmine-al-sham-designer.com',
            'X-Title': 'Yasmine Al-Sham Smart Designer',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: editPrompt,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: originalImageUrl,
                    },
                  },
                ],
              },
            ],
            modalities: ['image', 'text'],
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

    // If all attempts failed
    if (!imageData) {
      const errorMessage = lastError?.message.includes('503') || lastError?.message.includes('overloaded')
        ? 'الخدمة مزدحمة حالياً. يرجى المحاولة مرة أخرى بعد دقيقة.'
        : lastError?.message || 'فشل في تعديل التصميم';

      return NextResponse.json(
        { error: errorMessage } as EditDesignResponse,
        { status: 503 }
      );
    }

    return NextResponse.json({
      imageData,
    } as EditDesignResponse);

  } catch (error) {
    console.error('Error editing design:', error);
    
    let errorMessage = 'حدث خطأ أثناء تعديل التصميم';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (errorMessage.includes('API key')) {
        errorMessage = 'مفتاح API غير صالح';
      } else if (errorMessage.includes('quota')) {
        errorMessage = 'تم تجاوز حد الاستخدام';
      } else if (errorMessage.includes('model')) {
        errorMessage = 'النموذج غير متاح حالياً';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage } as EditDesignResponse,
      { status: 500 }
    );
  }
}

