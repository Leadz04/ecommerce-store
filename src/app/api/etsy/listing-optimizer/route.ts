import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { needsEtsyDataRefresh } from '@/lib/etsy-compliance';
import { GoogleGenAI } from '@google/genai';

interface OptimizeRequest {
  listingId: string;
  mode: 'title' | 'description' | 'tags' | 'all';
  shopId: string;
}

function buildOptimizePrompt(
  mode: 'title' | 'description' | 'tags' | 'all',
  listingData: any
): string {
  const baseContext = `
You are an expert Etsy SEO and copywriting consultant specializing in optimizing Etsy listings for maximum visibility and sales.

Current listing information:
- Title: ${listingData.title || 'Not provided'}
- Description: ${listingData.description?.substring(0, 500) || 'Not provided'}
- Tags: ${(listingData.tags || []).join(', ') || 'Not provided'}
- Category: ${listingData.category_path?.join(' > ') || 'Not provided'}
- Price: ${listingData.price ? `${listingData.price.amount / listingData.price.divisor} ${listingData.price.currency_code}` : 'Not provided'}
- Materials: ${(listingData.materials || []).join(', ') || 'Not provided'}
- Who made: ${listingData.who_made || 'Not specified'}
- When made: ${listingData.when_made || 'Not specified'}
- Processing time: ${listingData.processing_min}-${listingData.processing_max} days
`;

  if (mode === 'title' || mode === 'all') {
    return `${baseContext}

Your task: Generate an optimized Etsy listing title following these best practices:

1. **Length:** 55-140 characters (Etsy shows ~55 characters in search, full title in listing)
2. **Keywords:** Include 2-3 primary keywords at the beginning
3. **Features:** Highlight unique selling points (handmade, vintage, customizable, etc.)
4. **Style:** Natural, compelling, not keyword-stuffed
5. **Format:** Title Case or Sentence case
6. **SEO:** Include relevant long-tail keywords that buyers actually search for

Generate ONLY a JSON object with this structure:
{
  "optimized_title": "Your optimized title here (55-140 characters)",
  "seo_score": 85,
  "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"],
  "keywords_used": ["keyword1", "keyword2", "keyword3"],
  "character_count": 95
}

Focus on making the title compelling, searchable, and conversion-focused.`;
  }

  if (mode === 'description' || mode === 'all') {
    return `${baseContext}

Your task: Generate an optimized Etsy listing description following these best practices:

1. **Structure:** 
   - Opening hook (first 2-3 lines should grab attention)
   - Product details and benefits
   - Materials and specifications
   - Care instructions (if applicable)
   - Shipping information
   - Call-to-action

2. **Length:** 200-1000 words (detailed but scannable)
3. **SEO:** Naturally incorporate relevant keywords
4. **Format:** Use line breaks, bullet points, and emojis strategically (but don't overuse)
5. **Tone:** Friendly, professional, authentic (Etsy sellers value authenticity)
6. **Compliance:** Must comply with Etsy policies (no external links in first line, no prohibited content)

Generate ONLY a JSON object with this structure:
{
  "optimized_description": "Your optimized description here...",
  "seo_score": 85,
  "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"],
  "word_count": 450,
  "readability_score": "Good"
}

Make it engaging, informative, and optimized for both search engines and human readers.`;
  }

  if (mode === 'tags' || mode === 'all') {
    return `${baseContext}

Your task: Generate optimized Etsy tags following these best practices:

1. **Quantity:** Etsy allows 13 tags, each up to 20 characters
2. **Keywords:** Mix of:
   - Primary keywords (high search volume)
   - Long-tail keywords (specific, lower competition)
   - Style/theme keywords
   - Material keywords
   - Occasion keywords (if applicable)
   - Buyer intent keywords (gift, wedding, home decor, etc.)

3. **Research:** Think like a buyer - what would they search for?
4. **Variety:** Use different variations (singular/plural, synonyms)
5. **Relevance:** All tags must be relevant to the actual product

Generate ONLY a JSON object with this structure:
{
  "optimized_tags": ["tag1", "tag2", "tag3", ...],
  "seo_score": 85,
  "improvements": ["Improvement 1", "Improvement 2"],
  "tags_by_category": {
    "primary_keywords": ["tag1", "tag2"],
    "long_tail": ["tag3", "tag4"],
    "style": ["tag5", "tag6"],
    "materials": ["tag7"],
    "occasions": ["tag8"]
  }
}

Provide exactly 13 tags, each under 20 characters, that maximize discoverability.`;
  }

  // mode === 'all'
  return `${baseContext}

Your task: Optimize the entire Etsy listing (title, description, and tags) following best practices.

Generate ONLY a JSON object with this structure:
{
  "title": {
    "optimized_title": "Your optimized title here",
    "seo_score": 85,
    "improvements": ["Improvement 1", "Improvement 2"],
    "character_count": 95
  },
  "description": {
    "optimized_description": "Your optimized description here...",
    "seo_score": 85,
    "improvements": ["Improvement 1", "Improvement 2"],
    "word_count": 450
  },
  "tags": {
    "optimized_tags": ["tag1", "tag2", ...],
    "seo_score": 85,
    "improvements": ["Improvement 1"],
    "tags_by_category": {
      "primary_keywords": ["tag1", "tag2"],
      "long_tail": ["tag3"],
      "style": ["tag4"]
    }
  },
  "overall_seo_score": 85,
  "priority_improvements": ["Most important improvement", "Second priority"]
}

Optimize all three components for maximum visibility and conversion.`;
}

async function callGeminiOptimize(prompt: string): Promise<{ ok: boolean; data?: any; error?: string }> {
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
      maxOutputTokens: 2048,
      temperature: 0.7,
    } as any;

    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

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

    // Parse JSON response
    const parsed = JSON.parse(text);
    return { ok: true, data: parsed };
  } catch (error: any) {
    console.error('[Etsy Optimize] Gemini error:', error);
    return { ok: false, error: error?.message || 'Gemini optimization failed' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: OptimizeRequest = await request.json();
    const { listingId, mode, shopId } = body;

    if (!listingId || !mode || !shopId) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId, mode, and shopId are required' },
        { status: 400 }
      );
    }

    if (!['title', 'description', 'tags', 'all'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be: title, description, tags, or all' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get shop and create EtsyAPI instance
    const shop = await EtsyShop.findOne({ shopId, isActive: true });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found or inactive' }, { status: 404 });
    }

    const etsyAPI = new EtsyAPI(
      shop.accessToken,
      shop.shopId,
      shop.refreshToken,
      async (newTokens) => {
        await EtsyShop.updateOne(
          { shopId: shop.shopId },
          {
            $set: {
              accessToken: newTokens.access_token,
              refreshToken: newTokens.refresh_token,
              tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
            }
          }
        );
      }
    );

    // Fetch current listing data from DB first
    const dbListing = await EtsyListing.findOne({ etsyListingId: listingId }).lean();
    const needsRefresh = !dbListing || needsEtsyDataRefresh(dbListing.lastSyncedAt, 'listing');
    
    let listingData: any;
    if (!needsRefresh && dbListing) {
      // Use DB data, transform to match API format
      listingData = {
        listing_id: parseInt(listingId),
        title: dbListing.title || '',
        description: dbListing.description || '',
        tags: dbListing.tags || [],
        materials: dbListing.materials || [],
        category_path: dbListing.categoryPath || [],
        price: {
          amount: Math.round(dbListing.price * 100),
          divisor: 100,
          currency_code: dbListing.currency || 'USD',
        },
        quantity: dbListing.inventory?.quantity || 0,
        state: dbListing.state,
        views: dbListing.views || 0,
        num_favorers: dbListing.numFavorers || 0,
      };
    } else {
      // Fetch from API and update DB
      listingData = await etsyAPI.getListing(listingId);
      
      // Update DB
      await EtsyListing.findOneAndUpdate(
        { etsyListingId: listingId },
        {
          $set: {
            userId: shop.userId,
            shopId: shop.shopId,
            etsyListingId: listingId,
            title: listingData.title,
            description: listingData.description,
            price: listingData.price.amount / listingData.price.divisor,
            currency: listingData.price.currency_code,
            state: listingData.state,
            tags: listingData.tags || [],
            materials: listingData.materials || [],
            categoryPath: listingData.category_path || [],
            inventory: { quantity: listingData.quantity || 0 },
            views: listingData.views || 0,
            numFavorers: listingData.num_favorers || 0,
            lastSyncedAt: new Date(),
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Build prompt based on mode
    const prompt = buildOptimizePrompt(mode, listingData);

    // Call AI optimization
    const result = await callGeminiOptimize(prompt);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || 'Optimization failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mode,
      listingId,
      original: {
        title: listingData.title,
        description: listingData.description,
        tags: listingData.tags || [],
      },
      optimized: result.data,
    });
  } catch (error: any) {
    console.error('[Etsy Listing Optimizer] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to optimize listing' },
      { status: 500 }
    );
  }
}

