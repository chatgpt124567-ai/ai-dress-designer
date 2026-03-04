import { NextRequest, NextResponse } from 'next/server';

export type GeminiModel = 'google/gemini-3.1-flash-image-preview' | 'google/gemini-3-pro-image-preview';

export interface EditDesignRequest {
  originalImageUrl: string;
  editRequest: string;
  model?: GeminiModel; // Optional: defaults to gemini-3.1-flash-image-preview
}

export interface EditDesignResponse {
  imageData?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Edit Design API Called ===');

    const body: EditDesignRequest = await request.json();
    const { originalImageUrl, editRequest, model = 'google/gemini-3.1-flash-image-preview' } = body;

    console.log('Request details:', {
      hasImageUrl: !!originalImageUrl,
      imageUrlLength: originalImageUrl?.length || 0,
      imageUrlPrefix: originalImageUrl?.substring(0, 50) || '',
      isBase64DataUrl: originalImageUrl?.startsWith('data:image/') || false,
      imageUrlType: typeof originalImageUrl,
      editRequestLength: editRequest?.length || 0,
      editRequest: editRequest?.substring(0, 100) || '',
      model: model,
    });

    if (!editRequest || editRequest.trim().length === 0) {
      console.error('Validation failed: No edit request');
      return NextResponse.json(
        { error: 'الرجاء إدخال التعديل المطلوب' } as EditDesignResponse,
        { status: 400 }
      );
    }

    if (!originalImageUrl || originalImageUrl.trim().length === 0) {
      console.error('Validation failed: No image URL');
      return NextResponse.json(
        { error: 'الصورة الأصلية غير موجودة' } as EditDesignResponse,
        { status: 400 }
      );
    }

    // Convert image to Base64 if it's a URL (from Supabase Storage)
    let imageBase64 = originalImageUrl;

    if (!originalImageUrl.startsWith('data:image/')) {
      console.log('Image is a URL, converting to Base64...');
      console.log('Image URL:', originalImageUrl.substring(0, 100));

      try {
        // Fetch the image from the URL
        const imageResponse = await fetch(originalImageUrl);

        if (!imageResponse.ok) {
          console.error('Failed to fetch image from URL:', imageResponse.status, imageResponse.statusText);
          return NextResponse.json(
            { error: 'فشل في تحميل الصورة من الرابط' } as EditDesignResponse,
            { status: 400 }
          );
        }

        // Convert to buffer
        const imageBuffer = await imageResponse.arrayBuffer();

        // Convert to Base64
        const base64 = Buffer.from(imageBuffer).toString('base64');

        // Determine image type from URL or response headers
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

        // Create data URL
        imageBase64 = `data:${contentType};base64,${base64}`;

        console.log('✅ Successfully converted URL to Base64');
        console.log('Base64 length:', imageBase64.length);
      } catch (error) {
        console.error('Error converting URL to Base64:', error);
        return NextResponse.json(
          { error: 'فشل في تحويل الصورة إلى Base64' } as EditDesignResponse,
          { status: 500 }
        );
      }
    } else {
      console.log('Image is already Base64, using directly');
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('Validation failed: No API key');
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
        console.log(`Attempt ${attempt}/${maxRetries}: Calling OpenRouter API with model: ${model}...`);

        // Use OpenRouter API with selected Gemini model
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
                      url: imageBase64, // Use the Base64 version (converted if needed)
                    },
                  },
                  {
                    type: 'text',
                    text: editPrompt,
                  },
                ],
              },
            ],
            modalities: ['text', 'image'],
          }),
        });

        console.log(`OpenRouter API response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenRouter API error response:', errorText);
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        // Save the complete response to a file for debugging
        const fs = require('fs');
        const path = require('path');
        const debugFilePath = path.join(process.cwd(), 'openrouter-response-debug.json');
        try {
          fs.writeFileSync(debugFilePath, JSON.stringify(data, null, 2), 'utf8');
          console.log(`✅ Full API response saved to: ${debugFilePath}`);
        } catch (err) {
          console.error('Failed to save debug file:', err);
        }

        // Log the complete response for debugging
        console.log('\n\n=== COMPLETE API RESPONSE START ===');
        console.log(JSON.stringify(data, null, 2));
        console.log('=== COMPLETE API RESPONSE END ===\n\n');

        console.log('OpenRouter API response data structure:', {
          hasChoices: !!data.choices,
          choicesLength: data.choices?.length || 0,
          hasMessage: !!data.choices?.[0]?.message,
          messageContentType: typeof data.choices?.[0]?.message?.content,
          messageContentIsArray: Array.isArray(data.choices?.[0]?.message?.content),
          messageContentLength: Array.isArray(data.choices?.[0]?.message?.content) ? data.choices[0].message.content.length : 'N/A',
          hasImages: !!data.choices?.[0]?.message?.images,
          imagesLength: data.choices?.[0]?.message?.images?.length || 0,
        });

        // Log the first content item if it exists
        if (data.choices?.[0]?.message?.content) {
          const content = data.choices[0].message.content;
          if (Array.isArray(content) && content.length > 0) {
            console.log('\n=== FIRST CONTENT ITEM ===');
            console.log(JSON.stringify(content[0], null, 2));
            console.log('=== END FIRST CONTENT ITEM ===\n');
          }
        }

        // Extract image from response
        console.log('Extracting image from API response...');

        if (data.choices && data.choices.length > 0) {
          const message = data.choices[0].message;
          console.log('Message structure:', {
            hasContent: !!message.content,
            contentType: typeof message.content,
            isArray: Array.isArray(message.content),
            contentLength: Array.isArray(message.content) ? message.content.length : 'N/A',
            hasImages: !!message.images,
            imagesLength: message.images?.length || 0,
          });

          // OpenRouter returns images in message.images array (not in message.content)
          if (message.images && message.images.length > 0) {
            console.log('Found images array with', message.images.length, 'images');
            const firstImage = message.images[0];

            if (firstImage.type === 'image_url' && firstImage.image_url) {
              const fullImageUrl = typeof firstImage.image_url === 'string'
                ? firstImage.image_url
                : firstImage.image_url.url;

              if (fullImageUrl) {
                // Extract base64 data without the data URL prefix
                if (fullImageUrl.startsWith('data:image/')) {
                  imageData = fullImageUrl.split(',')[1];
                  console.log('✅ Successfully extracted image from message.images[0].image_url, length:', imageData?.length || 0);
                } else {
                  imageData = fullImageUrl;
                  console.log('✅ Successfully extracted image from message.images[0].image_url (no prefix), length:', imageData?.length || 0);
                }
              }
            }
          }

          if (!imageData) {
            console.error('❌ Failed to extract image from message.images');
            console.error('Full message:', JSON.stringify(message, null, 2));
          }
        } else {
          console.error('❌ Response missing choices array');
        }

        if (!imageData) {
          throw new Error('No image data found in API response. Check console logs for details.');
        }

        // Success! Break out of retry loop
        console.log('✅ Successfully extracted image, breaking out of retry loop');
        break;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`محاولة ${attempt}/${maxRetries} فشلت:`, lastError.message);
        console.error('Error stack:', lastError.stack);

        if (attempt < maxRetries) {
          console.log(`انتظار ${retryDelay}ms قبل المحاولة التالية...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // If all attempts failed
    if (!imageData) {
      console.error('All attempts failed. Last error:', lastError);

      const errorMessage = lastError?.message.includes('503') || lastError?.message.includes('overloaded')
        ? 'الخدمة مزدحمة حالياً. يرجى المحاولة مرة أخرى بعد دقيقة.'
        : lastError?.message || 'فشل في تعديل التصميم';

      return NextResponse.json(
        { error: errorMessage } as EditDesignResponse,
        { status: 503 }
      );
    }

    console.log('=== Edit Design API Success ===');
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

