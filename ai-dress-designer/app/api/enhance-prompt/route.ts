import { NextRequest, NextResponse } from 'next/server';
import type { EnhancePromptRequest, EnhancePromptResponse, QuestionnaireAnswers } from '@/types';

// Helper function to format questionnaire answers into readable text
function formatQuestionnaireAnswers(answers: QuestionnaireAnswers): string {
  const parts: string[] = [];

  // Section 1: Basics
  parts.push(`**Dress Type:** ${answers.dressType}${answers.dressTypeCustom ? ` (${answers.dressTypeCustom})` : ''}`);
  parts.push(`**Dress Length:** ${answers.dressLength}${answers.dressLengthCustom ? ` (${answers.dressLengthCustom})` : ''}`);

  // Section 2: Silhouette
  parts.push(`**Waist Shape:** ${answers.waistShape}${answers.waistShapeCustom ? ` (${answers.waistShapeCustom})` : ''}`);
  parts.push(`**Skirt Shape:** ${answers.skirtShape}${answers.skirtShapeCustom ? ` (${answers.skirtShapeCustom})` : ''}`);

  // Section 3: Upper Body
  parts.push(`**Neckline Type:** ${answers.necklineType}${answers.necklineTypeCustom ? ` (${answers.necklineTypeCustom})` : ''}`);
  parts.push(`**Sleeve Type:** ${answers.sleeveType}${answers.sleeveTypeCustom ? ` (${answers.sleeveTypeCustom})` : ''}`);

  // Section 5: Fabric & Materials (Section 4 removed: Back Design)
  parts.push(`**Fabric Type:** ${answers.fabricType}${answers.fabricTypeCustom ? ` (${answers.fabricTypeCustom})` : ''}`);
  if (answers.hasTransparentParts === 'yes' && answers.transparentPartsLocation) {
    parts.push(`**Transparent Parts:** Yes, at ${answers.transparentPartsLocation}`);
  } else {
    parts.push(`**Transparent Parts:** No`);
  }

  // Section 6: Embellishments
  if (answers.embellishments && answers.embellishments.length > 0) {
    let embellishmentText = `**Embellishments:** ${answers.embellishments.join(', ')}${answers.embellishmentsCustom ? ` (${answers.embellishmentsCustom})` : ''}`;
    if (answers.embellishmentPlacement) {
      embellishmentText += ` - Placement: ${answers.embellishmentPlacement}`;
    }
    parts.push(embellishmentText);
  }
  parts.push(`**Shine Level:** ${answers.shineLevel}${answers.shineLevelCustom ? ` (${answers.shineLevelCustom})` : ''}`);

  // Section 7: Colors
  parts.push(`**Primary Color:** ${answers.primaryColor}`);
  if (answers.hasAdditionalColors === 'yes' && answers.additionalColors) {
    parts.push(`**Additional Colors:** ${answers.additionalColors}`);
  }

  // Section 8: Design Style (Q15 removed: Reference Image)
  parts.push(`**Design Style:** ${answers.designStyle}${answers.designStyleCustom ? ` (${answers.designStyleCustom})` : ''}`);

  // Section 9: Additional Notes
  if (answers.additionalNotes) {
    parts.push(`**Additional Notes:** ${answers.additionalNotes}`);
  }

  return parts.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body: EnhancePromptRequest = await request.json();
    const { description, questionnaireAnswers } = body;

    // Support both old (description) and new (questionnaireAnswers) formats
    if (!description && !questionnaireAnswers) {
      return NextResponse.json(
        { error: 'الرجاء إدخال وصف للفستان أو إكمال الاستبيان' } as EnhancePromptResponse,
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'مفتاح OpenRouter API غير موجود' } as EnhancePromptResponse,
        { status: 500 }
      );
    }

    // Determine which format we're using
    let clientAnswersText: string;
    if (questionnaireAnswers) {
      clientAnswersText = formatQuestionnaireAnswers(questionnaireAnswers);
    } else {
      // Fallback to old description format
      clientAnswersText = `Client Description: ${description}`;
    }

    const systemPrompt = `Your task is to create a detailed, professional, couture-level dress description based ONLY on the client's answers below.

IMPORTANT RULES:
- Describe the DRESS ONLY. 
- Do NOT describe any background, environment, room, mannequin, lighting, camera position, or logo. These elements are handled separately.
- You may enhance clarity and professionalism, but you must NOT invent new features that the client did not imply.
- All improvements must reflect the client's intended style, materials, preferences, and notes.
- The goal is to transform the client's selections into one cohesive luxury-fashion description suitable for insertion into an AI image-generation prompt.

Your output must be a single polished paragraph describing ONLY:
• silhouette  
• proportions  
• fabrics  
• materials  
• neckline  
• sleeves  
• skirt shape  
• waist shape  
• back design  
• embellishments  
• transparency details  
• colors  
• movement & textile behavior  
• aesthetic style  

Do NOT mention questionnaires, choices, user inputs, or any meta context.  
Write in the tone of an elite fashion designer describing a couture dress.

---

Client Answers:

${clientAnswersText}

---

Now transform all the information above into one refined, elegant paragraph that describes ONLY the dress design with expert-level precision and coherent structure.`;

    // نظام إعادة المحاولة
    let enhancedPrompt = '';
    let lastError: Error | null = null;
    const maxRetries = 3;
    const retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // استخدام OpenRouter API مع نموذج DeepSeek R1 (مجاني)
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://yasmine-al-sham-designer.com',
            'X-Title': 'Yasmine Al-Sham Smart Designer',
          },
          body: JSON.stringify({
            model: 'openai/gpt-5-mini', // نموذج GPT-5 Mini
            messages: [
              {
                role: 'user',
                content: systemPrompt,
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
          enhancedPrompt = data.choices[0].message.content.trim();
          break;
        } else {
          throw new Error('No response from OpenRouter API');
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
    if (!enhancedPrompt) {
      const errorMessage = lastError?.message.includes('503') || lastError?.message.includes('overloaded')
        ? 'الخدمة مزدحمة حالياً. يرجى المحاولة مرة أخرى بعد قليل.'
        : lastError?.message || 'فشل في تحسين البرومبت';

      return NextResponse.json(
        { error: errorMessage } as EnhancePromptResponse,
        { status: 503 }
      );
    }

    return NextResponse.json({
      enhancedPrompt,
    } as EnhancePromptResponse);
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تحسين البرومبت',
      } as EnhancePromptResponse,
      { status: 500 }
    );
  }
}

