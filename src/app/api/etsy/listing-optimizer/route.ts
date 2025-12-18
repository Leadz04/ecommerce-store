import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { needsEtsyDataRefresh } from '@/lib/etsy-compliance';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/etsy-cache';
import { GoogleGenAI } from '@google/genai';

interface OptimizeRequest {
  listingId: string;
  mode: 'title' | 'description' | 'tags' | 'all';
  shopId: string;
  formData?: {
    title?: string;
    description?: string;
    tags?: string;
    materials?: string;
    taxonomy_id?: string;
    price?: string;
    quantity?: number;
    who_made?: string;
    when_made?: string;
    processing_min?: number;
    processing_max?: number;
  };
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

You are an expert Etsy SEO and copywriting consultant. Your task is to optimize the ENTIRE Etsy listing (title, description, AND tags) following Etsy's official Seller Handbook guidelines and best practices.

ETSY'S TWO-PHASE SEARCH SYSTEM:
PHASE 1 (Query Matching): Etsy uses holistic view (title, tags, attributes, categories, descriptions, first photo, reviews). Exact keyword matches rank higher.
PHASE 2 (Ranking): Etsy ranks using Context Specific Ranking (CSR) to show items shoppers are most likely to purchase.

RANKING FACTORS:
- Listing Quality/Engagement Rate (conversion: views → clicks → favorites → purchases)
- Customer Service Quality (4-5 star reviews, 48h message response, low case rate)
- Shipping Price: US domestic < $6 prioritized (high shipping is barrier)
- Recency: New/renewed listings get temporary boost
- Personalization: CSR learns individual buyer interests

TITLE OPTIMIZATION REQUIREMENTS:
1. Length: 55-140 characters (Etsy shows ~55 characters in search, full title in listing)
2. Keywords: Include 2-3 primary keywords at the BEGINNING (buyers only see first few words)
3. For Google SEO: First 50-60 characters shown in search results - include critical traits upfront
4. Features: Highlight unique selling points (handmade, vintage, customizable, etc.)
5. Style: Natural, compelling, NOT keyword-stuffed
6. Format: Title Case or Sentence case
7. NO emojis, NO ALL CAPS

DESCRIPTION OPTIMIZATION REQUIREMENTS:
1. Structure (CRITICAL - follow this order):
   - Opening hook (first 2-3 lines should grab attention)
   - ESSENTIAL INFORMATION at TOP: sizes, colors, ordering directions, key specifications
   - Product details and benefits
   - Materials and specifications
   - Care instructions (if applicable)
   - Shipping information
   - Call-to-action

2. Length: 200-1000 words (detailed but scannable)
3. SEO: Incorporate keywords NATURALLY in FIRST FEW SENTENCES in a way that sounds human
4. Format: Use line breaks, bullet points, and emojis strategically (but don't overuse)
5. Tone: Friendly, professional, authentic (Etsy sellers value authenticity)
6. CRITICAL COMPLIANCE RULES:
   - DO NOT copy the title verbatim into the description
   - DO NOT list keywords instead of writing naturally
   - DO NOT repeat the same words/phrases excessively
   - NO external links in first line
   - NO prohibited content
   - Write natural, helpful content for buyers

TAGS OPTIMIZATION REQUIREMENTS (CRITICAL):
1. Quantity: MUST USE ALL 13 TAGS (Etsy best practice - NOT optional)
2. Length: Maximum 20 characters per tag
3. Format: Multi-word phrases REQUIRED (e.g., "custom bracelet" not "custom" and "bracelet" separately)
4. Keywords: Mix of:
   - Primary keywords (high search volume)
   - Long-tail keywords (specific, descriptive phrases that convert better than generic terms)
   - Style/theme keywords
   - Material keywords
   - Occasion keywords (if applicable)
   - Buyer intent keywords (gift, wedding, home decor, etc.)
5. Research: Think like a buyer - what would they search for?
6. Variety: Use different variations (singular/plural, synonyms)
7. Relevance: All tags MUST be relevant to the actual product
8. DO NOT repeat phrases already covered by categories or attributes as separate tags

PROHIBITED PRACTICES (Can prevent listings from being shown in search):
- DO NOT mislabel products (e.g., calling something "cashmere" when it is not cashmere)
- DO NOT use lots of irrelevant keywords hoping to appear in more searches
- DO NOT add unrelated keywords hoping to rank for those terms
- DO NOT add random keywords to image alt text (unhelpful for screen readers)
- Focus on accurate descriptors and natural language that helps buyers

Generate ONLY a JSON object with this EXACT structure (all fields are REQUIRED):
{
  "title": {
    "optimized_title": "Your optimized title here (55-140 characters, keywords at beginning)",
    "seo_score": 85,
    "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"],
    "keywords_used": ["keyword1", "keyword2", "keyword3"],
    "character_count": 95
  },
  "description": {
    "optimized_description": "Your FULL optimized description here (200-1000 words). Start with essential info (sizes, colors, ordering). Include product details, materials, care instructions, shipping info, and a call-to-action. Write naturally and engagingly.",
    "seo_score": 85,
    "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"],
    "word_count": 450,
    "readability_score": "Good"
  },
  "tags": {
    "optimized_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13"],
    "seo_score": 85,
    "improvements": ["Improvement 1", "Improvement 2"],
    "tags_by_category": {
      "primary_keywords": ["tag1", "tag2", "tag3"],
      "long_tail": ["tag4", "tag5", "tag6"],
      "style": ["tag7", "tag8"],
      "materials": ["tag9", "tag10"],
      "occasions": ["tag11"],
      "buyer_intent": ["tag12", "tag13"]
    }
  },
  "overall_seo_score": 85,
  "priority_improvements": ["Most important improvement", "Second priority"]
}

CRITICAL: You MUST generate:
- A complete, optimized title (55-140 characters)
- A complete, optimized description (200-1000 words) with all required sections
- EXACTLY 13 tags (all under 20 characters each, multi-word phrases)

All three components are REQUIRED. Do not leave any field empty or incomplete.`;
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
      maxOutputTokens: 4096, // Increased to ensure full descriptions and tags are generated
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
    let parsed;
    try {
      parsed = JSON.parse(text);
      
      // Validate that "all" mode has all required fields
      if (parsed.title && !parsed.title.optimized_title) {
        console.warn('[Etsy Optimize] Missing optimized_title in title object');
      }
      if (parsed.description && !parsed.description.optimized_description) {
        console.warn('[Etsy Optimize] Missing optimized_description in description object');
      }
      if (parsed.tags && (!parsed.tags.optimized_tags || !Array.isArray(parsed.tags.optimized_tags) || parsed.tags.optimized_tags.length === 0)) {
        console.warn('[Etsy Optimize] Missing or empty optimized_tags in tags object');
      }
      
    } catch (parseError) {
      console.error('[Etsy Optimize] JSON parse error:', parseError, 'Text:', text.substring(0, 200));
      return { ok: false, error: `Failed to parse JSON response: ${parseError}` };
    }
    
    return { ok: true, data: parsed };
  } catch (error: any) {
    console.error('[Etsy Optimize] Gemini error:', error);
    return { ok: false, error: error?.message || 'Gemini optimization failed' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: OptimizeRequest = await request.json();
    const { listingId, mode, shopId, formData } = body;

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

    let listingData: any;
    
    // If formData is provided, use it directly (no API call needed)
    if (formData) {
      console.log(`[Form Data] Using form data for optimization - no API call needed`);
      listingData = {
        listing_id: parseInt(listingId),
        title: formData.title || '',
        description: formData.description || '',
        tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        materials: formData.materials ? formData.materials.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
        category_path: [],
        price: {
          amount: formData.price ? Math.round(parseFloat(formData.price) * 100) : 0,
          divisor: 100,
          currency_code: 'USD',
        },
        quantity: formData.quantity || 0,
        state: 'draft',
        views: 0,
        num_favorers: 0,
        processing_min: formData.processing_min || 5,
        processing_max: formData.processing_max || 7,
        who_made: formData.who_made || 'i_did',
        when_made: formData.when_made || 'made_to_order',
      };
    } else {
      // Step 1: Check DB first
      const dbListing = await EtsyListing.findOne({ etsyListingId: listingId, userId: shop.userId }).lean();
      const needsRefresh = !dbListing || needsEtsyDataRefresh(dbListing.lastSyncedAt, 'listing');
      
      if (!needsRefresh && dbListing) {
        // Use DB data, transform to match API format
        console.log(`[DB HIT] Using listing data from database for listingId: ${listingId}`);
        listingData = {
          listing_id: parseInt(listingId),
          title: dbListing.title || '',
          description: dbListing.description || '',
          tags: dbListing.tags || [],
          materials: dbListing.materials || [],
          category_path: dbListing.categoryPath || [],
          price: {
            amount: Math.round((dbListing.price || 0) * 100),
            divisor: 100,
            currency_code: dbListing.currency || 'USD',
          },
          quantity: dbListing.inventory?.quantity || 0,
          state: dbListing.state,
          views: dbListing.views || 0,
          num_favorers: dbListing.numFavorers || 0,
          processing_min: dbListing.processingMin,
          processing_max: dbListing.processingMax,
          who_made: dbListing.whoMade,
          when_made: dbListing.whenMade,
        };
      } else {
        // Step 2: Check cache before API call
        const cacheKey = generateCacheKey('listing', { listingId });
        const cachedListing = await getCachedData<any>(cacheKey, shop.userId);
        
        if (cachedListing && !needsRefresh) {
          console.log(`[Cache HIT] Using cached listing data for listingId: ${listingId}`);
          listingData = cachedListing;
          
          // Update DB with cached data for consistency (only if not exists)
          try {
            await EtsyListing.findOneAndUpdate(
              { etsyListingId: listingId, userId: shop.userId },
              {
                $set: {
                  userId: shop.userId,
                  shopId: shop.shopId,
                  etsyListingId: listingId,
                  title: listingData.title,
                  description: listingData.description,
                  price: listingData.price?.amount ? listingData.price.amount / listingData.price.divisor : 0,
                  currency: listingData.price?.currency_code || 'USD',
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
          } catch (dbError: any) {
            // Ignore duplicate key errors (listing already exists)
            if (dbError.code !== 11000) {
              console.warn('[DB Update] Error updating DB from cache:', dbError);
            }
          }
        } else {
          // Step 3: Fetch from Etsy API only if not in DB or cache
          console.log(`[API Fetch] Fetching listing data from Etsy API for listingId: ${listingId}`);
          listingData = await etsyAPI.getListing(listingId);
          
          // Update DB (only if not exists to avoid duplicate key errors)
          try {
            await EtsyListing.findOneAndUpdate(
              { etsyListingId: listingId, userId: shop.userId },
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
          } catch (dbError: any) {
            // Ignore duplicate key errors (listing already exists)
            if (dbError.code !== 11000) {
              console.warn('[DB Update] Error updating DB from API:', dbError);
            }
          }
          
          // Update cache
          await setCachedData(cacheKey, shop.userId, listingData, CACHE_TTL.LISTING, shopId, listingId);
        }
      }
    }

    // Build prompt based on mode
    const prompt = buildOptimizePrompt(mode, listingData);

    // Call AI optimization
    const result = await callGeminiOptimize(prompt);

    if (!result.ok) {
      console.error('[Etsy Listing Optimizer] Optimization failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Optimization failed' },
        { status: 500 }
      );
    }

    // Log the response structure for debugging
    if (mode === 'all') {
      console.log('[Etsy Listing Optimizer] Response structure:', {
        hasTitle: !!result.data?.title,
        hasDescription: !!result.data?.description,
        hasTags: !!result.data?.tags,
        titleHasOptimizedTitle: !!result.data?.title?.optimized_title,
        descriptionHasOptimizedDescription: !!result.data?.description?.optimized_description,
        tagsHasOptimizedTags: !!result.data?.tags?.optimized_tags,
        tagsCount: result.data?.tags?.optimized_tags?.length || 0,
      });
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

