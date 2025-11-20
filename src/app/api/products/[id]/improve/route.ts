import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

const IMPROVEMENT_MODEL = process.env.GEMINI_POLICY_MODEL?.trim() || 'gemini-2.5-pro';

interface GeminiImprovementBlock {
  suggestion?: string;
  reasoning?: string;
  checklist?: string[];
}

interface GeminiImprovementResult {
  summary?: string;
  notes?: string[];
  title?: GeminiImprovementBlock;
  description?: GeminiImprovementBlock;
  tags?: {
    suggestion?: string[] | string;
    reasoning?: string;
  };
}

function normalizeTags(value?: string[] | string): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.map(tag => tag.trim()).filter(Boolean).slice(0, 13);
  }
  return value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, 13);
}

function safeJsonParse<T = any>(raw: string): T | null {
  try {
    return JSON.parse(raw);
  } catch {
    const fallback = raw.match(/\{[\s\S]*\}/);
    if (fallback) {
      try {
        return JSON.parse(fallback[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function buildImprovementPrompt(product: any, reviewSummary: any) {
  return [
    'You are an Etsy listing optimizer and policy compliance expert.',
    'Improve the listing so it converts better AND stays within Etsy guidelines.',
    '',
    'ETSY TWO-PHASE SEARCH SYSTEM:',
    'PHASE 1 (Query Matching): Etsy uses holistic view (title, tags, attributes, categories, descriptions, first photo, reviews) to match buyer queries.',
    '   - Listings with exact keyword matches may rank higher due to perceived relevancy',
    'PHASE 2 (Ranking): Etsy ranks listings using Context Specific Ranking (CSR) to show items shoppers are most likely to purchase.',
    '',
    'RANKING FACTORS (Phase 2):',
    '1. Listing Quality/Engagement Rate: How well listing converts (views → clicks → favorites → purchases)',
    '   - Multiple high-quality photos improve score',
    '   - Clear return policies improve score',
    '2. Customer Service Quality: Average review rating (4-5 stars), message response rate (within 48h), case rate',
    '3. Shipping Price: US domestic listings with shipping < $6 are prioritized (high shipping is barrier to purchase)',
    '4. Recency: New or renewed listings get small temporary boost to gather buyer interaction data',
    '5. Personalization: CSR technology learns individual buyer interests from habits across Etsy',
    '',
    'Focus on natural language, benefits, materials, target buyer, and remove spammy wording.',
    '',
    'Return ONLY valid JSON using this schema:',
    `{
  "summary": "1-2 sentence overview of the improvements",
  "title": { "suggestion": "New title", "reasoning": "Why it helps compliance/conversion" },
  "description": { "suggestion": "Improved multiline description", "reasoning": "Key changes made" },
  "tags": { "suggestion": ["tag1","tag2"], "reasoning": "How the tags align with Etsy search" },
  "notes": ["Short actionable note 1", "Short actionable note 2"]
}`,
    '',
    'Constraints:',
    '- Title <= 140 chars, short and clear. Place MOST IMPORTANT descriptive keywords FIRST (buyers only see first few words in search). (Used in Phase 1: Query Matching)',
    '  - For Google SEO: First 50-60 characters are shown in search results, include critical traits upfront',
    '- Description: Essential information (sizes, colors, ordering directions) at TOP. Short hook, bullet list of features/materials/care, closing CTA. (Used in Phase 2: Ranking)',
    '  - Incorporate keywords casually in FIRST FEW SENTENCES in a way that sounds human',
    '- Tags: USE ALL 13 TAGS (not just up to 13). Max 20 chars each, multi-word phrases REQUIRED (e.g., "custom bracelet" not "custom" and "bracelet"). (Used in Phase 1: Query Matching)',
    '  - Use "long tail" keywords: specific, descriptive phrases that convert better than generic terms',
    '  - Do NOT repeat phrases already covered by categories or attributes as separate tags',
    '- Attributes: Category-specific data points (color, holiday, occasion, sizing) act like tags and power filters. Use relevant attributes.',
    '',
    'CRITICAL TAG RULES (Anti-Keyword-Stuffing):',
    '- USE ALL 13 TAGS (Etsy best practice - not optional)',
    '- Tags MUST be RELEVANT and SPECIFIC to this exact product',
    '- Maximum 20 characters per tag (break long phrases into multiple phrasal tags)',
    '- Multi-word phrases are REQUIRED (e.g., "custom bracelet" not "custom" and "bracelet" separately)',
    '- Use "LONG TAIL" keywords: specific, descriptive phrases that convert better than generic terms',
    '- Do NOT repeat phrases already covered by categories or attributes as separate tags',
    '- NO random or irrelevant keywords to trick search engines',
    '- NO repetition of the same phrases across multiple tags',
    '- Focus on buyer intent: what would real shoppers actually search for?',
    '- Use natural, human-written language - avoid robotic keyword lists',
    '- Each tag should describe a distinct aspect (material, style, color, use case, occasion)',
    '- Avoid generic terms unless they genuinely apply to this specific product',
    '- Reference the policy review summary to avoid repeated violations.',
    '',
    'DESCRIPTION OPTIMIZATION (Phase 2: Ranking):',
    '- Place ESSENTIAL INFORMATION at TOP: sizes, colors, ordering directions',
    '- Incorporate keywords casually in FIRST FEW SENTENCES in a way that sounds human',
    '- Descriptions are considered during Ranking phase for CSR (Context Specific Ranking)',
    '- Write informative and engaging content for buyers first, naturally incorporate search terms',
    '- Avoid keyword stuffing - natural language that helps ranking',
    '',
    'PHOTOS (Critical for Engagement Rate):',
    '- FIRST PHOTO is crucial for driving clicks: high-resolution, clear, avoid collages or text overlays',
    '- Using ALL 10 AVAILABLE PHOTOS may increase conversion rate',
    '- Multiple high-quality photos improve listing quality score',
    '',
    'SHOP POLICIES & PROCESSING:',
    '- Clear shop policies (shipping, returns, exchanges) have positive effect on search placement',
    '- Accurate processing times influence buyer purchase decision',
    '- Offering shipping upgrades can improve conversion',
    '',
    'GOOGLE SEO (External Search Optimization):',
    '- Google shows first 50-60 characters of page title in search results - include critical traits upfront',
    '- Add descriptive alt text to images (helps Google understand content, assists visually impaired users)',
    '- Shop description (under shop name) and About section: highlight expertise, authority, trustworthiness',
    '- Share brand story and process in About section',
    '- Create helpful, informative content (Google\'s goal is to help people find what they\'re looking for)',
    '',
    'PROHIBITED KEYWORD PRACTICES (AVOID - Can prevent listings from search):',
    '- DO NOT mislabel products (e.g., "cashmere" when not cashmere) - use accurate descriptors',
    '- DO NOT copy title verbatim into description',
    '- DO NOT list keywords instead of writing natural descriptions',
    '- DO NOT repeat same words/phrases excessively',
    '- DO NOT add irrelevant or unrelated keywords',
    '- DO NOT add random keywords to image alt text',
    '- DO NOT add irrelevant attributes',
    '',
    'CONSEQUENCES: Google may rank lower, Etsy may hide listings from search.',
    '',
    'SHOP QUALITY FACTORS (Affect Phase 2: Ranking):',
    'Etsy considers Shop Quality during ranking to build trust with shoppers:',
    '1. Shop Icon: Should have a shop icon to represent business and brand (builds trust)',
    '2. Shop Language/Translations: Add your own translations for additional languages (higher quality than machine translations)',
    '3. Shop Policies: Clear policies for shipping, returns, exchanges (critical for buyers, positive effect on search placement)',
    '   - Using Etsy\'s shop policies template provides additional boost',
    '',
    'CUSTOMER SERVICE QUALITY FACTORS (Heavily influence ranking):',
    '1. Average review rating: Aim for 4 or 5 stars',
    '2. Message response rate: Respond to initial messages within 48 hours',
    '3. Case rate: Keep case rate low (past 3 months, excluding cases over $250 or covered by Etsy Purchase Protection)',
    '',
    'When suggesting improvements, consider how the listing can support these shop quality factors.',
    '',
    'Product JSON:',
    JSON.stringify(
      {
        name: product.name,
        description: product.description,
        category: product.category,
        brand: product.brand,
        tags: product.tags,
        price: product.price,
        stockCount: product.stockCount,
      },
      null,
      2
    ),
    '',
    'Policy Review Snapshot:',
    JSON.stringify(reviewSummary || {}, null, 2),
  ].join('\n');
}

async function runGeminiImprovement(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.STAGE_GEMINI_API_KEY;
  if (!apiKey) {
    console.log('[Improve] Gemini API key not configured');
    return { ok: false, error: 'Gemini API key not configured' } as const;
  }

  try {
    console.log('[Improve] Starting Gemini improvement call with model:', IMPROVEMENT_MODEL);
    const ai = new GoogleGenAI({ apiKey });
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    const response = await (ai as any).models.generateContent({
      model: IMPROVEMENT_MODEL,
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });
    
    console.log('[Improve] Raw response type:', typeof response);
    console.log('[Improve] Response keys:', Object.keys(response || {}));
    console.log('[Improve] response.response exists:', !!response?.response);
    console.log('[Improve] response.text exists:', typeof response?.text);
    console.log('[Improve] response.response?.text exists:', typeof response?.response?.text);
    console.log('[Improve] response.response?.candidates exists:', !!response?.response?.candidates);
    
    let text = '';
    
    // Try different response structures
    if (typeof response?.response?.text === 'function') {
      console.log('[Improve] Using response.response.text()');
      text = response.response.text();
    } else if (typeof response?.text === 'function') {
      console.log('[Improve] Using response.text()');
      text = response.text();
    } else if (response?.response?.candidates) {
      console.log('[Improve] Extracting from candidates');
      text = response.response.candidates
        ?.map((candidate: any) => {
          const parts = candidate?.content?.parts || [];
          return parts.map((part: any) => part?.text || '').join('');
        })
        .join('') || '';
    } else if (response?.candidates) {
      console.log('[Improve] Extracting from response.candidates');
      text = response.candidates
        ?.map((candidate: any) => {
          const parts = candidate?.content?.parts || [];
          return parts.map((part: any) => part?.text || '').join('');
        })
        .join('') || '';
    } else {
      console.log('[Improve] Attempting to stringify response for debugging');
      try {
        const responseStr = JSON.stringify(response, null, 2);
        console.log('[Improve] Full response structure:', responseStr.substring(0, 500));
      } catch (e) {
        console.log('[Improve] Could not stringify response:', e);
      }
    }
    
    console.log('[Improve] Extracted text length:', text.length);
    console.log('[Improve] Text preview:', text.substring(0, 200));
    
    if (!text.trim()) {
      console.log('[Improve] ERROR: Empty text extracted from response');
      return { ok: false, error: 'Empty response from Gemini' } as const;
    }
    
    console.log('[Improve] Parsing JSON...');
    const parsed = safeJsonParse<GeminiImprovementResult>(text);
    if (!parsed) {
      console.log('[Improve] ERROR: Failed to parse JSON. Raw text:', text.substring(0, 500));
      return { ok: false, error: 'Unable to parse Gemini JSON', raw: text } as const;
    }
    
    console.log('[Improve] Successfully parsed improvements');
    return { ok: true, parsed, raw: text } as const;
  } catch (error: any) {
    console.error('[Improve] Exception in runGeminiImprovement:', error);
    console.error('[Improve] Error stack:', error?.stack);
    return { ok: false, error: error?.message || 'Gemini improvement call failed' } as const;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Improve] POST request received');
    await connectDB();
    const { id } = await params;
    console.log('[Improve] Product ID:', id);
    
    const product = await Product.findById(id);

    if (!product) {
      console.log('[Improve] Product not found:', id);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    console.log('[Improve] Product found:', product.name);
    const body = await request.json().catch(() => ({}));
    const { reviewSummary } = body || {};
    console.log('[Improve] Review summary provided:', !!reviewSummary);

    const prompt = buildImprovementPrompt(product, reviewSummary);
    console.log('[Improve] Prompt length:', prompt.length);
    
    const result = await runGeminiImprovement(prompt);
    console.log('[Improve] Improvement result ok:', result.ok);

    if (!result.ok) {
      const status =
        result.error === 'Gemini API key not configured' ? 503 : 502;
      console.log('[Improve] Returning error response:', result.error);
      return NextResponse.json(
        { error: result.error, raw: (result as any).raw },
        { status }
      );
    }

    const parsed = result.parsed || {};
    const improvements: GeminiImprovementResult = {
      summary: parsed.summary,
      notes: parsed.notes,
      title: parsed.title,
      description: parsed.description,
      tags: parsed.tags
        ? {
            suggestion: normalizeTags(parsed.tags.suggestion),
            reasoning: parsed.tags.reasoning,
          }
        : undefined,
    };

    console.log('[Improve] Returning success with improvements');
    return NextResponse.json({
      success: true,
      productId: product._id.toString(),
      improvements,
    });
  } catch (error) {
    console.error('[Improve] Product improvement error:', error);
    console.error('[Improve] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

