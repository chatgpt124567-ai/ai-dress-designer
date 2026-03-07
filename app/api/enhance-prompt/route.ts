import { NextRequest, NextResponse } from 'next/server';
import type { EnhancePromptRequest, EnhancePromptResponse, QuestionnaireAnswers } from '@/types';

// Helper function to format questionnaire answers into readable text
function formatQuestionnaireAnswers(answers: QuestionnaireAnswers): string {
  const parts: string[] = [];

  // Section 1: Basics
  parts.push(`**Dress Type:** ${answers.dressType}${answers.dressTypeCustom ? ` (${answers.dressTypeCustom})` : ''}`);
  parts.push(`**Dress Length:** ${answers.dressLength}${answers.dressLengthCustom ? ` (${answers.dressLengthCustom})` : ''}`);

  const REF_MATCH = 'as shown in the attached reference image for this area';

  // Section 2: Silhouette (Q3 Waist Shape removed)
  const skirtShapeVal = answers.skirtShape === 'reference_match' ? REF_MATCH : answers.skirtShape;
  parts.push(`**Skirt Shape:** ${skirtShapeVal}${answers.skirtShapeCustom && answers.skirtShape !== 'reference_match' ? ` (${answers.skirtShapeCustom})` : ''}`);

  // Section 3: Upper Body
  const necklineVal = answers.necklineType === 'reference_match' ? REF_MATCH : answers.necklineType;
  parts.push(`**Neckline Type:** ${necklineVal}${answers.necklineTypeCustom && answers.necklineType !== 'reference_match' ? ` (${answers.necklineTypeCustom})` : ''}`);

  // Section 4: Back Design
  if (answers.backStyle) {
    const backVal = answers.backStyle === 'reference_match' ? REF_MATCH : answers.backStyle;
    parts.push(`**Back Style:** ${backVal}${answers.backStyleCustom && answers.backStyle !== 'reference_match' ? ` (${answers.backStyleCustom})` : ''}`);
  }

  // Section 5: Sleeves
  const sleeveVal = answers.sleeveType === 'reference_match' ? REF_MATCH : answers.sleeveType;
  parts.push(`**Sleeve Type:** ${sleeveVal}${answers.sleeveTypeCustom && answers.sleeveType !== 'reference_match' ? ` (${answers.sleeveTypeCustom})` : ''}`);

  // Section 6: Fabric & Materials
  const fabricTypes = Array.isArray(answers.fabricType) ? answers.fabricType : (answers.fabricType ? [answers.fabricType] : []);

  if (fabricTypes.includes('customFabric') && answers.customFabricImage) {
    // Custom fabric with image
    let placementText = '';
    if (answers.fabricPlacement === 'full') {
      placementText = 'entire dress';
    } else if (answers.fabricPlacement === 'bodice') {
      placementText = 'bodice only';
    } else if (answers.fabricPlacement === 'skirt') {
      placementText = 'skirt only';
    } else if (answers.fabricPlacement === 'sleeves') {
      placementText = 'sleeves only';
    } else if (answers.fabricPlacement === 'custom' && answers.fabricPlacementDetails) {
      placementText = answers.fabricPlacementDetails;
    }
    parts.push(`**Fabric Type:** Custom fabric from provided image (to be used on: ${placementText})`);

    // Add other selected fabrics if any
    const otherFabrics = fabricTypes.filter(f => f !== 'customFabric' && f !== 'other');
    if (otherFabrics.length > 0) {
      if (answers.fabricPlacements && Object.keys(answers.fabricPlacements).length > 0) {
        const fabricDescriptions = otherFabrics.map(f => {
          const placement = answers.fabricPlacements?.[f];
          return placement ? `${f} (${placement})` : f;
        });
        parts.push(`**Additional Fabrics:** ${fabricDescriptions.join(', ')}`);
      } else {
        parts.push(`**Additional Fabrics:** ${otherFabrics.join(', ')}`);
      }
    }
  } else if (fabricTypes.length > 0) {
    // Multiple fabrics selected
    if (fabricTypes.length === 1) {
      parts.push(`**Fabric Type:** ${fabricTypes[0]}${answers.fabricTypeCustom ? ` (${answers.fabricTypeCustom})` : ''}`);
    } else {
      // Multiple fabrics with placements
      if (answers.fabricPlacements && Object.keys(answers.fabricPlacements).length > 0) {
        const fabricDescriptions = fabricTypes.filter(f => f !== 'other').map(f => {
          const placement = answers.fabricPlacements?.[f];
          return placement ? `${f} (${placement})` : f;
        });
        parts.push(`**Fabric Types:** ${fabricDescriptions.join(', ')}${answers.fabricTypeCustom ? ` - Other: ${answers.fabricTypeCustom}` : ''}`);
      } else {
        parts.push(`**Fabric Types:** ${fabricTypes.join(', ')}${answers.fabricTypeCustom ? ` (${answers.fabricTypeCustom})` : ''}`);
      }
    }
  }

  // Support both full questionnaire (hasTransparentParts) and simplified (transparentParts)
  // Map location codes to readable names
  const transparentLocationNames: { [key: string]: string } = {
    sleeves: 'sleeves',
    back: 'back',
    chest: 'chest/bodice',
    sides: 'sides',
    waist: 'waist',
    neckline: 'neckline',
    skirt: 'skirt',
    hem: 'hem/train',
  };

  if (answers.hasTransparentParts === 'yes' && answers.transparentPartsLocation) {
    const locations = answers.transparentPartsLocation.split(',').filter(Boolean);
    const readableLocations = locations.map(loc => transparentLocationNames[loc] || loc).join(', ');
    parts.push(`**Transparent Parts:** Yes, at ${readableLocations}`);
  } else if (answers.transparentParts === 'yes' && answers.transparentPartsLocation) {
    // Simplified questionnaire with location selection
    const locations = answers.transparentPartsLocation.split(',').filter(Boolean);
    const readableLocations = locations.map(loc => transparentLocationNames[loc] || loc).join(', ');
    parts.push(`**Transparent Parts:** Yes, at ${readableLocations}`);
  } else if (answers.transparentParts === 'yes') {
    parts.push(`**Transparent Parts:** Yes`);
  } else if (answers.transparentParts === 'no' || answers.hasTransparentParts === 'no') {
    parts.push(`**Transparent Parts:** No`);
  }

  // Section 6: Embellishments & Body Size
  if (answers.embellishments && answers.embellishments.length > 0) {
    let embellishmentText = `**Embellishments:** ${answers.embellishments.join(', ')}${answers.embellishmentsCustom ? ` (${answers.embellishmentsCustom})` : ''}`;
    if (answers.embellishmentPlacement) {
      embellishmentText += ` - Placement: ${answers.embellishmentPlacement}`;
    }
    parts.push(embellishmentText);
  }
  // Support both bodySize (full questionnaire) and bodyType (simplified questionnaire)
  const bodySize = answers.bodySize || answers.bodyType;
  const bodySizeCustom = answers.bodyTypeCustom;
  if (bodySize) {
    parts.push(`**Body Size:** ${bodySize}${bodySizeCustom ? ` (${bodySizeCustom})` : ''}`);
  }

  // Section 7: Colors
  if (answers.primaryColor) {
    parts.push(`**Primary Color:** ${answers.primaryColor}`);
  }
  if (answers.hasAdditionalColors === 'yes' && answers.additionalColors) {
    parts.push(`**Additional Colors:** ${answers.additionalColors}`);
  }

  // Section 9: Additional Notes (Q13 Design Style removed)
  // Support both additionalNotes (full questionnaire) and additionalDetails (simplified questionnaire)
  const additionalNotes = answers.additionalNotes || answers.additionalDetails;
  if (additionalNotes) {
    parts.push(`**Additional Notes:** ${additionalNotes}`);
  }

  return parts.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body: EnhancePromptRequest = await request.json();
    const {
      description,
      questionnaireAnswers,
      primaryFabricImage,
      secondaryFabricImage,
      secondaryFabricType,
      primaryFabricPlacement,
      secondaryFabricPlacement,
      secondaryFabricColor,
      referenceImage,
      referenceImagePart,
      referenceImageEntries,
    } = body;

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

    // Check if custom fabric image is provided (old workflow)
    const hasCustomFabric = questionnaireAnswers?.fabricType === 'customFabric' && questionnaireAnswers?.customFabricImage;

    // Check if own fabric workflow is being used
    const hasOwnFabricWorkflow = !!primaryFabricImage;

    // Build custom fabric instruction if needed
    let customFabricInstruction = '';

    // Own Fabric Workflow
    if (hasOwnFabricWorkflow) {
      const primaryPlacement = primaryFabricPlacement || 'the entire dress';

      if (secondaryFabricImage || secondaryFabricType) {
        // Has secondary fabric
        const secondaryPlacement = secondaryFabricPlacement || 'accent areas';
        const colorDesc = secondaryFabricColor ? ` in ${secondaryFabricColor} color` : '';
        const secondaryFabricDesc = secondaryFabricType
          ? `${secondaryFabricType} fabric${colorDesc}`
          : `the secondary fabric shown in the attached image${colorDesc}`;

        customFabricInstruction = `

CRITICAL CUSTOM FABRIC INSTRUCTION:
The client has provided their own fabric images. In your enhanced description, you MUST include the following instructions EXACTLY:

"Use the exact fabric pattern, texture, and colors shown in the attached PRIMARY fabric image for ${primaryPlacement}. Use ${secondaryFabricDesc} for ${secondaryPlacement}. Do NOT modify, recolor, or alter the fabric designs in any way. Apply both fabrics with photorealistic precision maintaining all original details, including pattern repeats, texture depth, and color accuracy. The fabrics should drape naturally and realistically on the dress."

This instruction must be seamlessly integrated into your description where you describe the fabric/materials.`;
      } else {
        // Only primary fabric
        customFabricInstruction = `

CRITICAL CUSTOM FABRIC INSTRUCTION:
The client has provided their own fabric image. In your enhanced description, you MUST include the following instruction EXACTLY:

"Use the exact fabric pattern, texture, and colors shown in the attached fabric image for ${primaryPlacement}. Do NOT modify, recolor, or alter the fabric design in any way. Apply it with photorealistic precision maintaining all original details, including the pattern repeat, texture depth, and color accuracy. The fabric should drape naturally and realistically on the dress."

This instruction must be seamlessly integrated into your description where you describe the fabric/materials.`;
      }
    }
    // Old Custom Fabric Workflow (from questionnaire)
    else if (hasCustomFabric && questionnaireAnswers) {
      let placementText = '';
      if (questionnaireAnswers.fabricPlacement === 'full') {
        placementText = 'the entire dress';
      } else if (questionnaireAnswers.fabricPlacement === 'bodice') {
        placementText = 'the bodice only';
      } else if (questionnaireAnswers.fabricPlacement === 'skirt') {
        placementText = 'the skirt only';
      } else if (questionnaireAnswers.fabricPlacement === 'sleeves') {
        placementText = 'the sleeves only';
      } else if (questionnaireAnswers.fabricPlacement === 'custom' && questionnaireAnswers.fabricPlacementDetails) {
        placementText = questionnaireAnswers.fabricPlacementDetails;
      }

      customFabricInstruction = `

CRITICAL CUSTOM FABRIC INSTRUCTION:
The client has provided a custom fabric image. In your enhanced description, you MUST include the following instruction EXACTLY:

"Use the exact fabric pattern, texture, and colors shown in the attached custom fabric image for ${placementText}. Do NOT modify, recolor, or alter the fabric design in any way. Apply it with photorealistic precision maintaining all original details, including the pattern repeat, texture depth, and color accuracy. The fabric should drape naturally and realistically on the dress."

This instruction must be seamlessly integrated into your description where you describe the fabric/materials.`;
    }


    // Build reference image instruction if provided
    const REFERENCE_PART_LABELS: Record<string, string> = {
      full_body: 'full dress / entire body',
      bodice: 'bodice / upper chest area',
      waist: 'waist area',
      back: 'back area',
      sleeves: 'sleeves',
      skirt: 'skirt',
      neckline: 'neckline',
    };
    let referenceImageInstruction = '';

    // New: multiple reference images
    const activeEntries = referenceImageEntries && referenceImageEntries.length > 0 ? referenceImageEntries : null;
    if (activeEntries) {
      const entryInstructions = activeEntries.map((entry: { image: string; parts: string[] }, i: number) => {
        const partLabels = entry.parts.map((p: string) => REFERENCE_PART_LABELS[p] || p).join(', ');
        const imagePosition = i === activeEntries.length - 1 ? 'LAST' : `reference image ${i + 1}`;
        return `Reference image ${i + 1} (${imagePosition} attached image) → applies to: [${partLabels}]\nFor each area listed above, the design must faithfully replicate: exact cut, structural construction, embellishment pattern, lace/fabric layering, and decorative detailing from that reference image. Do NOT copy silhouette, color, or fabric pattern from the reference — only the design of those specific areas.`;
      }).join('\n\n');
      referenceImageInstruction = `\n\nREFERENCE IMAGES INSTRUCTION (CRITICAL):\nThe client has provided ${activeEntries.length} reference image(s) attached at the end of this request.\n${entryInstructions}\nIntegrate these reference designs seamlessly into the overall dress description, adapted to the primary fabric.`;
    }
    // Legacy: single reference image
    else if (referenceImage && referenceImagePart) {
      const partLabel = REFERENCE_PART_LABELS[referenceImagePart] || referenceImagePart;
      referenceImageInstruction = `\n\nREFERENCE IMAGE INSTRUCTION (CRITICAL):\nThe client has provided a reference image attached to this request (it is the LAST image). It shows the exact design they want applied to the [${partLabel}] area.\nYou MUST include the following instruction, naturally integrated into the relevant section of your description:\n\n"The ${partLabel} design must faithfully replicate what is shown in the attached reference image: match the exact cut, structural construction, embellishment pattern, lace or fabric layering arrangement, and decorative detailing. Integrate this reference design seamlessly into the overall dress silhouette and adapt it to the primary fabric, while maintaining maximum visual similarity to the reference in the ${partLabel} area. Do NOT replicate any other element from the reference image — only the ${partLabel} design."\n\nThis instruction must be clearly and naturally integrated into your couture description.`;
    }

    const systemPrompt = `Your task is to create a detailed, professional, couture-level dress description based ONLY on the client's answers below.

IMPORTANT RULES:
- Describe the DRESS ONLY.
- Do NOT describe any background, environment, room, mannequin, lighting, camera position, or logo. These elements are handled separately.
- You may enhance clarity and professionalism, but you must NOT invent new features that the client did not imply.
- All improvements must reflect the client's intended style, materials, preferences, and notes.
- The goal is to transform the client's selections into one cohesive luxury-fashion description suitable for insertion into an AI image-generation prompt.${customFabricInstruction}${referenceImageInstruction}

Your output must be a single polished paragraph describing ONLY:
• silhouette
• proportions
• fabrics
• materials
• neckline
• back design (style, closure, embellishments on back)
• sleeves
• skirt shape
• embellishments (both front and back placement)
• transparency details
• colors
• movement & textile behavior
• aesthetic style

IMPORTANT - BACK DESIGN:
Warning: The back design must be perfectly consistent with the front design. The gown must read as one fully integrated, cohesive piece. Avoid creating any back design that feels disconnected, contradictory, or visually inconsistent with the front.
You MUST describe the back of the dress in detail, including:
- Back neckline style (open, covered, keyhole, illusion, deep V, etc.)
- Closure type (hidden zipper, buttons, corset lacing, etc.)
- Any embellishments or details on the back
- How the back design complements the front

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

