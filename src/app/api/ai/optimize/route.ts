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
    return `${baseContext}${productBits}\nTask: Write a natural, buyer-focused Etsy product title. 

TITLE OPTIMIZATION:
- Length: 120-140 characters (optimal range - use full space wisely but naturally)
- Natural Flow: Read like a real product name a seller would write - NOT like an SEO keyword string
- Buyer Clarity: Immediately tell buyers WHAT the product is and WHY they might want it
- Format: Title Case - NO emojis, NO all caps, NO excessive punctuation
- Authenticity: Should sound like it was written by a real person, not an algorithm

KEYWORD INTEGRATION (Natural, Not Forced):
- Include important search terms buyers use, but weave them naturally into readable sentences
- Front-load the most important keyword (product type), but don't sacrifice readability
- Use natural language variations - don't repeat the same phrase multiple times
- Avoid keyword stuffing patterns that look automated

CRITICAL: The title must sound like a real seller wrote it naturally. If it reads like an SEO keyword list, rewrite it. Focus on helping buyers understand and trust the product.

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
  return `${baseContext}${productBits}\nTask: Generate EXACTLY 13 natural, buyer-focused Etsy tags that complement the title and help buyers discover the product.

CRITICAL REQUIREMENTS:
- Quantity: EXACTLY 13 tags (use all available slots - each tag is a discovery opportunity)
- Length: Maximum 20 characters per tag (Etsy's hard limit)
- Format: Multi-word phrases REQUIRED (e.g., "custom bracelet" not "custom" and "bracelet" separately)
- NO REPETITION: Do NOT repeat words or phrases already used in the title - tags should complement, not duplicate

TAG STRATEGY - Create a diverse, natural mix:
1. Alternative Product Names (2-3 tags): Different ways buyers might search for this product
2. Long-Tail Search Phrases (3-4 tags): Specific phrases buyers actually type
3. Style/Aesthetic Keywords (2-3 tags): Describe the look or feel
4. Use Case/Context (2-3 tags): When, where, or how it's used
5. Buyer Intent Phrases (2-3 tags): What problem it solves or who it's for

THINK LIKE A BUYER:
- What exact phrases would someone type into Etsy search?
- What alternative names might they use for this product?
- What problem does this product solve?
- What occasion or use case applies?
- What style or aesthetic matches?

CRITICAL RULES:
- ✅ Use all 13 tags - each one is valuable
- ✅ Multi-word phrases only (more specific = better)
- ✅ Natural language buyers actually search for
- ✅ Complement the title, don't repeat it
- ❌ NO single words (use phrases instead)
- ❌ NO repetition of title words/phrases
- ❌ NO generic terms ("gift", "item" - unless genuinely relevant)
- ❌ NO tags longer than 20 characters
- ❌ NO irrelevant keywords just to appear in more searches
- ❌ NO keyword stuffing patterns

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
        const model = 'gemini-1.5-flash';
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


