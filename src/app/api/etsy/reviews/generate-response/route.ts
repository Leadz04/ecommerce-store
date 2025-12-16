import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

interface GenerateResponseRequest {
  reviewText: string;
  rating: number;
  shopName?: string;
  sentiment?: string;
}

function buildResponsePrompt(
  reviewText: string,
  rating: number,
  shopName?: string,
  sentiment?: string
): string {
  const shopContext = shopName ? `Shop Name: ${shopName}\n` : '';
  const sentimentContext = sentiment ? `Review Sentiment: ${sentiment}\n` : '';

  return `You are a professional Etsy shop owner responding to a customer review. Generate a thoughtful, professional, and helpful response.

${shopContext}${sentimentContext}Customer Review: "${reviewText}"
Rating: ${rating}/5 stars

Guidelines for the response:
1. **Be authentic and personal** - Sound like a real person, not a robot
2. **Acknowledge the feedback** - Show you read and understood their review
3. **Be grateful** - Thank them for their purchase and feedback
4. **Address concerns** - If negative, acknowledge issues and offer solutions
5. **Stay positive** - Even for negative reviews, be professional and constructive
6. **Keep it concise** - 2-4 sentences typically, maximum 150 words
7. **Avoid** - Generic responses, excuses, being defensive, asking for review changes
8. **For negative reviews** - Show empathy, take responsibility, offer to help privately
9. **For positive reviews** - Express gratitude, mention specific things they liked

Generate ONLY a JSON object with this structure:
{
  "response": "The generated response text (professional and helpful)",
  "tone": "grateful" | "apologetic" | "enthusiastic" | "professional",
  "keyPoints": ["point1", "point2"], // Key points addressed in the response
  "length": 120 // Character count of the response
}

Make the response sound genuine and appropriate for the review.`;
}

async function generateResponseWithGemini(
  reviewText: string,
  rating: number,
  shopName?: string,
  sentiment?: string
): Promise<{ ok: boolean; data?: any; error?: string }> {
  const primaryKey = process.env.GEMINI_API_KEY;
  const secondaryKey = process.env.STAGE_GEMINI_API_KEY;
  const tertiaryKey = process.env.TEST_LEADZ07_FIRST_API_KEY;
  const apiKey = primaryKey || secondaryKey || tertiaryKey;

  if (!apiKey) {
    return { ok: false, error: 'Gemini API key not configured' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-lite';
    const config = {
      responseMimeType: 'application/json',
      maxOutputTokens: 512,
      temperature: 0.7, // Slightly higher for more creative, natural responses
    } as any;

    const prompt = buildResponsePrompt(reviewText, rating, shopName, sentiment);
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];

    const response = await (ai as any).models.generateContent({ model, config, contents });

    // Extract text from response
    let text = '';
    if (typeof response?.response?.text === 'function') {
      text = response.response.text();
    } else if (response?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = response.response.candidates[0].content.parts[0].text;
    } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = response.candidates[0].content.parts[0].text;
    }

    if (!text.trim()) {
      return { ok: false, error: 'Empty response from Gemini' };
    }

    const parsed = JSON.parse(text);
    return { ok: true, data: parsed };
  } catch (error: any) {
    console.error('[Generate Response] Gemini error:', error);
    return { ok: false, error: error?.message || 'Response generation failed' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateResponseRequest = await request.json();
    const { reviewText, rating, shopName, sentiment } = body;

    if (!reviewText || rating === undefined) {
      return NextResponse.json(
        { error: 'reviewText and rating are required' },
        { status: 400 }
      );
    }

    const result = await generateResponseWithGemini(reviewText, rating, shopName, sentiment);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || 'Response generation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: result.data,
    });
  } catch (error: any) {
    console.error('[Generate Response API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}

