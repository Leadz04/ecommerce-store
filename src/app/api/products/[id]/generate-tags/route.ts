import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';
import axios from 'axios';

// Helper function to create multi-word tags following Etsy SEO (max 20 chars per tag)
function createEtsyTags(keywords: string[], maxTags: number = 13): string[] {
  const tags: string[] = [];
  const usedWords = new Set<string>();
  const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'your', 'have', 'will', 'been', 'were', 'them', 'they', 'their', 'are', 'was', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'cannot']);
  
  // Sort keywords by length and frequency (longer, more specific first)
  const sortedKeywords = keywords
    .filter(k => k.length > 2 && !stopWords.has(k.toLowerCase()))
    .sort((a, b) => b.length - a.length);

  // First pass: Use complete phrases from related searches (these are already natural language)
  const phrases = keywords.filter(k => k.includes(' ') && k.length <= 20);
  phrases.forEach(phrase => {
    if (tags.length < maxTags && phrase.length <= 20) {
      const words = phrase.toLowerCase().split(/\s+/);
      const hasNewWords = words.some(w => !usedWords.has(w));
      if (hasNewWords) {
        tags.push(phrase.toLowerCase().trim());
        words.forEach(w => usedWords.add(w));
      }
    }
  });

  // Second pass: Combine related keywords into multi-word tags
  const singleWords = sortedKeywords.filter(k => !k.includes(' ') && k.length > 3);
  
  // Group related keywords (materials, colors, styles, etc.)
  const materialWords: string[] = [];
  const colorWords: string[] = [];
  const styleWords: string[] = [];
  const typeWords: string[] = [];
  const otherWords: string[] = [];

  const materials = ['leather', 'cotton', 'wool', 'suede', 'denim', 'silk', 'nylon', 'polyester', 'fabric', 'genuine', 'real', 'faux', 'cowhide', 'lambskin'];
  const colors = ['black', 'white', 'brown', 'blue', 'red', 'green', 'gray', 'grey', 'beige', 'tan', 'navy', 'burgundy', 'cognac', 'olive'];
  const styles = ['vintage', 'classic', 'modern', 'casual', 'formal', 'sporty', 'elegant', 'trendy', 'fashion', 'designer', 'biker', 'racer', 'trucker'];
  const types = ['jacket', 'coat', 'shirt', 'pants', 'shoes', 'boots', 'bag', 'wallet', 'belt', 'accessory', 'men', 'mens', 'women', 'womens'];

  singleWords.forEach(word => {
    const lower = word.toLowerCase();
    if (materials.some(m => lower.includes(m) || m.includes(lower))) materialWords.push(word);
    else if (colors.some(c => lower.includes(c) || c.includes(lower))) colorWords.push(word);
    else if (styles.some(s => lower.includes(s) || s.includes(lower))) styleWords.push(word);
    else if (types.some(t => lower.includes(t) || t.includes(lower))) typeWords.push(word);
    else otherWords.push(word);
  });

  // Create combinations: material + type, color + type, style + type, etc.
  const combinations = [
    ...materialWords.flatMap(m => typeWords.map(t => `${m} ${t}`)),
    ...colorWords.flatMap(c => typeWords.map(t => `${c} ${t}`)),
    ...styleWords.flatMap(s => typeWords.map(t => `${s} ${t}`)),
    ...materialWords.flatMap(m => styleWords.map(s => `${m} ${s}`)),
    ...colorWords.flatMap(c => materialWords.map(m => `${c} ${m}`)),
  ];

  // Add combinations that fit Etsy requirements
  combinations.forEach(combo => {
    if (tags.length >= maxTags) return;
    const tag = combo.toLowerCase().trim();
    if (tag.length <= 20 && tag.length > 3) {
      const words = tag.split(/\s+/);
      const hasNewWords = words.some(w => !usedWords.has(w));
      if (hasNewWords && !tags.includes(tag)) {
        tags.push(tag);
        words.forEach(w => usedWords.add(w));
      }
    }
  });

  // Third pass: Add remaining single words as part of phrases
  const remainingWords = [...materialWords, ...colorWords, ...styleWords, ...typeWords, ...otherWords]
    .filter(w => !usedWords.has(w.toLowerCase()));

  remainingWords.forEach(word => {
    if (tags.length >= maxTags) return;
    const lower = word.toLowerCase();
    // Try to combine with existing tags or create new combinations
    if (lower.length <= 20 && lower.length > 3 && !usedWords.has(lower)) {
      // Check if we can add this word to an existing tag
      let added = false;
      for (let i = 0; i < tags.length && !added; i++) {
        const existingTag = tags[i];
        const combined = `${existingTag} ${lower}`.trim();
        if (combined.length <= 20 && !tags.includes(combined)) {
          const existingWords = existingTag.split(/\s+/);
          if (!existingWords.includes(lower)) {
            tags[i] = combined;
            usedWords.add(lower);
            added = true;
          }
        }
      }
      // If couldn't combine, add as new tag if it's meaningful
      if (!added && lower.length >= 4) {
        tags.push(lower);
        usedWords.add(lower);
      }
    }
  });

  // Final cleanup: ensure all tags are <= 20 chars and unique
  return tags
    .map(tag => tag.trim().substring(0, 20))
    .filter(tag => tag.length >= 3)
    .filter((tag, index, self) => self.indexOf(tag) === index) // Remove duplicates
    .slice(0, maxTags);
}

// Extract tags from Google Shopping results following Etsy SEO policies
async function extractTagsFromGoogle(productName: string, productDescription: string): Promise<string[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey || apiKey === 'demo') {
    return [];
  }

  try {
    // Search Google Shopping for similar products
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_shopping',
        q: productName,
        num: 10,
        api_key: apiKey
      }
    });

    const shoppingResults = response.data?.shopping_results || [];
    const relatedSearches = response.data?.related_searches || [];
    const keywords: string[] = [];

    // Extract multi-word phrases from competitor product titles (these are natural search terms)
    shoppingResults.forEach((item: any) => {
      if (item.title) {
        const title = item.title.toLowerCase();
        // Extract 2-4 word phrases from titles
        const words = title.split(/\s+/).filter(w => w.length > 2);
        for (let i = 0; i < words.length - 1; i++) {
          // 2-word phrases
          const twoWord = `${words[i]} ${words[i + 1]}`.trim();
          if (twoWord.length <= 20 && twoWord.length > 3) {
            keywords.push(twoWord);
          }
          // 3-word phrases
          if (i < words.length - 2) {
            const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`.trim();
            if (threeWord.length <= 20 && threeWord.length > 5) {
              keywords.push(threeWord);
            }
          }
        }
      }
    });

    // Extract from related searches (these are real user search queries - perfect for Etsy!)
    relatedSearches.forEach((search: any) => {
      if (search.query) {
        const query = search.query.toLowerCase().trim();
        // Related searches are already natural language queries
        if (query.length <= 20 && query.length > 3) {
          keywords.push(query);
        } else if (query.length > 20) {
          // Split long queries into shorter phrases
          const words = query.split(/\s+/);
          for (let i = 0; i < words.length - 1; i++) {
            const phrase = `${words[i]} ${words[i + 1]}`.trim();
            if (phrase.length <= 20 && phrase.length > 3) {
              keywords.push(phrase);
            }
          }
        }
      }
    });

    // Extract meaningful phrases from product description
    const descText = productDescription.toLowerCase().replace(/[^\w\s]/g, ' ');
    const descWords = descText.split(/\s+/).filter(w => w.length > 3);
    
    // Create 2-3 word phrases from description
    for (let i = 0; i < descWords.length - 1; i++) {
      const twoWord = `${descWords[i]} ${descWords[i + 1]}`.trim();
      if (twoWord.length <= 20 && twoWord.length > 3) {
        keywords.push(twoWord);
      }
      if (i < descWords.length - 2) {
        const threeWord = `${descWords[i]} ${descWords[i + 1]} ${descWords[i + 2]}`.trim();
        if (threeWord.length <= 20 && threeWord.length > 5) {
          keywords.push(threeWord);
        }
      }
    }

    // Extract from product name (create variations)
    const nameWords = productName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    for (let i = 0; i < nameWords.length - 1; i++) {
      const phrase = `${nameWords[i]} ${nameWords[i + 1]}`.trim();
      if (phrase.length <= 20 && phrase.length > 3) {
        keywords.push(phrase);
      }
    }

    // Add material, color, style combinations from product data
    const combinedText = `${productName} ${productDescription}`.toLowerCase();
    
    const materials = ['leather', 'cotton', 'wool', 'suede', 'denim', 'silk', 'nylon', 'genuine leather', 'cowhide', 'lambskin', 'faux leather'];
    const colors = ['black', 'white', 'brown', 'blue', 'red', 'green', 'gray', 'grey', 'beige', 'tan', 'navy', 'burgundy'];
    const styles = ['vintage', 'classic', 'modern', 'casual', 'formal', 'sporty', 'elegant', 'biker', 'racer', 'trucker'];
    const types = ['jacket', 'coat', 'shirt', 'pants', 'shoes', 'boots', 'bag', 'wallet', 'belt'];
    const genders = ['men', 'mens', 'women', 'womens', 'unisex'];

    // Create natural combinations
    materials.forEach(material => {
      if (combinedText.includes(material)) {
        types.forEach(type => {
          if (combinedText.includes(type)) {
            const combo = `${material} ${type}`.trim();
            if (combo.length <= 20) keywords.push(combo);
          }
        });
        genders.forEach(gender => {
          if (combinedText.includes(gender)) {
            const combo = `${material} ${gender}`.trim();
            if (combo.length <= 20) keywords.push(combo);
          }
        });
      }
    });

    colors.forEach(color => {
      if (combinedText.includes(color)) {
        types.forEach(type => {
          if (combinedText.includes(type)) {
            const combo = `${color} ${type}`.trim();
            if (combo.length <= 20) keywords.push(combo);
          }
        });
        materials.forEach(material => {
          if (combinedText.includes(material)) {
            const combo = `${color} ${material}`.trim();
            if (combo.length <= 20) keywords.push(combo);
          }
        });
      }
    });

    styles.forEach(style => {
      if (combinedText.includes(style)) {
        types.forEach(type => {
          if (combinedText.includes(type)) {
            const combo = `${style} ${type}`.trim();
            if (combo.length <= 20) keywords.push(combo);
          }
        });
      }
    });

    // Use the helper function to create Etsy-compliant tags
    return createEtsyTags(keywords, 13);
  } catch (error) {
    console.error('Error extracting tags from Google:', error);
    return [];
  }
}

// Generate tags from product data (fallback if SerpAPI fails) - following Etsy SEO
function generateTagsFromProduct(product: any): string[] {
  const name = (product.name || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const descriptionHtml = ((product as any).descriptionHtml || '').toLowerCase();
  const combined = `${name} ${description} ${descriptionHtml}`.replace(/<[^>]*>/g, ' ');
  const keywords: string[] = [];

  // Extract meaningful phrases from product name (2-3 word combinations)
  const nameWords = name.split(/\s+/).filter(w => w.length > 2);
  for (let i = 0; i < nameWords.length - 1; i++) {
    const twoWord = `${nameWords[i]} ${nameWords[i + 1]}`.trim();
    if (twoWord.length <= 20 && twoWord.length > 3) {
      keywords.push(twoWord);
    }
    if (i < nameWords.length - 2) {
      const threeWord = `${nameWords[i]} ${nameWords[i + 1]} ${nameWords[i + 2]}`.trim();
      if (threeWord.length <= 20 && threeWord.length > 5) {
        keywords.push(threeWord);
      }
    }
  }

  // Extract from description (2-3 word phrases)
  const descWords = combined.split(/\s+/).filter(w => w.length > 3);
  for (let i = 0; i < descWords.length - 1; i++) {
    const twoWord = `${descWords[i]} ${descWords[i + 1]}`.trim();
    if (twoWord.length <= 20 && twoWord.length > 3) {
      keywords.push(twoWord);
    }
    if (i < descWords.length - 2) {
      const threeWord = `${descWords[i]} ${descWords[i + 1]} ${descWords[i + 2]}`.trim();
      if (threeWord.length <= 20 && threeWord.length > 5) {
        keywords.push(threeWord);
      }
    }
  }

  // Create material + type combinations
  const materials = ['leather', 'cotton', 'wool', 'suede', 'denim', 'silk', 'nylon', 'genuine leather', 'cowhide', 'lambskin'];
  const types = ['jacket', 'coat', 'shirt', 'pants', 'shoes', 'boots', 'bag', 'wallet', 'belt', 'accessory'];
  const colors = ['black', 'white', 'brown', 'blue', 'red', 'green', 'gray', 'grey', 'beige', 'tan', 'navy', 'burgundy'];
  const styles = ['vintage', 'classic', 'modern', 'casual', 'formal', 'sporty', 'elegant', 'biker', 'racer', 'trucker'];
  const genders = ['men', 'mens', 'women', 'womens', 'unisex'];

  materials.forEach(material => {
    if (combined.includes(material)) {
      types.forEach(type => {
        if (combined.includes(type)) {
          const combo = `${material} ${type}`.trim();
          if (combo.length <= 20) keywords.push(combo);
        }
      });
      genders.forEach(gender => {
        if (combined.includes(gender)) {
          const combo = `${material} ${gender}`.trim();
          if (combo.length <= 20) keywords.push(combo);
        }
      });
    }
  });

  colors.forEach(color => {
    if (combined.includes(color)) {
      types.forEach(type => {
        if (combined.includes(type)) {
          const combo = `${color} ${type}`.trim();
          if (combo.length <= 20) keywords.push(combo);
        }
      });
      materials.forEach(material => {
        if (combined.includes(material)) {
          const combo = `${color} ${material}`.trim();
          if (combo.length <= 20) keywords.push(combo);
        }
      });
    }
  });

  styles.forEach(style => {
    if (combined.includes(style)) {
      types.forEach(type => {
        if (combined.includes(type)) {
          const combo = `${style} ${type}`.trim();
          if (combo.length <= 20) keywords.push(combo);
        }
      });
    }
  });

  // Extract from specifications (create phrases)
  if (product.specifications) {
    const specs = product.specifications instanceof Map
      ? Object.fromEntries(product.specifications)
      : product.specifications;
    
    Object.values(specs).forEach((value: any) => {
      const valueStr = String(value).toLowerCase();
      const words = valueStr.split(/\s+/).filter(w => w.length > 3);
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`.trim();
        if (phrase.length <= 20 && phrase.length > 3) {
          keywords.push(phrase);
        }
      }
    });
  }

  // Use the helper function to create Etsy-compliant tags
  return createEtsyTags(keywords, 13);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAnyPermission([PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_MANAGE_INVENTORY])(request);
    await connectDB();

    const { id: productId } = await params;
    const body = await request.json().catch(() => ({}));
    const { useSerpAPI = true, replaceExisting = false } = body;

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existingTags = Array.isArray((product as any).tags) 
      ? (product as any).tags 
      : [];
    
    // If tags are already at 13+ and not replacing, return early
    if (existingTags.length >= 13 && !replaceExisting) {
      return NextResponse.json({
        success: false,
        message: `Product already has ${existingTags.length} tags (Etsy maximum is 13). Use replaceExisting: true to regenerate tags.`,
        tags: existingTags.slice(0, 13),
        existing: existingTags,
        generated: [],
        added: []
      });
    }
    
    let generatedTags: string[] = [];

    // Try SerpAPI first if enabled
    if (useSerpAPI && process.env.SERPAPI_KEY && process.env.SERPAPI_KEY !== 'demo') {
      const descriptionHtml = (product as any).descriptionHtml || '';
      const plainDescription = descriptionHtml.replace(/<[^>]*>/g, ' ') || product.description || '';
      
      generatedTags = await extractTagsFromGoogle(product.name, plainDescription);
      
      // If SerpAPI didn't return enough tags, supplement with product-based generation
      if (generatedTags.length < 10) {
        const fallbackTags = generateTagsFromProduct(product);
        fallbackTags.forEach(tag => {
          if (!generatedTags.includes(tag) && generatedTags.length < 13) {
            generatedTags.push(tag);
          }
        });
      }
    } else {
      // Use product-based generation only
      generatedTags = generateTagsFromProduct(product);
    }

    let finalTags: string[] = [];
    
    if (replaceExisting || existingTags.length >= 13) {
      // Replace all existing tags with new ones
      finalTags = generatedTags.slice(0, 13);
    } else {
      // Merge with existing tags (avoid duplicates)
      const allTags = [...existingTags];
      generatedTags.forEach(tag => {
        const tagLower = tag.toLowerCase().trim();
        if (!allTags.some(existing => existing.toLowerCase().trim() === tagLower) && allTags.length < 13) {
          allTags.push(tag);
        }
      });
      finalTags = allTags.slice(0, 13);
    }

    // Update product
    product.set('tags', finalTags);
    await product.save();

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedTags.length} new tags. Total tags: ${finalTags.length}`,
      tags: finalTags,
      generated: generatedTags,
      existing: existingTags,
      added: generatedTags.filter(tag => !existingTags.some(existing => existing.toLowerCase().trim() === tag.toLowerCase().trim()))
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Generate tags error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

