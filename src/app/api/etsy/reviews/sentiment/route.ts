import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

interface SentimentAnalysisRequest {
  reviewText: string;
  rating: number;
}

function buildSentimentPrompt(reviewText: string, rating: number): string {
  return `Analyze the sentiment of this Etsy product review and provide insights.

Review Text: "${reviewText}"
Rating: ${rating}/5 stars

Provide a JSON object with this structure:
{
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentScore": 0-100, // 0-40 negative, 41-60 neutral, 61-100 positive
  "keyTopics": ["topic1", "topic2", "topic3"], // Main topics mentioned
  "emotions": ["emotion1", "emotion2"], // Emotions detected (e.g., "satisfied", "disappointed", "happy")
  "needsResponse": boolean, // true if seller should respond (negative sentiment or concerns)
  "urgency": "low" | "medium" | "high", // How urgent a response is
  "summary": "Brief summary of the review sentiment",
  "suggestedAction": "Suggested action for the seller"
}

Be objective and helpful. Even 5-star reviews can mention areas for improvement.`;
}

async function analyzeSentimentWithGemini(reviewText: string, rating: number): Promise<{ ok: boolean; data?: any; error?: string }> {
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
      temperature: 0.3, // Lower temperature for more consistent sentiment analysis
    } as any;

    const prompt = buildSentimentPrompt(reviewText, rating);
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
    console.error('[Sentiment Analysis] Gemini error:', error);
    return { ok: false, error: error?.message || 'Sentiment analysis failed' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SentimentAnalysisRequest = await request.json();
    const { reviewText, rating } = body;

    if (!reviewText || !rating) {
      return NextResponse.json(
        { error: 'reviewText and rating are required' },
        { status: 400 }
      );
    }

    const result = await analyzeSentimentWithGemini(reviewText, rating);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || 'Sentiment analysis failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sentiment: result.data,
    });
  } catch (error: any) {
    console.error('[Sentiment Analysis API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
}

