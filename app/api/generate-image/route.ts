import { NextRequest, NextResponse } from 'next/server';
import type { GenerateImageRequest, GenerateImageResponse, GeminiImageModel, QuestionnaireAnswers } from '@/types';

// English label mappings for questionnaire option values
const ENGLISH_LABELS: Record<string, Record<string, string>> = {
  dressType: {
    evening: 'Evening Gown',
    wedding: 'Wedding Dress',
    engagement: 'Engagement Dress',
    party: 'Party Dress',
  },
  dressLength: {
    knee: 'Knee-length',
    long: 'Long',
    floor: 'Floor-length',
    train: 'With train',
  },
  designStyle: {
    classic: 'Classic',
    modern: 'Modern',
    romantic: 'Romantic',
    glamorous: 'Glamorous',
    boho: 'Boho',
    dramatic: 'Dramatic',
    minimalist: 'Minimalist',
  },
  backStyle: {
    covered: 'Fully covered',
    openBack: 'Open back',
    deepV: 'Deep V-back',
    keyhole: 'Keyhole back',
    illusion: 'Illusion back with embroidery',
    laceBack: 'Lace back',
    lowBack: 'Low back',
    crossBack: 'Cross back',
    bowBack: 'Bow back',
    corsetBack: 'Corset lace-up',
  },
  necklineType: {
    vNeck: 'V-neck',
    round: 'Round neck',
    sweetheart: 'Sweetheart',
    offShoulder: 'Off-shoulder',
    high: 'High neck',
    oneShoulder: 'One-shoulder',
    strapless: 'Strapless',
    square: 'Square neck',
  },
  sleeveType: {
    sleeveless: 'Sleeveless',
    short: 'Short sleeves',
    long: 'Long sleeves',
    sheer: 'Sheer sleeves',
    puff: 'Puff sleeves',
    offShoulder: 'Off-shoulder sleeves',
    lace: 'Lace sleeves',
  },
  skirtShape: {
    straight: 'Straight',
    tight: 'Tight',
    layered: 'Layered',
    pleated: 'Pleated',
    puffy: 'Puffy',
    mermaidTail: 'Mermaid Tail',
    overskirt: 'With Overskirt',
    peplum: 'With Peplum at Waist',
    sideDrape: 'Side Drape / Cascade',
  },
  embellishments: {
    sequins: 'Sequins',
    stones: 'Rhinestones (Crystals)',
    pearls: 'Pearls',
    embroideryBeads: 'Embroidery & Beads',
    decorativeLace: 'Decorative lace',
    '3dFlowers': '3D flowers',
    feathers: 'Feathers',
    bow: 'Bow',
    ruffles: 'Ruffles',
    belt: 'Belt',
  },
};

// Helper: get English label for a predefined option, or custom text as-is
function getEnglishLabel(category: string, value: string, customValue?: string): string {
  if (value === 'reference_match') return 'as shown in the reference image for this area';
  if (value === 'other' && customValue) return customValue;
  if (customValue) return customValue;
  return ENGLISH_LABELS[category]?.[value] || value;
}

// Helper function to format Design Specs from questionnaire answers
function formatDesignSpecs(answers: QuestionnaireAnswers): string {
  const lines: string[] = [];

  // Type
  if (answers.dressType) {
    lines.push(`Type: ${getEnglishLabel('dressType', answers.dressType, answers.dressTypeCustom)}`);
  }

  // Length
  if (answers.dressLength) {
    lines.push(`Length: ${getEnglishLabel('dressLength', answers.dressLength, answers.dressLengthCustom)}`);
  }

  // Style
  if (answers.designStyle) {
    lines.push(`Style: ${getEnglishLabel('designStyle', answers.designStyle, answers.designStyleCustom)}`);
  }

  // Back
  if (answers.backStyle) {
    lines.push(`Back: ${getEnglishLabel('backStyle', answers.backStyle, answers.backStyleCustom)}`);
  }

  // Neckline
  if (answers.necklineType) {
    lines.push(`Neckline: ${getEnglishLabel('necklineType', answers.necklineType, answers.necklineTypeCustom)}`);
  }

  // Sleeve Style
  if (answers.sleeveType) {
    lines.push(`Sleeve Style: ${getEnglishLabel('sleeveType', answers.sleeveType, answers.sleeveTypeCustom)}`);
  }

  // Skirt Shape
  if (answers.skirtShape) {
    lines.push(`Skirt Shape: ${getEnglishLabel('skirtShape', answers.skirtShape, answers.skirtShapeCustom)}`);
  }

  // Embellishment Placement & Intensity
  if (answers.embellishments && answers.embellishments.length > 0) {
    const embellishmentLabels = answers.embellishments
      .map(e => {
        if (e === 'other' && answers.embellishmentsCustom) return answers.embellishmentsCustom;
        return ENGLISH_LABELS.embellishments[e] || e;
      })
      .join(', ');

    let embellishmentDetails = embellishmentLabels;

    if (answers.embellishmentPlacements && Object.keys(answers.embellishmentPlacements).length > 0) {
      const placements = Object.entries(answers.embellishmentPlacements)
        .map(([type, placement]) => `${ENGLISH_LABELS.embellishments[type] || type}: ${placement}`)
        .join('; ');
      embellishmentDetails += ` (Placement: ${placements})`;
    } else if (answers.embellishmentPlacement) {
      embellishmentDetails += ` (Placement: ${answers.embellishmentPlacement})`;
    }

    lines.push(`Embellishment Placement & Intensity: ${embellishmentDetails}`);
  } else {
    lines.push(`Embellishment Placement & Intensity: None`);
  }

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateImageRequest = await request.json();
    const {
      prompt,
      fabricImage,
      primaryFabricImage,
      secondaryFabricImage,
      model = 'google/gemini-3.1-flash-image-preview',
      questionnaireAnswers,
      referenceImage,
      referenceImagePart,
      referenceImageEntries,
    } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'الرجاء إدخال برومبت' } as GenerateImageResponse,
        { status: 400 }
      );
    }

    // Print the enhanced prompt received from client
    console.log('\n🎨 البرومبت المُستلم في API لتوليد الصورة:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(prompt);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 الموديل المستخدم: ${model}`);
    console.log(`🖼️  صورة قماش أساسية: ${primaryFabricImage ? 'نعم ✅' : 'لا ❌'}`);
    console.log(`🖼️  صورة قماش ثانوية: ${secondaryFabricImage ? 'نعم ✅' : 'لا ❌'}`);
    console.log(`🖼️  صورة قماش قديمة: ${fabricImage ? 'نعم ✅' : 'لا ❌'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

    // Build Design Specs section if questionnaire answers are provided
    let designSpecsSection = '';
    if (questionnaireAnswers) {
      const designSpecs = formatDesignSpecs(questionnaireAnswers);
      if (designSpecs) {
        designSpecsSection = `

${designSpecs}

`;
      }
    }


    // Build reference image instruction for the image prompt
    const REFERENCE_PART_LABELS_IMG: Record<string, string> = {
      full_body: 'full dress / entire body',
      bodice: 'bodice / upper chest area',
      waist: 'waist area',
      back: 'back area',
      sleeves: 'sleeves',
      skirt: 'skirt',
      neckline: 'neckline',
    };

    // Count how many fabric images are attached (to calculate reference image positions)
    const fabricImageCount = (primaryFabricImage ? 1 : 0) + (secondaryFabricImage ? 1 : 0) + (fabricImage && !primaryFabricImage ? 1 : 0);

    let referenceImagePromptSection = '';
    const activeEntries = referenceImageEntries && referenceImageEntries.length > 0 ? referenceImageEntries : null;

    if (activeEntries) {
      // Multiple reference images
      const entryDescriptions = activeEntries.map((entry: { image: string; parts: string[] }, i: number) => {
        const partLabels = entry.parts.map((p: string) => REFERENCE_PART_LABELS_IMG[p] || p).join(', ');
        const imgNum = fabricImageCount + i + 1;
        return `• Image ${imgNum} (reference image ${i + 1}) → APPLIES TO: [${partLabels}]\n  Replicate from this reference: structural cut, embellishment pattern, lace/layering, and decorative details of [${partLabels}] ONLY.\n  Do NOT copy silhouette, color, or fabric from this reference.`;
      }).join('\n');
      referenceImagePromptSection = `

REFERENCE DESIGN INSTRUCTION (MANDATORY — HIGHEST PRIORITY):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The client has provided ${activeEntries.length} reference image(s) attached after the fabric image(s):
${entryDescriptions}
• Apply each reference faithfully to BOTH front and back views where the relevant area is visible
• The primary fabric image(s) define the FABRIC — the reference images define specific area DESIGNS ONLY
• Required fidelity level: HIGH — each referenced area must be immediately recognizable as matching its reference
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    } else if (referenceImage && referenceImagePart) {
      // Legacy single reference image
      const partLabel = REFERENCE_PART_LABELS_IMG[referenceImagePart] || referenceImagePart;
      const imageNumber = primaryFabricImage ? (secondaryFabricImage ? 'third' : 'second') : 'first';
      referenceImagePromptSection = `

REFERENCE DESIGN INSTRUCTION (MANDATORY — HIGHEST PRIORITY):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• A REFERENCE IMAGE is attached as the LAST (${imageNumber}) image in this request
• This reference image shows the EXACT design the client wants for: [${partLabel}]
• You MUST replicate from the reference image, applied to the [${partLabel}] area ONLY:
  — The structural cut and silhouette shape of the ${partLabel}
  — The embellishment pattern, density, and exact placement within the ${partLabel}
  — Any lace, fabric layering, or sheer details in the ${partLabel}
  — All decorative construction details visible in the reference (seams, ruching, boning lines, etc.)
• Apply this reference faithfully to BOTH front and back views wherever the ${partLabel} is visible
• The reference applies EXCLUSIVELY to the ${partLabel} — do NOT copy the overall silhouette, color, fabric pattern, or any other element from the reference image
• The primary fabric image(s) define the FABRIC — the reference image defines the ${partLabel} DESIGN ONLY
• Required fidelity level: HIGH — the ${partLabel} in the output must be immediately recognizable as matching the reference
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }

    const hasBackStyle = !!(questionnaireAnswers?.backStyle);

    const dualViewSection = hasBackStyle
      ? `═══════════════════════════════════════════════════════════════════
DUAL-VIEW PRESENTATION (FRONT & BACK) - CRITICAL REQUIREMENT
═══════════════════════════════════════════════════════════════════

**IMAGE LAYOUT:**
• Create a SINGLE image showing TWO separate mannequins/dress forms side by side
• RIGHT SIDE: Front view of the dress (facing the viewer)
• LEFT SIDE: Back view of the SAME dress (showing the back to the viewer)
• Both mannequins should be identical in pose and height
• Leave appropriate spacing between the two views

**MANNEQUIN REQUIREMENTS (for BOTH views):**
• white fabric torso.
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
• The front view (RIGHT) must clearly show: front neckline, bodice details, front embellishments`
      : `═══════════════════════════════════════════════════════════════════
SINGLE-VIEW PRESENTATION (FRONT ONLY) - CRITICAL REQUIREMENT
═══════════════════════════════════════════════════════════════════

**IMAGE LAYOUT:**
• Create a SINGLE image showing ONE mannequin/dress form
• FRONT view of the dress only (facing the viewer)
• Centered composition

**MANNEQUIN REQUIREMENTS:**
• white fabric torso.
• No arms.
• Headless mannequin.
• Full-length view showing the entire dress from neckline to hem.

**IMPORTANT - FRONT VIEW ONLY:**
• Show ONLY the front view — do NOT add a back view
• The front view must clearly show: front neckline, bodice details, front embellishments`;

    const renderingSpecs = hasBackStyle
      ? `Rendering Specifications:
• 2K photorealistic output.
• Centered view showing both mannequins (left: back view, right: front view).
• Clean composition, sharp edges, editorial quality.
• Strict consistency for mannequins, background, lighting, and logo.
• Only the dress design changes based on the enhanced client description.
• Photo size will be 1080*1350 px (instgarm post)`
      : `Rendering Specifications:
• 2K photorealistic output.
• Centered view showing one mannequin (front view).
• Clean composition, sharp edges, editorial quality.
• Strict consistency for mannequin, background, lighting, and logo.
• Only the dress design changes based on the enhanced client description.
• Photo size will be 1080*1350 px (instgarm post)`;

    const hardRulesBackLine = hasBackStyle
      ? `• MUST show BOTH front and back views in the same image.`
      : `• Show ONLY the front view — do NOT include a back view.`;

    const outputLine = hasBackStyle
      ? `Two full-body mannequins side by side (left: back view, right: front view) wearing the complete dress.`
      : `One full-body mannequin (front view) wearing the complete dress.`;

    const imagePrompt = `Generate a high-quality, fully coherent fashion design image of a dress based on the following enhanced client description:
${designSpecsSection}
${prompt}${customFabricInstruction}${referenceImagePromptSection}

---

Dress Rendering Requirements:
• The dress must appear as a complete, continuous, non-deformed garment with no missing parts.
• Maintain clean, symmetrical construction with a realistic silhouette.
• Ensure all fabric edges are intact, smooth, and not cut off.
• Highly detailed couture fashion design.
• Realistic textile rendering with natural folds, fabric texture, fabric flow, and proper reflections.
• Accurate color reproduction.
• The dress must fit the mannequin naturally and consistently.

${dualViewSection}

---

Logo Placement:
no logo or text in the photo


Background & Environment:
• Minimal luxury fashion studio.
• white background.
• Clean soft shadows under ${hasBackStyle ? 'both mannequins' : 'the mannequin'}.
• Consistent neutral lighting.
• No extra props or clutter.

${renderingSpecs}

Hard Rules (must follow):
• Do NOT crop the dress.
• Do NOT generate torn, incomplete, fragmented, or unrealistic fabric.
• Do NOT distort proportions.
• Dress must always be smooth, clean, symmetrical, and fully constructed.
• The garment must look wearable and professionally tailored.
${hardRulesBackLine}

Output:
${outputLine}`;

    // طباعة البرومبت النهائي الكامل الذي سيُرسل لتوليد الصورة
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║        🖼️  البرومبت النهائي المُرسل لتوليد الصورة 🖼️           ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log(imagePrompt);
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                    🔚 نهاية البرومبت النهائي                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

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

        // Append reference images to messageContent (always after fabric images)
        const referenceImagesToAppend: string[] = activeEntries
          ? activeEntries.map((e: { image: string; parts: string[] }) => e.image)
          : referenceImage ? [referenceImage] : [];

        if (referenceImagesToAppend.length > 0) {
          if (typeof messageContent === 'string') {
            messageContent = [
              { type: 'text', text: messageContent },
              ...referenceImagesToAppend.map((img: string) => ({ type: 'image_url', image_url: { url: img } })),
            ];
          } else if (Array.isArray(messageContent)) {
            messageContent = [
              ...messageContent,
              ...referenceImagesToAppend.map((img: string) => ({ type: 'image_url', image_url: { url: img } })),
            ];
          }
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
            model: model, // Use selected model (gemini-3.1-flash-image-preview or gemini-3-pro-image-preview)
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

