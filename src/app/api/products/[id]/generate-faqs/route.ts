import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

const GEMINI_FAQ_MODEL = process.env.GEMINI_FAQ_MODEL?.trim() || 'gemini-2.5-pro';

interface FAQItem {
  question: string;
  answer: string;
}

interface GeminiFAQResponse {
  faqs: FAQItem[];
}

function buildFAQPrompt(product: {
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  price?: number;
  specifications?: any;
}): string {
  const specsText = product.specifications 
    ? JSON.stringify(product.specifications, null, 2)
    : 'No specifications provided';

  return `You are an expert e-commerce SEO content writer specializing in FAQ optimization for search engines and voice search. Generate 6-8 frequently asked questions (FAQs) optimized for Google's People Also Ask (PAA) panels and voice search queries.

Product Information:
- Name: ${product.name}
- Description: ${product.description || 'No description provided'}
- Category: ${product.category || 'Not specified'}
- Brand: ${product.brand || 'Not specified'}
- Price: ${product.price ? `$${product.price}` : 'Not specified'}
- Specifications: ${specsText}

SEO & Voice Search Optimization Requirements:
1. Questions must be NATURAL, COMPLETE SENTENCES that match how people speak (voice search style)
   - Good: "What are the key features of this product?" or "How do I use this product?"
   - Bad: "Key features?" or "How to use?"
2. Questions should cover: key features, usage instructions, specifications, compatibility, care/maintenance, shipping/returns, warranty
3. Answers must be OPTIMIZED FOR PAA PANELS:
   - Maximum 50 words OR 300 characters (whitespace included)
   - Typically 2-4 sentences
   - Can be in paragraph form, bullet points, or numbered lists
   - Must be concise, scannable, and directly answer the question
4. Use clear, conversational, customer-friendly language
5. Focus on information that helps customers make purchase decisions and removes conversion obstacles
6. Answers should be factual, helpful, and solve the customer's problem
7. If information is not available, keep the answer brief: "This information is not available for this product."

Question Format Guidelines:
- Use natural question formats: "What...", "How...", "Why...", "When...", "Where...", "Can I...", "Is this..."
- Match voice search patterns (complete sentences, conversational tone)
- Questions should be specific to this product, not generic

Answer Format Guidelines:
- Keep answers under 50 words (approximately 300 characters)
- Use bullet points or numbered lists when listing multiple items
- Start with the most important information
- Be direct and actionable
- Format lists as: "• Item 1\n• Item 2" or "1. Item 1\n2. Item 2"

Return ONLY a valid JSON object in this exact format:
{
  "faqs": [
    {
      "question": "What are the key features of this product?",
      "answer": "Brief, concise answer here (max 50 words, optimized for PAA panels)."
    },
    {
      "question": "How do I use this product?",
      "answer": "Brief, concise answer here (max 50 words, optimized for PAA panels)."
    }
  ]
}

Do not include any markdown formatting, code blocks, or additional text. Only return the JSON object.`;
}

async function callGeminiFAQ(prompt: string, apiKey?: string) {
  if (!apiKey) {
    return { ok: false, error: 'Missing Gemini API key' } as const;
  }

  try {
    console.log('[FAQ] Starting Gemini FAQ call with model:', GEMINI_FAQ_MODEL);
    const ai = new GoogleGenAI({ apiKey });
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    
    const response = await (ai as any).models.generateContent({
      model: GEMINI_FAQ_MODEL,
      contents,
      generationConfig: {
        temperature: 0.4, // Lower temperature for more focused, factual answers (optimized for PAA)
        maxOutputTokens: 800, // Reduced further to enforce 50-word limit per FAQ (6-8 FAQs × ~100 tokens each)
        responseMimeType: 'application/json',
      },
    });

    // Extract text from response - try multiple patterns
    let text = '';
    
    if (typeof response?.response?.text === 'function') {
      text = response.response.text();
    } else if (typeof response?.text === 'function') {
      text = response.text();
    } else if (response?.response?.candidates) {
      text = response.response.candidates
        ?.map((candidate: any) => {
          const parts = candidate?.content?.parts || [];
          return parts.map((part: any) => part?.text || '').join('');
        })
        .join('') || '';
    } else if (response?.candidates) {
      text = response.candidates
        ?.map((candidate: any) => {
          const parts = candidate?.content?.parts || [];
          return parts.map((part: any) => part?.text || '').join('');
        })
        .join('') || '';
    } else if (typeof response?.text === 'string') {
      text = response.text;
    } else if (response?.response?.text) {
      text = response.response.text;
    }

    console.log('[FAQ] Extracted text length:', text.length);

    if (!text.trim()) {
      console.log('[FAQ] ERROR: Empty text extracted from response');
      return { ok: false, error: 'Empty response from Gemini' } as const;
    }

    // Parse JSON response
    let parsed: GeminiFAQResponse;
    try {
      // Remove any markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('[FAQ] JSON parse error:', parseError);
      console.error('[FAQ] Raw response:', text.substring(0, 500));
      return { ok: false, error: 'Unable to parse Gemini JSON', raw: text } as const;
    }

    // Validate structure
    if (!parsed.faqs || !Array.isArray(parsed.faqs)) {
      return { ok: false, error: 'Invalid FAQ structure from Gemini', raw: text } as const;
    }

    // Validate each FAQ item and enforce PAA optimization (50 words/300 chars max)
    const validFAQs = parsed.faqs
      .filter((faq: any) => faq.question && faq.answer && faq.question.trim() && faq.answer.trim())
      .map((faq: any) => {
        // Ensure answers are optimized for PAA (max 50 words or 300 characters)
        const answer = faq.answer.trim();
        const wordCount = answer.split(/\s+/).length;
        const charCount = answer.length;
        
        // If answer is too long, truncate it intelligently
        if (wordCount > 50 || charCount > 300) {
          const sentences = answer.match(/[^.!?]+[.!?]+/g) || [answer];
          let truncated = '';
          let truncatedWordCount = 0;
          
          for (const sentence of sentences) {
            const sentenceWords = sentence.trim().split(/\s+/).length;
            if (truncatedWordCount + sentenceWords <= 50) {
              truncated += sentence.trim() + ' ';
              truncatedWordCount += sentenceWords;
            } else {
              break;
            }
          }
          
          // If still too long, just take first 300 characters
          if (truncated.length > 300 || truncatedWordCount > 50) {
            truncated = answer.substring(0, 297) + '...';
          }
          
          console.log(`[FAQ] Truncated answer from ${wordCount} words to ${truncatedWordCount} words for PAA optimization`);
          
          return {
            ...faq,
            answer: truncated.trim()
          };
        }
        
        return faq;
      });

    if (validFAQs.length === 0) {
      return { ok: false, error: 'No valid FAQs in response', raw: text } as const;
    }
    
    console.log('[FAQ] Validated', validFAQs.length, 'FAQs optimized for PAA panels (50 words/300 chars max)');

    return { ok: true, faqs: validFAQs, model: GEMINI_FAQ_MODEL } as const;
  } catch (error: any) {
    console.error('[FAQ] Gemini call error:', error);
    return { ok: false, error: error?.message || 'Gemini FAQ call failed' } as const;
  }
}

async function runGeminiFAQGeneration(product: any): Promise<{
  ok: boolean;
  faqs?: FAQItem[];
  error?: string;
  model?: string;
}> {
  const primaryKey = process.env.GEMINI_API_KEY;
  const secondaryKey = process.env.STAGE_GEMINI_API_KEY;
  const tertiaryKey = process.env.TEST_LEADZ07_FIRST_API_KEY;

  const availableKey = primaryKey || secondaryKey || tertiaryKey;
  if (!availableKey) {
    console.log('[FAQ] Gemini API key not configured');
    return {
      ok: false,
      error: 'Gemini API key not configured'
    };
  }

  const prompt = buildFAQPrompt({
    name: product.name || '',
    description: product.description || '',
    category: product.category || '',
    brand: product.brand || '',
    price: product.price || product.salePrice || undefined,
    specifications: product.specifications || {}
  });

  console.log('[FAQ] Starting Gemini FAQ generation for product:', product.name);

  // Try primary key first
  let response = await callGeminiFAQ(prompt, primaryKey || availableKey);
  
  if (!response.ok && secondaryKey) {
    console.log('[FAQ] Primary key failed, trying secondary key');
    response = await callGeminiFAQ(prompt, secondaryKey);
  }
  
  if (!response.ok && tertiaryKey) {
    console.log('[FAQ] Secondary key failed, trying tertiary key');
    response = await callGeminiFAQ(prompt, tertiaryKey);
  }

  if (!response.ok) {
    console.error('[FAQ] All Gemini API keys failed:', response.error);
    return {
      ok: false,
      error: response.error || 'Failed to generate FAQs with all API keys'
    };
  }

  console.log('[FAQ] Successfully generated', response.faqs?.length || 0, 'FAQs');
  return {
    ok: true,
    faqs: response.faqs,
    model: response.model
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Connect to database and fetch product
    await connectDB();
    const product = await Product.findById(productId).lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if FAQs already exist in database and are recent (within 30 days)
    // Use more efficient date comparison
    const cacheExpiryDays = 30;
    const cacheExpiryTime = cacheExpiryDays * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const now = Date.now();
    
    if (product.generatedFAQs && 
        Array.isArray(product.generatedFAQs) &&
        product.generatedFAQs.length > 0) {
      const latestFAQ = product.generatedFAQs[0];
      const generatedAt = latestFAQ.generatedAt instanceof Date 
        ? latestFAQ.generatedAt.getTime() 
        : new Date(latestFAQ.generatedAt).getTime();
      
      if (now - generatedAt < cacheExpiryTime) {
        console.log('[FAQ] Returning cached FAQs from database (age:', Math.floor((now - generatedAt) / (24 * 60 * 60 * 1000)), 'days)');
        return NextResponse.json({
          success: true,
          faqs: product.generatedFAQs.map((faq: any) => ({
            question: faq.question,
            answer: faq.answer
          })),
          model: latestFAQ.model,
          cached: true
        });
      } else {
        console.log('[FAQ] Cached FAQs expired, regenerating...');
      }
    }

    // Generate FAQs using Gemini
    const result = await runGeminiFAQGeneration(product);

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to generate FAQs'
        },
        { status: result.error === 'Gemini API key not configured' ? 503 : 502 }
      );
    }

    // Save FAQs to database (non-blocking)
    if (result.faqs && result.faqs.length > 0) {
      // Don't await - save in background to improve response time
      Product.findByIdAndUpdate(productId, {
        $set: {
          generatedFAQs: result.faqs.map((faq) => ({
            question: faq.question,
            answer: faq.answer,
            source: 'gemini',
            generatedAt: new Date(),
            model: result.model
          }))
        }
      }).then(() => {
        console.log('[FAQ] Saved', result.faqs.length, 'FAQs to database');
      }).catch((dbError) => {
        console.error('[FAQ] Failed to save FAQs to database:', dbError);
      });
    }

    return NextResponse.json({
      success: true,
      faqs: result.faqs || [],
      model: result.model,
      cached: false
    });
  } catch (error: any) {
    console.error('[FAQ] API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

