import { NextRequest, NextResponse } from 'next/server';
import type { 
  GenerateMultipleImagesRequest, 
  GenerateMultipleImagesResponse,
  SingleImageResult 
} from '@/types';

/**
 * توليد صورة واحدة باستخدام البرومبت وصورة القماش
 */
async function generateSingleImage(
  prompt: string,
  index: number,
  primaryFabricImage: string,
  secondaryFabricImage?: string,
  model: string = 'google/gemini-2.5-flash-image'
): Promise<SingleImageResult> {
  try {
    // بناء البرومبت النهائي مع تعليمات الخلفية ونسبة الأبعاد
    const imagePrompt = `${prompt}

═══════════════════════════════════════════════════════════════════
IMAGE SPECIFICATIONS - MANDATORY
═══════════════════════════════════════════════════════════════════

**ASPECT RATIO: 9:16 (Portrait orientation)**
- Generate image in PORTRAIT format (taller than wide)
- Aspect ratio must be exactly 9:16 (like a smartphone in portrait mode)
- This ensures the full-length dress is displayed properly from neckline to hem

**DRESS LENGTH REQUIREMENT:**
- The dress MUST be at least KNEE-LENGTH or LONGER
- Show the COMPLETE dress from top to bottom
- NO mini dresses or short dresses allowed

**BACKGROUND AND PRESENTATION:**
- Display the dress on an elegant neutral background
- Professional fashion photography style
- The fabric must match EXACTLY the attached image
- Photorealistic rendering with natural fabric draping
- Center the dress in the frame with appropriate margins`;

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
    
    // استخراج الصورة من الاستجابة
    if (data.choices && data.choices[0]?.message?.content) {
      const content = data.choices[0].message.content;
      
      // البحث عن الصورة في المحتوى
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type === 'image_url' && item.image_url?.url) {
            return {
              index,
              prompt,
              imageData: item.image_url.url,
              success: true,
            };
          }
        }
      } else if (typeof content === 'string' && content.includes('data:image')) {
        // استخراج base64 من النص
        const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
        if (base64Match) {
          return {
            index,
            prompt,
            imageData: base64Match[0],
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

