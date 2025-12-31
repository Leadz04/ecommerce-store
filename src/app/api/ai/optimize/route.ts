import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

type OptimizeMode = 'title' | 'description' | 'tags';

function buildPrompt(mode: OptimizeMode, input: { name?: string; description?: string; tags?: string[]; category?: string; brand?: string; }): string {
  const baseContext = `You are an expert Etsy SEO copywriter. Optimize for Etsy's two-phase search system:
  
PHASE 1 (Query Matching): Etsy uses holistic view (title, tags, attributes, categories, descriptions, first photo, reviews). Exact keyword matches rank higher.
PHASE 2 (Ranking): Etsy ranks using Context Specific Ranking (CSR) to show items shoppers are most likely to purchase.

RANKING FACTORS:
- Listing Quality/Engagement Rate (conversion: views → clicks → favorites → purchases)
- Customer Service Quality (4-5 star reviews, 48h message response, low case rate)
- Shipping Price: US domestic < $6 prioritized (high shipping is barrier)
- Recency: New/renewed listings get temporary boost
- Personalization: CSR learns individual buyer interests

Optimize for high CTR, clear benefits, relevant keywords, and natural language that helps buyers find and purchase. Keep language natural and compliant.`;
  const productBits = `\nProduct Context:\n- Name: ${input.name || ''}\n- Description: ${input.description || ''}\n- Tags: ${(input.tags || []).join(', ')}\n- Category: ${input.category || ''}\n- Brand: ${input.brand || ''}`;

  if (mode === 'title') {
    return `${baseContext}${productBits}\nTask: Write an Etsy-optimized product title. 

TITLE OPTIMIZATION:
- Short, clear, easy-to-read (max 140 chars)
- Place MOST IMPORTANT descriptive keywords FIRST (buyers only see first few words in search)
- For Google SEO: First 50-60 characters shown in search results - include critical traits upfront
- No emojis, no ALL CAPS, avoid keyword stuffing

Return ONLY the title text.`;
  }
  if (mode === 'description') {
    return `${baseContext}${productBits}\nTask: Write a compelling Etsy listing description. 

DESCRIPTION STRUCTURE:
- Place ESSENTIAL INFORMATION at TOP: sizes, colors, ordering directions
- Incorporate keywords casually in FIRST FEW SENTENCES in a way that sounds human
- Short hook, bullet list of features/materials/care, closing CTA
- Write informative and engaging content for buyers

CRITICAL - AVOID PROHIBITED PRACTICES:
- DO NOT copy the title verbatim into the description
- DO NOT list keywords instead of writing naturally
- DO NOT repeat the same words/phrases excessively
- Write natural, helpful content for buyers

Return ONLY the description text.`;
  }
  // tags
  return `${baseContext}${productBits}\nTask: Generate EXACTLY 13 Etsy tags (use all 13 - Etsy best practice), comma-separated, long tail keywords, max 20 characters per tag, multi-word phrases are REQUIRED (e.g., "custom bracelet" not "custom" and "bracelet" separately), tags are used in PHASE 1 (Query Matching) - help buyers find your listing, use "LONG TAIL" keywords: specific, descriptive phrases that convert better than generic terms, do NOT repeat phrases already covered by categories or attributes as separate tags, tags must be RELEVANT and SPECIFIC to this exact product, NO random or irrelevant keywords just to appear in more searches, NO repetition of the same phrases across tags, focus on buyer intent: what would a real shopper search for?, use natural, human-written language that sounds authentic, each tag should describe a distinct aspect (material, style, color, use case, occasion), avoid generic terms unless they genuinely apply to this product, NO keyword stuffing - but still use all 13 tags with relevant, specific phrases, DO NOT add random keywords to image alt text - this is keyword stuffing and unhelpful for screen readers. 

ETSY TAG GUIDELINES:
- USE ALL 13 TAGS (not optional - Etsy best practice)
- Maximum length: 20 characters per tag
- Multi-word phrases are REQUIRED (e.g., "custom bracelet" not "custom" and "bracelet" separately)
- If a desired keyword phrase is longer than 20 characters, break it into multiple phrasal tags
- Tags are used in PHASE 1 (Query Matching) - help buyers find your listing
- Use "LONG TAIL" keywords: specific, descriptive phrases that convert better than generic terms
- Do NOT repeat phrases already covered by categories or attributes as separate tags

CRITICAL ANTI-KEYWORD-STUFFING RULES:
- Tags must be RELEVANT and SPECIFIC to this exact product
- NO random or irrelevant keywords just to appear in more searches
- NO repetition of the same phrases across tags
- Focus on buyer intent: what would a real shopper search for?
- Use natural, human-written language that sounds authentic
- Each tag should describe a distinct aspect (material, style, color, use case, occasion)
- Avoid generic terms unless they genuinely apply to this product
- NO keyword stuffing - but still use all 13 tags with relevant, specific phrases

NOTE: Do NOT add random keywords to image alt text - this is keyword stuffing and unhelpful for screen readers.

Return ONLY the comma-separated list.`;
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
    const tertiaryKey = process.env.TEST_LEADZ07_FIRST_API_KEY;

    async function callGeminiStream(apiKey?: string) {
      if (!apiKey) return { ok: false, status: 0, output: '', error: 'Missing API key' };
      try {
        const ai = new GoogleGenAI({ apiKey });
        const model = 'gemini-2.5-flash-lite';
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
        const tertiary = await callGeminiStream(tertiaryKey);
        if (!tertiary.ok) {
          const detail = { 
            primaryStatus: primary.status, 
            primaryDetail: primary.error, 
            secondaryStatus: secondary.status, 
            secondaryDetail: secondary.error,
            tertiaryStatus: tertiary.status,
            tertiaryDetail: tertiary.error
          };
          console.error('Gemini request failed with all three keys', detail);
          return NextResponse.json({ error: 'Gemini request failed with all three keys', detail }, { status: 502 });
        }
        return NextResponse.json({ output: tertiary.output });
      }
      return NextResponse.json({ output: secondary.output });
    }

    return NextResponse.json({ output: primary.output });
  } catch (err) {
    console.error('AI optimize error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


