import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/etsy-cache';
import { GoogleGenAI } from '@google/genai';

interface OptimizeRequest {
  listingId: string;
  mode: 'title' | 'description' | 'tags' | 'materials' | 'all';
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
  mode: 'title' | 'description' | 'tags' | 'materials' | 'all',
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

  if (mode === 'title') {
    return `${baseContext}

TASK: Create a natural, buyer-focused Etsy listing title that helps buyers find and understand the product.

CRITICAL REQUIREMENTS:
1. **Length:** 120-140 characters (optimal range - use the full space wisely but naturally)
2. **Natural Flow:** Read like a real product name a seller would naturally write - NOT like an SEO-optimized keyword string
3. **Buyer Clarity:** The title should immediately tell buyers WHAT the product is and WHY they might want it
4. **Format:** Title Case (capitalize important words) - NO emojis, NO all caps, NO excessive punctuation
5. **Authenticity:** Should sound like it was written by a real person, not an algorithm

TITLE STRUCTURE (Natural Flow):
- Start with the PRIMARY product type/material (what it is)
- Add key distinguishing features naturally (color, style, size if relevant)
- Include use case or occasion if it adds clarity (e.g., "Wedding Gift", "Home Decor")
- End with any unique selling points that matter to buyers

KEYWORD INTEGRATION (Natural, Not Forced):
- Include important search terms buyers use, but weave them naturally into readable sentences
- Front-load the most important keyword (product type), but don't sacrifice readability
- Use natural language variations - don't repeat the same phrase multiple times
- Avoid keyword stuffing patterns that look automated

WHAT ETSY VALUES:
- Titles that help buyers understand the product quickly
- Natural language that builds trust
- Clear, descriptive product names
- Authentic seller voice

EXAMPLES OF GOOD TITLES (Natural & Effective):
- "Brown Leather Motorcycle Jacket for Men | Classic Biker Style | Slim Fit"
- "Personalized Wooden Sign | Custom Text | Rustic Home Decor | Wedding Gift"
- "Vintage 1980s Denim Jacket | High Waisted | Retro Style | Authentic"

EXAMPLES OF BAD TITLES (AVOID - These Look Automated):
- "Leather Jacket Leather Jacket Brown Men Biker" (repetitive, keyword-stuffed)
- "Handmade Leather Jacket | Handmade Leather | Handmade Jacket" (repetition)
- "✨ BEST JACKET ✨ LEATHER BROWN MEN" (emojis, all caps, unnatural)
- "Leather Jacket Brown Men Coat Biker Motorcycle Vintage" (no natural flow)

CRITICAL: The title must sound like a real seller wrote it naturally. If it reads like an SEO keyword list, rewrite it. Focus on helping buyers understand and trust the product.

Generate ONLY a JSON object with this EXACT structure:
{
  "optimized_title": "Your natural, buyer-focused title (120-140 characters, reads like a real product name)",
  "seo_score": 85,
  "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3"],
  "keywords_used": ["primary keyword 1", "primary keyword 2", "primary keyword 3"],
  "character_count": 125,
  "reasoning": "Brief explanation of why this title is natural and effective"
}

The title must be compelling, clear, and sound completely natural - like something a real seller would write, not an SEO tool.`;
  }

  if (mode === 'description') {
    return `${baseContext}

TASK: Create a compelling, SEO-optimized Etsy listing description that converts browsers into buyers.

CRITICAL STRUCTURE (follow this exact order):
1. **Opening Hook (2-3 sentences):** 
   - Start with a compelling benefit or unique selling point
   - Naturally incorporate 2-3 primary keywords in the first paragraph
   - Create emotional connection or highlight what makes this special

2. **Essential Information (CRITICAL - place at top):**
   - Sizes, colors, dimensions, quantities available
   - Customization options (if applicable)
   - Processing/shipping times
   - Key specifications buyers need to know immediately

3. **Product Details:**
   - Detailed description of what the product is
   - Materials used and quality indicators
   - How it's made (if handmade/custom)
   - Use cases and occasions

4. **Benefits & Features:**
   - Why buyers should choose this product
   - Unique features or qualities
   - Care instructions (if applicable)

5. **Trust Builders:**
   - Quality guarantees
   - Seller credentials (if relevant)
   - Customer satisfaction details

6. **Call-to-Action:**
   - Encourage purchase
   - Mention gift options (if applicable)
   - Thank the buyer

SEO OPTIMIZATION:
- Naturally include primary keywords in the FIRST 2-3 sentences
- Use variations of keywords throughout (don't repeat exact phrases)
- Include long-tail keywords buyers might search for
- Write for humans first, search engines second

FORMATTING BEST PRACTICES:
- Use short paragraphs (2-4 sentences each)
- Use bullet points for features/specifications
- Use line breaks for readability
- Use emojis sparingly (1-2 per section max) - only if they add value
- Bold important information (sizes, prices, key features)

TONE & STYLE:
- Friendly, warm, authentic (Etsy buyers value genuine sellers)
- Professional but personal
- Conversational, not salesy
- Show passion for the product

CRITICAL COMPLIANCE RULES:
- DO NOT copy the title verbatim into the description
- DO NOT list keywords as a keyword list
- DO NOT repeat the same words/phrases excessively
- NO external links in the first line
- NO prohibited content
- Write naturally - if it sounds like keyword stuffing, rewrite it

LENGTH: 300-800 words (detailed enough to be informative, scannable enough to read quickly)

EXAMPLE STRUCTURE:
[Opening hook with keywords naturally integrated]

✨ PRODUCT DETAILS ✨
• Size: [details]
• Color: [options]
• Material: [materials]
• Dimensions: [measurements]

[Detailed product description with benefits]

[Care instructions if applicable]

[Shipping information]

[Call-to-action]

Generate ONLY a JSON object with this EXACT structure:
{
  "optimized_description": "Your complete optimized description following the structure above (300-800 words)",
  "seo_score": 85,
  "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3"],
  "word_count": 450,
  "readability_score": "Good",
  "keywords_integrated": ["keyword1", "keyword2", "keyword3"],
  "structure_followed": true
}

The description must be engaging, informative, naturally keyword-optimized, and written in a way that helps buyers make a purchase decision.`;
  }

  if (mode === 'tags') {
    return `${baseContext}

TASK: Generate EXACTLY 13 natural, buyer-focused Etsy tags that complement the title and help buyers discover the product.

CRITICAL REQUIREMENTS:
1. **Quantity:** MUST provide EXACTLY 13 tags (use all available slots - each tag is a discovery opportunity)
2. **Length:** Each tag MAXIMUM 20 characters (Etsy's hard limit)
3. **Format:** Multi-word phrases REQUIRED (e.g., "leather jacket" not "leather" and "jacket" separately)
4. **Relevance:** Every tag MUST be directly relevant to THIS specific product
5. **NO REPETITION:** Do NOT repeat words or phrases already used in the title - tags should complement, not duplicate

TAG STRATEGY - Create a diverse, natural mix:
1. **Alternative Product Names (2-3 tags):** Different ways buyers might search for this product
   - Example: If title has "jacket", use "coat", "outerwear", "blazer" in tags
   
2. **Long-Tail Search Phrases (3-4 tags):** Specific phrases buyers actually type
   - Example: "gift for boyfriend", "custom made item", "vintage inspired"
   
3. **Style/Aesthetic Keywords (2-3 tags):** Describe the look or feel
   - Example: "minimalist style", "boho chic", "industrial design"
   
4. **Use Case/Context (2-3 tags):** When, where, or how it's used
   - Example: "office decor", "outdoor wear", "special occasion"
   
5. **Buyer Intent Phrases (2-3 tags):** What problem it solves or who it's for
   - Example: "gift for mom", "apartment decor", "workout gear"

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

EXAMPLES OF GOOD TAG SETS (Notice they DON'T repeat title words):
Title: "Brown Leather Motorcycle Jacket for Men | Classic Biker Style | Slim Fit"
Tags: ["mens coat", "biker gear", "outerwear", "motorcycle apparel", "classic design", "slim fit", "casual wear", "daily use", "vintage inspired", "premium quality", "gift for him", "biker style", "men's fashion"]

Title: "Personalized Wooden Sign | Custom Text | Rustic Home Decor | Wedding Gift"
Tags: ["custom sign", "wood decor", "personalized gift", "home sign", "wedding decor", "housewarming gift", "farmhouse style", "rustic decor", "wall art", "custom text", "personalized wood", "decorative sign", "gift idea"]

Generate ONLY a JSON object with this EXACT structure:
{
  "optimized_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13"],
  "seo_score": 85,
  "improvements": ["Specific improvement 1", "Specific improvement 2"],
  "tags_by_category": {
    "primary_keywords": ["tag1", "tag2", "tag3"],
    "long_tail": ["tag4", "tag5", "tag6"],
    "style": ["tag7", "tag8"],
    "materials": ["tag9", "tag10"],
    "occasions": ["tag11"],
    "buyer_intent": ["tag12", "tag13"]
  },
  "tag_validation": {
    "all_under_20_chars": true,
    "all_multi_word": true,
    "no_duplicates": true
  }
}

CRITICAL: You MUST provide exactly 13 tags. Each tag must be:
- Under 20 characters
- A multi-word phrase
- Directly relevant to the product
- Different from other tags (no duplicates)
- Something a real buyer would search for`;
  }

  if (mode === 'materials') {
    return `${baseContext}

TASK: Suggest up to 13 relevant materials for this Etsy listing.

CRITICAL REQUIREMENTS:
1. **Quantity:** Up to 13 materials
2. **Relevance:** Must be actual materials used in the product
3. **Format:** Multi-word phrases if necessary (e.g., "stainless steel" instead of "steel")

Generate ONLY a JSON object with this EXACT structure:
{
  "optimized_materials": ["material1", "material2", ...],
  "reasoning": "Why these materials are relevant"
}
`;
  }

  // mode === 'all'
  return `${baseContext}

TASK: Optimize the ENTIRE Etsy listing (title, description, AND tags) to maximize search visibility, click-through rate, and conversions.

ETSY'S TWO-PHASE SEARCH SYSTEM:
PHASE 1 (Query Matching): Etsy uses holistic view (title, tags, attributes, categories, descriptions, first photo, reviews). Exact keyword matches rank higher.
PHASE 2 (Ranking): Etsy ranks using Context Specific Ranking (CSR) to show items shoppers are most likely to purchase.

RANKING FACTORS:
- Listing Quality/Engagement Rate (conversion: views → clicks → favorites → purchases)
- Customer Service Quality (4-5 star reviews, 48h message response, low case rate)
- Shipping Price: US domestic < $6 prioritized (high shipping is barrier)
- Recency: New/renewed listings get temporary boost
- Personalization: CSR learns individual buyer interests

═══════════════════════════════════════════════════════════════
TITLE OPTIMIZATION (CRITICAL - This is what buyers see first)
═══════════════════════════════════════════════════════════════

STRUCTURE: Natural product name that flows naturally - [Product Type] + [Key Features] + [Use Case/Unique Selling Point]

REQUIREMENTS:
1. Length: 120-140 characters (optimal range - use full space wisely but naturally)
2. Natural Flow: Read like a real product name a seller would write - NOT like an SEO keyword string
3. Buyer Clarity: Immediately tell buyers WHAT the product is and WHY they might want it
4. Format: Title Case - NO emojis, NO all caps, NO excessive punctuation
5. Authenticity: Should sound like it was written by a real person, not an algorithm

KEYWORD INTEGRATION (Natural, Not Forced):
- Include important search terms buyers use, but weave them naturally into readable sentences
- Front-load the most important keyword (product type), but don't sacrifice readability
- Use natural language variations - don't repeat the same phrase multiple times
- Avoid keyword stuffing patterns that look automated

WHAT ETSY VALUES:
- Titles that help buyers understand the product quickly
- Natural language that builds trust
- Clear, descriptive product names
- Authentic seller voice

GOOD EXAMPLE: "Brown Leather Motorcycle Jacket for Men | Classic Biker Style | Slim Fit"
BAD EXAMPLE: "Leather Jacket Leather Jacket Brown Men Biker" or "✨ BEST JACKET ✨" or "Handmade Leather Jacket | Handmade Leather | Handmade"

═══════════════════════════════════════════════════════════════
DESCRIPTION OPTIMIZATION (Must convert browsers to buyers)
═══════════════════════════════════════════════════════════════

STRUCTURE (follow this EXACT order):
1. Opening Hook (2-3 sentences): Compelling benefit + naturally integrate 2-3 primary keywords
2. Essential Information (CRITICAL - place at top):
   • Sizes, colors, dimensions, quantities
   • Customization options
   • Processing/shipping times
   • Key specifications buyers need immediately
3. Product Details: What it is, materials, how it's made, use cases
4. Benefits & Features: Why choose this, unique qualities, care instructions
5. Trust Builders: Quality guarantees, seller credentials
6. Call-to-Action: Encourage purchase, mention gift options

REQUIREMENTS:
- Length: 300-800 words (detailed but scannable)
- SEO: Naturally include keywords in FIRST 2-3 sentences
- Format: Short paragraphs, bullet points, line breaks, emojis sparingly (1-2 per section max)
- Tone: Friendly, warm, authentic, professional but personal
- Compliance: DO NOT copy title verbatim, DO NOT keyword stuff, write naturally

═══════════════════════════════════════════════════════════════
TAGS OPTIMIZATION (CRITICAL - Use all 13 slots)
═══════════════════════════════════════════════════════════════

REQUIREMENTS:
1. Quantity: EXACTLY 13 tags (MANDATORY - use all available slots)
2. Length: Maximum 20 characters per tag
3. Format: Multi-word phrases REQUIRED (e.g., "leather jacket" not "leather" + "jacket")
4. NO REPETITION: Do NOT repeat words or phrases already used in the title - tags should complement, not duplicate
5. Mix: Alternative names (2-3) + Long-tail phrases (3-4) + Style (2-3) + Use cases (2-3) + Buyer intent (2-3)

THINK LIKE A BUYER:
- What exact phrases would someone type into Etsy search?
- What alternative names might they use for this product?
- What problem does this solve?
- What occasion/use case applies?
- What style/aesthetic matches?

AVOID:
- Single words, generic terms, duplicates, tags >20 chars, irrelevant keywords
- Repeating title words/phrases (tags should complement the title, not duplicate it)

EXAMPLE TAG SET (13 tags - Notice they DON'T repeat title words):
Title: "Brown Leather Motorcycle Jacket for Men | Classic Biker Style | Slim Fit"
Tags: ["mens coat", "biker gear", "outerwear", "motorcycle apparel", "classic design", "slim fit", "casual wear", "daily use", "vintage inspired", "premium quality", "gift for him", "biker style", "men's fashion"]

═══════════════════════════════════════════════════════════════
PROHIBITED PRACTICES (Can prevent listings from appearing in search)
═══════════════════════════════════════════════════════════════
- DO NOT mislabel products (e.g., calling something "cashmere" when it's not)
- DO NOT use irrelevant keywords hoping to appear in more searches
- DO NOT add unrelated keywords
- DO NOT keyword stuff - write naturally
- Focus on accurate descriptors that help buyers

Generate ONLY a JSON object with this EXACT structure (all fields REQUIRED):
{
  "title": {
    "optimized_title": "Your optimized title (55-140 chars, keywords at start)",
    "seo_score": 85,
    "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3"],
    "keywords_used": ["keyword1", "keyword2", "keyword3"],
    "character_count": 95,
    "reasoning": "Why this title is optimized"
  },
  "description": {
    "optimized_description": "Your complete optimized description (300-800 words) following the structure: hook with keywords, essential info at top, product details, benefits, trust builders, CTA",
    "seo_score": 85,
    "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3"],
    "word_count": 450,
    "readability_score": "Good",
    "keywords_integrated": ["keyword1", "keyword2", "keyword3"],
    "structure_followed": true
  },
  "tags": {
    "optimized_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13"],
    "seo_score": 85,
    "improvements": ["Specific improvement 1", "Specific improvement 2"],
    "tags_by_category": {
      "primary_keywords": ["tag1", "tag2", "tag3"],
      "long_tail": ["tag4", "tag5", "tag6"],
      "style": ["tag7", "tag8"],
      "materials": ["tag9", "tag10"],
      "occasions": ["tag11"],
      "buyer_intent": ["tag12", "tag13"]
    },
    "tag_validation": {
      "total_tags": 13,
      "all_under_20_chars": true,
      "all_multi_word": true,
      "no_duplicates": true
    }
  },
  "materials": {
    "optimized_materials": ["material1", "material2", "material3"],
    "reasoning": "Why these materials describe the product accurately"
  },
  "overall_seo_score": 85,
  "priority_improvements": ["Most important improvement", "Second priority improvement"]
}

CRITICAL REQUIREMENTS:
✓ Title: 55-140 characters, keywords at beginning, natural and compelling
✓ Description: 300-800 words, essential info at top, naturally keyword-optimized, engaging
✓ Tags: EXACTLY 13 tags, all under 20 chars, all multi-word phrases, relevant and diverse
✓ Materials: Up to 13 accurate material names

All four components are REQUIRED and must be complete. Do not leave any field empty or incomplete.`;
}

async function callGeminiOptimize(prompt: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  const primaryKey = process.env.GEMINI_API_KEY;
  const secondaryKey = process.env.STAGE_GEMINI_API_KEY;
  const tertiaryKey = process.env.TEST_LEADZ07_FIRST_API_KEY;

  async function tryGeminiCall(apiKey?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    if (!apiKey) {
      return { ok: false, error: 'Missing API key' };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = 'gemini-1.5-flash';

      const contents = [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ];

      const response = await (ai as any).models.generateContent({
        model,
        contents,
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 4096, // Increased to ensure full descriptions and tags are generated
          temperature: 0.7,
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
      } else if (response?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.response.candidates[0].content.parts[0].text;
      } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
      } else if (typeof response?.text === 'string') {
        text = response.text;
      } else if (response?.response?.text) {
        text = response.response.text;
      }

      if (!text.trim()) {
        return { ok: false, error: 'Empty response from Gemini' };
      }

      // Clean the text - remove markdown code blocks if present
      let cleanedText = text.trim();

      // Remove markdown code block markers (```json ... ``` or ``` ... ```)
      cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, ''); // Remove opening ```
      cleanedText = cleanedText.replace(/\n?```\s*$/i, ''); // Remove closing ```
      cleanedText = cleanedText.trim();

      // Parse JSON response
      let parsed;
      try {
        parsed = JSON.parse(cleanedText);

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
        console.error('[Etsy Optimize] JSON parse error:', parseError);
        console.error('[Etsy Optimize] Original text (first 500 chars):', text.substring(0, 500));
        console.error('[Etsy Optimize] Cleaned text (first 500 chars):', cleanedText.substring(0, 500));
        return { ok: false, error: `Failed to parse JSON response: ${parseError}` };
      }

      return { ok: true, data: parsed };
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('[Etsy Optimize] Gemini API error:', errorMessage);
      return { ok: false, error: errorMessage };
    }
  }

  // Try primary key first
  let result = await tryGeminiCall(primaryKey);
  if (result.ok) {
    return result;
  }

  // Try secondary key
  if (secondaryKey) {
    console.log('[Etsy Optimize] Primary key failed, trying secondary key');
    result = await tryGeminiCall(secondaryKey);
    if (result.ok) {
      return result;
    }
  }

  // Try tertiary key
  if (tertiaryKey) {
    console.log('[Etsy Optimize] Secondary key failed, trying tertiary key');
    result = await tryGeminiCall(tertiaryKey);
    if (result.ok) {
      return result;
    }
  }

  // All keys failed
  return {
    ok: false,
    error: result.error || 'All Gemini API keys failed. Please check your API keys and network connection.'
  };
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

    if (!['title', 'description', 'tags', 'materials', 'all'].includes(mode)) {
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
      const cacheKey = generateCacheKey('listing', { listingId });

      // Helper function to transform DB listing to API format
      const transformDbToApiFormat = (dbListing: any) => ({
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
      });

      // Helper function to save API data to DB
      const saveToDb = async (apiData: any) => {
        try {
          await EtsyListing.findOneAndUpdate(
            { etsyListingId: listingId, userId: shop.userId },
            {
              $set: {
                userId: shop.userId,
                shopId: shop.shopId,
                etsyListingId: listingId,
                title: apiData.title,
                description: apiData.description,
                price: apiData.price?.amount ? apiData.price.amount / apiData.price.divisor : 0,
                currency: apiData.price?.currency_code || 'USD',
                state: apiData.state,
                tags: apiData.tags || [],
                materials: apiData.materials || [],
                categoryPath: apiData.category_path || [],
                inventory: { quantity: apiData.quantity || 0 },
                views: apiData.views || 0,
                numFavorers: apiData.num_favorers || 0,
                lastSyncedAt: new Date(),
              }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } catch (dbError: any) {
          // Ignore duplicate key errors (listing already exists)
          if (dbError.code !== 11000) {
            console.warn('[DB Update] Error updating DB:', dbError);
          }
        }
      };

      // Step 1: Check DB first
      const dbListing = await EtsyListing.findOne({ etsyListingId: listingId, userId: shop.userId }).lean();

      if (dbListing) {
        // Found in DB - use it and cache it
        console.log(`[DB HIT] Using listing data from database for listingId: ${listingId}`);
        listingData = transformDbToApiFormat(dbListing);

        // Cache the data for faster subsequent access
        await setCachedData(cacheKey, shop.userId, listingData, CACHE_TTL.LISTING, shopId, listingId);
      } else {
        // Step 2: Not found in DB, check cache
        const cachedListing = await getCachedData<any>(cacheKey, shop.userId);

        if (cachedListing) {
          // Found in cache - use it and save to DB
          console.log(`[Cache HIT] Using cached listing data for listingId: ${listingId}`);
          listingData = cachedListing;

          // Update DB with cached data for consistency
          await saveToDb(cachedListing);
        } else {
          // Step 3: Not found in DB or cache, fetch from Etsy API
          console.log(`[API Fetch] Fetching listing data from Etsy API for listingId: ${listingId}`);
          try {
            listingData = await etsyAPI.getListing(listingId);

            // Step 4: Store in both DB and cache
            await saveToDb(listingData);
            await setCachedData(cacheKey, shop.userId, listingData, CACHE_TTL.LISTING, shopId, listingId);
          } catch (apiError: any) {
            // Check if it's a timeout or connection error
            const isTimeoutError = apiError?.message?.includes('timed out') ||
              apiError?.message?.includes('timeout') ||
              apiError?.code === 'UND_ERR_CONNECT_TIMEOUT';
            const isConnectionError = apiError?.message?.includes('connection failed') ||
              apiError?.message?.includes('connection') ||
              apiError?.code === 'ECONNREFUSED' ||
              apiError?.code === 'ENOTFOUND';

            if (isTimeoutError || isConnectionError) {
              console.error(`[Etsy Listing Optimizer] ${isTimeoutError ? 'Timeout' : 'Connection'} error fetching listing:`, apiError);
              return NextResponse.json(
                {
                  error: isTimeoutError
                    ? 'Etsy API request timed out. Please check your internet connection and try again. The listing data may be temporarily unavailable.'
                    : 'Unable to connect to Etsy API. Please check your internet connection and try again.'
                },
                { status: 503 } // Service Unavailable
              );
            }
            // Re-throw other errors to be handled by outer catch
            throw apiError;
          }
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

    // Provide more specific error messages
    const errorMessage = error?.message || 'Failed to optimize listing';
    const isTimeoutError = errorMessage.includes('timed out') || errorMessage.includes('timeout');
    const isConnectionError = errorMessage.includes('connection failed') || errorMessage.includes('connection');

    const statusCode = isTimeoutError || isConnectionError ? 503 : 500;
    const userMessage = isTimeoutError
      ? 'Etsy API request timed out. Please check your internet connection and try again.'
      : isConnectionError
        ? 'Unable to connect to Etsy API. Please check your internet connection and try again.'
        : errorMessage;

    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    );
  }
}

