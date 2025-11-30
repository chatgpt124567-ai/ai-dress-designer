import { NextRequest, NextResponse } from 'next/server';

export interface RefineModificationPromptRequest {
  locations: string[];
  modificationDescription: string;
}

export interface RefineModificationPromptResponse {
  refinedPrompt?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Refine Modification Prompt API Called ===');

    const body: RefineModificationPromptRequest = await request.json();
    const { locations, modificationDescription } = body;

    console.log('Request details:', {
      locationsCount: locations?.length || 0,
      locations: locations,
      descriptionLength: modificationDescription?.length || 0,
    });

    // Validation
    if (!locations || locations.length === 0) {
      console.error('Validation failed: No locations provided');
      return NextResponse.json(
        { error: 'يجب تحديد موقع واحد على الأقل للتعديل' } as RefineModificationPromptResponse,
        { status: 400 }
      );
    }

    if (!modificationDescription || modificationDescription.trim().length === 0) {
      console.error('Validation failed: No modification description');
      return NextResponse.json(
        { error: 'يجب إدخال وصف التعديل المطلوب' } as RefineModificationPromptResponse,
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('Validation failed: No API key');
      return NextResponse.json(
        { error: 'مفتاح OpenRouter API غير موجود' } as RefineModificationPromptResponse,
        { status: 500 }
      );
    }

    // Build the prompt for GPT-5-mini
    const locationsText = locations.join(', ');
    
    const systemPrompt = `Your task is to create a professional dress-modification description based solely on the client's answers below.

Important rules:
- Analyze the attached image to understand the exact nature of the requested modification, its precise location, and how it should be integrated seamlessly with the rest of the design.
- Describe the location of the requested modification with extremely high accuracy.
- Do not mention the background, environment, room, mannequin, lighting, camera angle, or logo. These elements are handled separately.
- You may enhance clarity and professionalism, but you are not allowed to invent any new modifications that the client did not imply.
- All modifications must reflect the client's intended style, materials, preferences, and notes.
- The goal is to transform the client's choices into one cohesive, couture-level description that can be used directly in an AI image-editing prompt.

Modification location:
${locationsText}

Requested modification:
${modificationDescription}

Your output must be one refined paragraph in English describing only:
• the precise location of the requested modification
• strict emphasis on not touching or altering any areas not requested
• a highly accurate and professional description of the modification, without adding or removing meaning from what the client specified

Do not mention questionnaires, choices, user inputs, or any external context.
Write in the tone of a high-fashion designer describing a couture dress modification.`;

    // Retry logic
    let refinedPrompt = '';
    let lastError: Error | null = null;
    const maxRetries = 3;
    const retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries}: Calling OpenRouter API with GPT-5-mini...`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://yasmine-al-sham-designer.com',
            'X-Title': 'Yasmine Al-Sham Smart Designer',
          },
          body: JSON.stringify({
            model: 'openai/gpt-5-mini',
            messages: [
              {
                role: 'user',
                content: systemPrompt,
              },
            ],
          }),
        });

        console.log('API Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('API Response data:', JSON.stringify(data, null, 2));

        if (data.choices && data.choices.length > 0) {
          refinedPrompt = data.choices[0].message.content.trim();
          console.log('Refined prompt generated successfully');
          break;
        } else {
          throw new Error('No response from OpenRouter API');
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

    // If all retries failed
    if (!refinedPrompt) {
      const errorMessage = lastError?.message.includes('503') || lastError?.message.includes('overloaded')
        ? 'الخدمة مزدحمة حالياً. يرجى المحاولة مرة أخرى بعد قليل.'
        : lastError?.message || 'فشل في تحسين وصف التعديل';

      return NextResponse.json(
        { error: errorMessage } as RefineModificationPromptResponse,
        { status: 503 }
      );
    }

    return NextResponse.json({
      refinedPrompt,
    } as RefineModificationPromptResponse);

  } catch (error) {
    console.error('Error refining modification prompt:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تحسين وصف التعديل',
      } as RefineModificationPromptResponse,
      { status: 500 }
    );
  }
}

