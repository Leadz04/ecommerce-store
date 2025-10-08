import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

type OptimizeMode = 'title' | 'description' | 'tags';

function buildPrompt(mode: OptimizeMode, input: { name?: string; description?: string; tags?: string[]; category?: string; brand?: string; }): string {
  const baseContext = `You are an expert Etsy SEO copywriter. Optimize for high CTR, clear benefits, relevant keywords, and Etsy search. Keep language natural and compliant.`;
  const productBits = `\nProduct Context:\n- Name: ${input.name || ''}\n- Description: ${input.description || ''}\n- Tags: ${(input.tags || []).join(', ')}\n- Category: ${input.category || ''}\n- Brand: ${input.brand || ''}`;

  if (mode === 'title') {
    return `${baseContext}${productBits}\nTask: Write an Etsy-optimized product title. 110-140 characters. No emojis. No ALL CAPS. Avoid keyword stuffing. Return ONLY the title text.`;
  }
  if (mode === 'description') {
    return `${baseContext}${productBits}\nTask: Write a compelling Etsy listing description (120-300 words), with a short scannable paragraph and bullet points for features/materials/care. Keep it concise. Return ONLY the description text.`;
  }
  // tags
  return `${baseContext}${productBits}\nTask: Generate up to 13 Etsy tags (2-3 words each), comma-separated. No quotes, no hashtags, no duplicates. Return ONLY the comma-separated list.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, input } = body as { mode: OptimizeMode; input: { name?: string; description?: string; tags?: string[]; category?: string; brand?: string; } };

    if (!mode || !['title', 'description', 'tags'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const prompt = buildPrompt(mode as OptimizeMode, input || {});

    const primaryKey = process.env.GEMINI_API_KEY;
    const secondaryKey = process.env.STAGE_GEMINI_API_KEY;

    async function callGeminiStream(apiKey?: string) {
      if (!apiKey) return { ok: false, status: 0, output: '', error: 'Missing API key' };
      try {
        const ai = new GoogleGenAI({ apiKey });
        const model = 'gemini-2.5-pro';
        const config = { thinkingConfig: { thinkingBudget: -1 } } as any;
        const contents = [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ];
        const stream = await (ai as any).models.generateContentStream({ model, config, contents });
        let output = '';
        for await (const chunk of stream as any) {
          const text = (chunk as any)?.text ?? '';
          if (typeof text === 'string') output += text;
        }
        if (!output.trim()) {
          return { ok: false, status: 200, output: '', error: 'Empty content from stream' };
        }
        return { ok: true, status: 200, output };
      } catch (e: any) {
        const detail = e?.message || String(e);
        return { ok: false, status: 500, output: '', error: detail };
      }
    }

    let primary = await callGeminiStream(primaryKey);
    if (!primary.ok) {
      const secondary = await callGeminiStream(secondaryKey);
      if (!secondary.ok) {
        const detail = { primaryStatus: primary.status, primaryDetail: primary.error, secondaryStatus: secondary.status, secondaryDetail: secondary.error };
        console.error('Gemini request failed with both keys', detail);
        return NextResponse.json({ error: 'Gemini request failed with both keys', detail }, { status: 502 });
      }
      return NextResponse.json({ output: secondary.output });
    }

    return NextResponse.json({ output: primary.output });
  } catch (err) {
    console.error('AI optimize error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


