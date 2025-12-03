import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';

// Keywords to EXCLUDE (We only want Jackets, not accessories)
const BLOCK_LIST = [
  'wallet', 'card holder', 'passport', 'clutch', 'purse', 
  'handbag', 'tote', 'bag', 'belt', 'glove', 'shoe', 
  'sandal', 'chappal', 'footwear', 'tissue', 'keychain',
  'backpack', 'briefcase', 'messenger bag', 'duffel', 'luggage'
];

// Colors to strip out for deduplication
const COLORS = [
  'black', 'brown', 'red', 'blue', 'green', 'tan', 'beige', 
  'white', 'purple', 'maroon', 'cognac', 'grey', 'gray', 
  'burgundy', 'yellow', 'pink', 'olive', 'navy', 'charcoal', 
  'camel', 'gold', 'silver', 'rub off', 'distressed', 'orange',
  'cream', 'ivory', 'khaki', 'rust', 'bronze', 'copper'
];

// Design/material keywords that should create separate listings
const DESIGN_KEYWORDS = [
  'quilted', 'quilt', 'plain', 'perforated', 'perforation',
  'diamond', 'cross', 'embossed', 'emboss', 'textured',
  'smooth', 'grain', 'nappa', 'lambskin', 'cowhide',
  'suede', 'wool', 'cotton', 'denim', 'faux', 'synthetic',
  'lined', 'unlined', 'fleece', 'shearling', 'fur',
  'bomber', 'moto', 'racer', 'trucker', 'harrington',
  'biker', 'cafe racer', 'field', 'trench', 'peacoat'
];

// Function to check if product should be blocked (accessories)
function isBlocked(product: any): boolean {
  const titleLower = (product.name || '').toLowerCase();
  const typeLower = (product.productType || '').toLowerCase();
  const descLower = (product.description || '').toLowerCase();
  const tagsLower = (product.tags || []).join(' ').toLowerCase();
  
  const combined = `${titleLower} ${typeLower} ${descLower} ${tagsLower}`;
  
  return BLOCK_LIST.some(keyword => combined.includes(keyword));
}

// Function to create a style key (removes colors and normalizes)
function createStyleKey(product: any): string {
  let styleKey = (product.name || '').toLowerCase();
  
  // Remove colors
  COLORS.forEach(color => {
    const regex = new RegExp(`\\b${color}\\b`, 'gi');
    styleKey = styleKey.replace(regex, '');
  });
  
  // Clean up extra spaces and normalize
  styleKey = styleKey
    .replace(/\s+/g, ' ')
    .replace(/[()"]/g, '')
    .trim();
  
  return styleKey;
}

// Function to extract design/material signature (for grouping)
function getDesignSignature(product: any): string {
  const titleLower = (product.name || '').toLowerCase();
  const descLower = (product.description || '').toLowerCase();
  const tagsLower = (product.tags || []).join(' ').toLowerCase();
  const combined = `${titleLower} ${descLower} ${tagsLower}`;
  
  const foundDesigns: string[] = [];
  
  DESIGN_KEYWORDS.forEach(keyword => {
    if (combined.includes(keyword.toLowerCase())) {
      foundDesigns.push(keyword.toLowerCase());
    }
  });
  
  // Also check material from specifications if available
  if (product.specifications) {
    const specs = product.specifications instanceof Map
      ? Object.fromEntries((product.specifications as any).entries())
      : product.specifications;
    
    const specsStr = JSON.stringify(specs).toLowerCase();
    DESIGN_KEYWORDS.forEach(keyword => {
      if (specsStr.includes(keyword.toLowerCase()) && !foundDesigns.includes(keyword.toLowerCase())) {
        foundDesigns.push(keyword.toLowerCase());
      }
    });
  }
  
  // Sort for consistent grouping
  return foundDesigns.sort().join('-');
}

// Function to deduplicate products by style (removing color variations)
function deduplicateByStyle(products: any[]): any[] {
  const styleMap = new Map<string, any[]>();
  
  // Group products by style key + design signature
  for (const product of products) {
    const styleKey = createStyleKey(product);
    const designSig = getDesignSignature(product);
    const groupKey = `${styleKey}::${designSig}`;
    
    if (!styleMap.has(groupKey)) {
      styleMap.set(groupKey, []);
    }
    styleMap.get(groupKey)!.push(product);
  }
  
  // For each group, pick the best product (or combine colors)
  const deduplicated: any[] = [];
  
  for (const [groupKey, groupProducts] of styleMap.entries()) {
    if (groupProducts.length === 0) continue;
    
    // If only one product in group, use it
    if (groupProducts.length === 1) {
      deduplicated.push(groupProducts[0]);
      continue;
    }
    
    // Multiple products in group - pick the one with best data
    // Prefer: has images, has description, has price, is active
    const bestProduct = groupProducts.reduce((best, current) => {
      let bestScore = 0;
      let currentScore = 0;
      
      // Score based on data quality
      if (best.images && best.images.length > 0) bestScore += 10;
      if (current.images && current.images.length > 0) currentScore += 10;
      
      if (best.description && best.description.length > 50) bestScore += 5;
      if (current.description && current.description.length > 50) currentScore += 5;
      
      if (best.price && best.price > 0) bestScore += 3;
      if (current.price && current.price > 0) currentScore += 3;
      
      if (best.isActive) bestScore += 2;
      if (current.isActive) currentScore += 2;
      
      return currentScore > bestScore ? current : best;
    });
    
    // Update title to indicate multiple colors available
    const colors = groupProducts
      .map(p => {
        const nameLower = (p.name || '').toLowerCase();
        const colorMatch = COLORS.find(c => nameLower.includes(c));
        return colorMatch ? colorMatch.charAt(0).toUpperCase() + colorMatch.slice(1) : null;
      })
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i); // unique
    
    if (colors.length > 1) {
      bestProduct.name = `${bestProduct.name} (Available in ${colors.join(', ')})`;
    }
    
    deduplicated.push(bestProduct);
  }
  
  return deduplicated;
}

// List of 200 Etsy-optimized product names
const ETSY_PRODUCT_NAMES = [
  // Category 1: The "Vintage Distressed" Leather Collection
  "Handmade Men's Distressed Brown Cafe Racer (Rub-off Finish)",
  "Vintage Style Men's Waxed Leather Trucker Jacket",
  "Men's Retro \"Worn Look\" Biker Jacket (Scuffed Edges)",
  "Women's Vintage Rub-Off Cognac Leather Jacket",
  "Men's Antique Brown Leather Bomber (Aged Finish)",
  "Handmade Men's Distressed Cowhide Utility Jacket",
  "Women's Retro \"Boyfriend Fit\" Leather Jacket",
  "Men's 70s Style Button-Down Leather Shirt Jacket",
  "Women's Vintage Style Red Waxed Moto Jacket",
  "Men's Rustic Tan Leather Field Coat",
  "Handmade Men's \"Battle Worn\" Grey Leather Jacket",
  "Women's Distressed Olive Green Biker Jacket",
  "Men's Vintage Moto Jacket with Stripe Detail",
  "Men's Heavy Washed Leather Touring Jacket",
  "Women's Vintage Crop Leather Jacket",
  
  // Category 2: Handmade Suede & Western Styles
  "Men's Camel Suede Trucker Jacket (Yellowstone Style)",
  "Women's Boho Suede Fringe Jacket",
  "Handmade Men's Chocolate Suede Bomber",
  "Women's Tan Suede Cropped Jacket",
  "Men's Western Yoke Suede Coat",
  "Women's Soft Suede Shirt Jacket",
  "Men's Cowboy Style Leather Vest",
  "Women's Vintage Style Suede Vest",
  "Men's Rust Suede Harrington Jacket",
  "Handmade Men's Black Suede Biker Jacket",
  "Women's 70s Hippie Style Suede Coat",
  
  // Category 3: Handmade Aviator & Shearling (Top Gun/B3 Style)
  "Men's B3 Sheepskin Bomber (Thick Wool Lining)",
  "Women's Aviator Shearling Flight Jacket",
  "Handmade Men's G-1 Military Flight Jacket (Fur Collar)",
  "Men's Distressed Leather Bomber with Fur Collar",
  "Women's Hooded Shearling Winter Coat",
  "Men's High-Altitude Flying Jacket Replica",
  "Women's Cropped Shearling Aviator",
  "Men's RAF Style Sheepskin Jacket",
  "Handmade Men's Ginger Shearling B3 Jacket",
  
  // Category 4: Handmade Gentlemen's Wool & Trench Coats
  "Men's 1920s Style Long Black Trench Coat (Duster)",
  "Handmade Men's Wool Peacoat (Double Breasted)",
  "Men's Classic Camel Wool Overcoat",
  "Men's Vintage Grey Herringbone Wool Coat",
  "Men's Navy Blue Military Style Wool Greatcoat",
  "Women's Handmade Wool Wrap Coat (Belted)",
  "Women's Vintage Style Cape Coat (Wool)",
  "Men's 3/4 Length Leather Car Coat (Button Front)",
  "Women's Long Wool Trench with Hood",
  "Men's Retro Plaid/Checkered Wool Coat",
  "Handmade Men's Sherlock Style Coat",
  "Women's Elegant Double Breasted Wool Walker",
  "Men's Stand Collar Wool Topcoat",
  "Women's Swing Style Wool Coat",
  "Men's Leather Duster Coat (Western/Cowboy Style)",
  
  // Category 5: Handmade Pop Culture & Cosplay Replicas
  "Ryan Gosling \"Drive\" Jacket (Handmade Satin Quilted)",
  "Bane Leather Coat (Shearling Lined Replica)",
  "Negan Walking Dead Leather Jacket",
  "Wolverine X-Men Style Leather Jacket",
  "Star Lord Maroon Leather Trench",
  "Southside Serpents Leather Jacket (with Patch)",
  "Top Gun Maverick Flight Jacket (with Patches)",
  "Akira Kaneda Red Pill Jacket",
  "Terminator 2 Arnold Biker Jacket",
  "Indiana Jones Distressed Leather Jacket",
  "Fight Club Red Leather Blazer",
  "Michael Jackson Thriller Style Jacket",
  "Mad Max Rockatansky Jacket",
  "Yellowstone Rip Wheeler Cotton Jacket",
  "Cyberpunk 2077 Samurai Jacket",
  "Supernatural Dean Winchester Coat",
  "Leon Kennedy Resident Evil Jacket",
  "Fallout NCR Ranger Duster",
  "Blade Runner Shearling Coat",
  "Han Solo Leather Jacket Replica",
  
  // Category 6: Handmade Men's Suits (Vintage & Wedding)
  "Men's Emerald Green Velvet Tuxedo Jacket",
  "Men's Deep Maroon Velvet Smoking Jacket",
  "Men's Vintage Tweed 3-Piece Suit (Grey)",
  "Men's Peaky Blinders Style Pinstripe Suit",
  "Men's Great Gatsby White 3-Piece Suit",
  "Men's 1920s Retro Brown Tweed Suit",
  "Men's Royal Blue Velvet Blazer",
  "Men's Double Breasted Vintage Suit",
  "Men's Checkered/Plaid 3-Piece Suit",
  "Men's Linen Summer Wedding Suit (Beige)",
  "Men's Classic Morning Suit (Tailcoat)",
  "Men's Mandarin Collar Jodhpuri Suit",
  "Men's Sequin Performance Blazer",
  "Men's Paisley Pattern Prom Tuxedo",
  "Men's Sharkskin 3-Piece Suit",
  
  // Category 7: Handmade Women's Suits & Blazers
  "Women's Velvet Pant Suit (2 Piece)",
  "Women's Relaxed Fit Linen Suit",
  "Women's Double Breasted Power Suit",
  "Women's Vintage Style Skirt Suit",
  "Women's Cropped Blazer & High Waist Pant Set",
  "Women's Plaid/Checkered Blazer Set",
  "Women's Oversized \"Boyfriend\" Blazer",
  "Women's Tuxedo Suit (White/Black)",
  "Women's Wide Leg Pant Suit",
  "Women's Fitted Leather Blazer",
  
  // Category 8: Handmade Varsity & Letterman Jackets
  "Classic Wool Body/Leather Sleeve Varsity Jacket",
  "All-Fleece Vintage Letterman Jacket",
  "Hooded Varsity Bomber Jacket",
  "Women's Cropped Varsity Jacket",
  "Satin Baseball Bomber Jacket (Retro 80s)",
  "Patchwork / Multi-Color Varsity Jacket",
  "Black on Black \"Murdered Out\" Varsity Jacket",
  "Custom Team Color Letterman Jacket",
  
  // Category 9: Men's Leather Moto & Biker (Modern Handmade)
  "Handmade Men's Asymmetrical Biker Jacket",
  "Men's Diamond Quilted Moto Jacket",
  "Men's Perforated Summer Riding Jacket",
  "Men's Hooded Leather Moto Jacket",
  "Men's Two-Tone Racing Jacket",
  "Men's Padded Shoulder Cafe Racer",
  "Men's Matte Black Minimalist Racer",
  "Men's Belted Kidney Biker Jacket",
  "Men's Collarless Snap-Tab Jacket",
  "Men's Heavy Duty Cowhide Rider Jacket",
  "Men's \"Brando\" Style Classic Biker",
  "Men's Racing Jacket with Stripes",
  
  // Category 10: Women's Leather Fashion (Modern Handmade)
  "Handmade Women's Cropped Moto Jacket",
  "Women's Peplum Leather Jacket",
  "Women's Scuba Fitted Leather Jacket",
  "Women's Hooded Asymmetrical Biker",
  "Women's Quilted Shoulder Racer",
  "Women's Studded Punk Leather Jacket",
  "Women's Metallic Leather Jacket (Silver/Gold)",
  "Women's Collarless Chanel Style Leather Jacket",
  "Women's Bolero Leather Shrug",
  "Women's Tall Fit Leather Jacket",
  "Women's Petite Fit Leather Jacket",
  "Women's Plus Size Leather Moto",
  
  // Category 11: Handmade Puffer & Down Jackets
  "Men's High-Gloss Puffer Jacket",
  "Men's Matte Finish Down Puffer",
  "Men's Puffer Vest (Sleeveless)",
  "Men's Long Down Parka",
  "Women's Cropped Puffer Jacket",
  "Women's Longline Puffer Coat",
  "Women's Velvet Puffer Jacket",
  "Women's Metallic Puffer Jacket",
  "Unisex Hooded Winter Puffer",
  "Men's Lightweight Packable Down Jacket",
  
  // Category 12: Handmade Specialty Leather Items
  "Men's Smoking Jacket (Velvet/Silk)",
  "Men's Leather Shirt (Button Down)",
  "Women's Leather Shirt Dress",
  "Men's Steampunk Leather Coat",
  "Women's Steampunk Corset Jacket",
  "Men's Gothic Tailcoat",
  "Women's Leather Poncho",
  "Men's Reversible Leather-to-Wool Jacket",
  
  // Category 13: Unique Variations
  "Men's Blue Leather Moto Jacket",
  "Men's Green Leather Moto Jacket",
  "Men's Red Leather Moto Jacket",
  "Men's White Leather Moto Jacket",
  "Women's Blue Leather Biker",
  "Women's Pink Leather Biker",
  "Women's Purple Leather Biker",
  "Women's Red Leather Biker",
  "Women's White Leather Biker",
  "Men's Brown Leather Vest",
  "Men's Black Leather Vest",
  "Men's Suede Vest (Tan)",
  "Women's Leather Vest (Black)",
  "Women's Suede Fringe Vest",
  "Men's Quilted Leather Vest",
  "Women's Long Leather Vest",
  "Men's Leather Blazer (Tan)",
  "Men's Leather Blazer (Black)",
  "Men's Leather Blazer (Brown)",
  "Women's Leather Blazer (Tan)",
  "Women's Leather Blazer (Black)",
  "Women's Leather Blazer (Red)",
  "Men's Hooded Bomber (Black)",
  "Men's Hooded Bomber (Brown)",
  "Women's Hooded Bomber (Black)",
  "Women's Hooded Bomber (Brown)",
  "Men's Harrington (Black)",
  "Men's Harrington (Brown)",
  "Men's Trucker (Black Leather)",
  "Men's Trucker (Brown Leather)",
  "Men's Trucker (Tan Suede)",
  "Women's Trucker (Black Leather)",
  "Women's Trucker (Tan Suede)",
  "Men's Car Coat (Black)",
  "Men's Car Coat (Brown)",
  "Women's Car Coat (Black)",
  "Women's Car Coat (Brown)",
  "Men's Trench (Black)",
  "Men's Trench (Brown)",
  "Women's Trench (Black)",
  "Women's Trench (Brown)",
  "Men's Shearling Coat (Black/Black Fur)",
  "Men's Shearling Coat (Brown/White Fur)",
  "Women's Shearling Coat (Black/Black Fur)",
  "Women's Shearling Coat (Brown/White Fur)",
  "Men's Wool Coat (Grey)",
  "Men's Wool Coat (Black)",
  "Men's Wool Coat (Navy)",
  "Women's Wool Coat (Camel)",
  "Women's Wool Coat (Red)",
  "Women's Wool Coat (Black)",
  "Men's Velvet Blazer (Green)",
  "Men's Velvet Blazer (Burgundy)",
  "Men's Velvet Blazer (Blue)",
  "Custom Made-to-Measure Jacket Service (The ultimate handmade listing)"
];

// Important keywords that should always be included (even if short)
const IMPORTANT_KEYWORDS = ['men', 'women', 'jacket', 'coat', 'suit', 'vest', 'bomber', 'moto', 'biker', 'leather', 'suede', 'wool', 'velvet', 'varsity', 'letterman', 'trench', 'puffer', 'down', 'shearling', 'aviator', 'trucker', 'harrington', 'blazer', 'tuxedo', 'peacoat', 'duster', 'car coat', 'field coat'];

// Function to calculate similarity between two strings (improved fuzzy matching)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Calculate word overlap with weights for important words
  const words1 = s1.split(/\s+/).filter(w => w.length > 0);
  const words2 = s2.split(/\s+/).filter(w => w.length > 0);
  
  const commonWords = words1.filter(w => words2.includes(w));
  const importantCommon = commonWords.filter(w => 
    IMPORTANT_KEYWORDS.some(kw => w.includes(kw.toLowerCase()) || kw.toLowerCase().includes(w))
  );
  
  // Weight important words more heavily
  const score = (commonWords.length * 1.0 + importantCommon.length * 2.0) / Math.max(words1.length, words2.length);
  
  return Math.min(score, 1.0);
}

// Function to extract key search terms from product name
function extractSearchTerms(productName: string): string[] {
  const cleaned = productName.toLowerCase()
    .replace(/[()"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = cleaned.split(/\s+/);
  
  // Include all words, but prioritize longer and important words
  const terms = words.filter(w => {
    // Always include important keywords
    if (IMPORTANT_KEYWORDS.some(kw => w.includes(kw.toLowerCase()) || kw.toLowerCase().includes(w))) {
      return true;
    }
    // Include words longer than 2 characters
    return w.length > 2;
  });
  
  return terms;
}

// Function to find matching products for a given product name
async function findMatchingProducts(productName: string): Promise<any[]> {
  // Extract key terms from the product name
  const keyTerms = extractSearchTerms(productName);
  
  if (keyTerms.length === 0) {
    return [];
  }
  
  // Build multiple search strategies
  const searchQueries: any[] = [];
  
  // Strategy 1: Match all key terms (AND)
  if (keyTerms.length > 0) {
    searchQueries.push({
      name: { $regex: keyTerms.join('.*'), $options: 'i' }
    });
  }
  
  // Strategy 2: Match any important keywords (OR)
  const importantTerms = keyTerms.filter(term => 
    IMPORTANT_KEYWORDS.some(kw => term.includes(kw.toLowerCase()) || kw.toLowerCase().includes(term))
  );
  
  if (importantTerms.length > 0) {
    searchQueries.push({
      $or: [
        { name: { $regex: importantTerms.join('|'), $options: 'i' } },
        { tags: { $in: importantTerms.map(t => new RegExp(t, 'i')) } }
      ]
    });
  }
  
  // Strategy 3: Match at least 2 key terms
  if (keyTerms.length >= 2) {
    const termPairs = [];
    for (let i = 0; i < keyTerms.length - 1; i++) {
      for (let j = i + 1; j < keyTerms.length; j++) {
        termPairs.push(`${keyTerms[i]}.*${keyTerms[j]}|${keyTerms[j]}.*${keyTerms[i]}`);
      }
    }
    if (termPairs.length > 0) {
      searchQueries.push({
        name: { $regex: termPairs.slice(0, 5).join('|'), $options: 'i' }
      });
    }
  }
  
  // Strategy 4: Match individual important terms in description
  if (importantTerms.length > 0) {
    searchQueries.push({
      description: { $regex: importantTerms.slice(0, 3).join('|'), $options: 'i' }
    });
  }
  
  // Execute search with all strategies
  const products = await Product.find({
    $or: searchQueries
  }).lean();
  
  // Score and sort by similarity
  const scoredProducts = products.map(product => ({
    ...product,
    similarity: calculateSimilarity(productName, product.name)
  }))
    .filter(p => p.similarity > 0.15) // Lower threshold: >15% similarity
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3); // Top 3 matches per product name to reduce duplicates
  
  return scoredProducts;
}

export async function POST(request: NextRequest) {
  try {
    await requireAnyPermission([PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.PRODUCT_MANAGE])(request);
    await connectDB();

    // Get option from request body to include all relevant products (not just name matches)
    const body = await request.json().catch(() => ({}));
    const includeAllRelevant = body.includeAllRelevant === true;

    console.log('[Get Etsy Products] Starting search for matching products...');
    console.log(`[Get Etsy Products] Searching for ${ETSY_PRODUCT_NAMES.length} product names...`);
    console.log(`[Get Etsy Products] Include all relevant products: ${includeAllRelevant}`);

    const allMatches: any[] = [];
    const matchedProductNames: string[] = [];
    const unmatchedProductNames: string[] = [];
    const matchDetails: Array<{ searchedFor: string; found: number; bestMatch?: string }> = [];

    // Search for each product name
    for (let i = 0; i < ETSY_PRODUCT_NAMES.length; i++) {
      const productName = ETSY_PRODUCT_NAMES[i];
      const matches = await findMatchingProducts(productName);
      
      if (matches.length > 0) {
        matchedProductNames.push(productName);
        allMatches.push(...matches.map(m => ({
          ...m,
          searchedFor: productName
        })));
        matchDetails.push({
          searchedFor: productName,
          found: matches.length,
          bestMatch: matches[0]?.name
        });
      } else {
        unmatchedProductNames.push(productName);
        matchDetails.push({
          searchedFor: productName,
          found: 0
        });
      }
      
      // Log progress every 50 products
      if ((i + 1) % 50 === 0) {
        console.log(`[Get Etsy Products] Processed ${i + 1}/${ETSY_PRODUCT_NAMES.length} product names... (Found ${allMatches.length} matches so far)`);
      }
    }

    // Remove duplicates based on product _id - use a Map to ensure uniqueness
    const productMap = new Map<string, any>();
    
    // Add all matches, keeping only the best match for each product
    for (const match of allMatches) {
      const productId = match._id.toString();
      if (!productMap.has(productId)) {
        productMap.set(productId, match);
      } else {
        // Keep the match with higher similarity
        const existing = productMap.get(productId);
        if (match.similarity > (existing.similarity || 0)) {
          productMap.set(productId, match);
        }
      }
    }
    
    const uniqueMatches = Array.from(productMap.values());
    const uniqueMatchIds = new Set(uniqueMatches.map(p => p._id.toString()));

    console.log(`[Get Etsy Products] Found ${uniqueMatches.length} unique matching products (from ${allMatches.length} total matches)`);

    // If includeAllRelevant is true, also search for all jacket/coat/suit products
    let additionalProducts: any[] = [];
    if (includeAllRelevant) {
      console.log('[Get Etsy Products] Searching for all relevant jacket/coat/suit products...');
      
      const relevantKeywords = ['jacket', 'coat', 'suit', 'blazer', 'vest', 'bomber', 'moto', 'biker', 'trench', 'peacoat', 'duster', 'varsity', 'letterman', 'shearling', 'aviator', 'trucker', 'harrington', 'puffer', 'down'];
      
      const relevantProducts = await Product.find({
        $or: [
          { name: { $regex: relevantKeywords.join('|'), $options: 'i' } },
          { tags: { $in: relevantKeywords.map(kw => new RegExp(kw, 'i')) } },
          { description: { $regex: relevantKeywords.slice(0, 5).join('|'), $options: 'i' } },
          { productType: { $regex: relevantKeywords.join('|'), $options: 'i' } }
        ]
      }).lean();
      
      // Filter out products already in uniqueMatches and filter out accessories
      additionalProducts = relevantProducts
        .filter(p => !uniqueMatchIds.has(p._id.toString()))
        .filter(p => !isBlocked(p)) // Remove accessories immediately
        .slice(0, 500); // Limit to 500 additional products
      
      console.log(`[Get Etsy Products] Found ${additionalProducts.length} additional relevant products (not already matched, accessories filtered)`);
    }

    // Combine unique matches with additional products - final deduplication
    const allProductsMap = new Map<string, any>();
    
    // Add unique matches
    for (const product of uniqueMatches) {
      allProductsMap.set(product._id.toString(), product);
    }
    
    // Add additional products (they're already filtered, but double-check)
    for (const product of additionalProducts) {
      const productId = product._id.toString();
      if (!allProductsMap.has(productId)) {
        allProductsMap.set(productId, product);
      }
    }
    
    let allProducts = Array.from(allProductsMap.values());
    
    // FILTER: Remove accessories (belts, bags, wallets, footwear)
    console.log(`[Get Etsy Products] Filtering out accessories...`);
    const beforeFilterCount = allProducts.length;
    allProducts = allProducts.filter(product => !isBlocked(product));
    const afterFilterCount = allProducts.length;
    console.log(`[Get Etsy Products] Removed ${beforeFilterCount - afterFilterCount} accessory products`);
    
    // DEDUPLICATE: Remove color duplicates (keep one per style/design)
    console.log(`[Get Etsy Products] Deduplicating by style (removing color variations)...`);
    const beforeDedupCount = allProducts.length;
    allProducts = deduplicateByStyle(allProducts);
    const afterDedupCount = allProducts.length;
    console.log(`[Get Etsy Products] Removed ${beforeDedupCount - afterDedupCount} color duplicate products`);
    console.log(`[Get Etsy Products] Final unique products: ${allProducts.length}`);

    // Verify: Get total count of products in database for comparison
    const totalProductsInDb = await Product.countDocuments({});
    const totalActiveProductsInDb = await Product.countDocuments({ isActive: true });

    console.log(`[Get Etsy Products] Summary:`);
    console.log(`  - Total product names searched: ${ETSY_PRODUCT_NAMES.length}`);
    console.log(`  - Matched product names: ${matchedProductNames.length}`);
    console.log(`  - Unmatched product names: ${unmatchedProductNames.length}`);
    console.log(`  - Total matches found (before deduplication): ${allMatches.length}`);
    console.log(`  - Unique products from name matching: ${uniqueMatches.length}`);
    console.log(`  - Additional relevant products: ${additionalProducts.length}`);
    console.log(`  - Total unique products for export: ${allProducts.length}`);
    console.log(`  - Total products in database: ${totalProductsInDb}`);
    console.log(`  - Active products in database: ${totalActiveProductsInDb}`);

    // Safety check: Ensure we're not exporting more products than exist
    let finalProducts = allProducts;
    if (allProducts.length > totalProductsInDb) {
      console.error(`[Get Etsy Products] ERROR: Export count (${allProducts.length}) exceeds total products in DB (${totalProductsInDb})!`);
      // This shouldn't happen, but if it does, limit to actual DB count
      finalProducts = allProducts.slice(0, totalProductsInDb);
      console.log(`[Get Etsy Products] Limiting export to ${finalProducts.length} products`);
    }

    // Log some unmatched examples for debugging
    if (unmatchedProductNames.length > 0) {
      console.log(`[Get Etsy Products] Sample unmatched product names (first 10):`, unmatchedProductNames.slice(0, 10));
    }

    if (finalProducts.length === 0) {
      return NextResponse.json({ 
        error: 'No matching products found',
        totalSearched: ETSY_PRODUCT_NAMES.length,
        matchedNames: matchedProductNames.length,
        unmatchedNames: unmatchedProductNames.length,
        matchDetails: matchDetails.slice(0, 20) // Show first 20 for debugging
      }, { status: 404 });
    }

    // Convert products to Etsy CSV format
    const etsyHeaders = [
      'Title', 'Description', 'Category', 'Who made it?', 'What is it?', 'When was it made?',
      'Renewal options', 'Product type', 'Tags', 'Materials', 'Production partners', 'Section',
      'Price', 'Quantity', 'SKU', 'Variation 1', 'V1 Option', 'Variation 2', 'V2 Option',
      'Var Price', 'Var Quantity', 'Var SKU', 'Var Visibility', 'Var Photo', 'Shipping profile',
      'Weight', 'Length', 'Width', 'Height', 'Return policy',
      'Photo 1', 'Photo 2', 'Photo 3', 'Photo 4', 'Photo 5', 'Photo 6', 'Photo 7', 'Photo 8', 'Photo 9', 'Photo 10',
      'Video 1', 'Digital file 1', 'Digital file 2', 'Digital file 3', 'Digital file 4', 'Digital file 5'
    ];

    // Helper function to escape CSV values
    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      // Escape quotes by doubling them, and wrap in quotes if contains comma, quote, or newline
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Convert products to Etsy CSV rows
    const csvRows = finalProducts.map((product: any) => {
      // Extract materials from tags or use default
      const materials = product.tags?.filter((tag: string) => 
        /leather|suede|wool|cotton|silk|velvet|denim|fleece|satin/i.test(tag)
      ).join(', ') || 'Leather';

      // Determine section based on product name/category
      let section = 'Real leather jacket';
      const nameLower = (product.name || '').toLowerCase();
      if (nameLower.includes('suit') || nameLower.includes('blazer')) {
        section = 'Suits & Blazers';
      } else if (nameLower.includes('wool') || nameLower.includes('trench')) {
        section = 'Coats & Outerwear';
      } else if (nameLower.includes('vest')) {
        section = 'Vests';
      } else if (nameLower.includes('varsity') || nameLower.includes('letterman')) {
        section = 'Varsity & Letterman Jackets';
      }

      // Get images array
      const images = product.images || [];
      if (product.image && !images.includes(product.image)) {
        images.unshift(product.image);
      }

      return {
        'Title': product.name || '',
        'Description': product.description || '',
        'Category': product.category || 'Clothing',
        'Who made it?': 'I did',
        'What is it?': 'A finished product',
        'When was it made?': 'Made To Order',
        'Renewal options': 'Auto-renew',
        'Product type': 'Physical',
        'Tags': product.tags?.join(', ') || '',
        'Materials': materials,
        'Production partners': '',
        'Section': section,
        'Price': (product.price || 0).toString(),
        'Quantity': (product.stockCount || (product.inStock ? '1' : '0')).toString(),
        'SKU': product.variants?.[0]?.sku || '',
        'Variation 1': product.variants?.length ? 'Size' : '',
        'V1 Option': product.variants?.map((v: any) => v.title || v.name).filter(Boolean).join('|') || '',
        'Variation 2': '',
        'V2 Option': '',
        'Var Price': '',
        'Var Quantity': '',
        'Var SKU': '',
        'Var Visibility': '',
        'Var Photo': '',
        'Shipping profile': 'Shipping',
        'Weight': '0.5',
        'Length': '10',
        'Width': '8',
        'Height': '2',
        'Return policy': '14 days to return or exchange',
        'Photo 1': images[0] || '',
        'Photo 2': images[1] || '',
        'Photo 3': images[2] || '',
        'Photo 4': images[3] || '',
        'Photo 5': images[4] || '',
        'Photo 6': images[5] || '',
        'Photo 7': images[6] || '',
        'Photo 8': images[7] || '',
        'Photo 9': images[8] || '',
        'Photo 10': images[9] || '',
        'Video 1': '',
        'Digital file 1': '',
        'Digital file 2': '',
        'Digital file 3': '',
        'Digital file 4': '',
        'Digital file 5': ''
      };
    });

    // Generate CSV content
    const csvContent = [
      etsyHeaders.join(','),
      ...csvRows.map(row => 
        etsyHeaders.map(header => escapeCsv((row as any)[header])).join(',')
      )
    ].join('\n');

    // Generate filename with timestamp
    const filename = `etsy-products-${new Date().toISOString().split('T')[0]}-${finalProducts.length}-products.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Get Etsy products error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

