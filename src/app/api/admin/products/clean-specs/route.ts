import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';

// Check if a string is a question
function isQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.endsWith('?')) return true;
  const questionPattern = /^(what|how|why|when|where|who|which|can|could|should|will|would|is|are|do|does|did|has|have|had)\s/i;
  if (questionPattern.test(trimmed)) return true;
  const questionPhrases = [
    /what is/i, /how to/i, /how do/i, /how does/i, /how can/i, /what are/i, /what does/i,
    /why is/i, /why are/i, /when should/i, /where can/i, /can i/i, /can you/i,
    /should i/i, /will it/i, /does it/i, /is it/i, /are they/i
  ];
  return questionPhrases.some(pattern => pattern.test(trimmed));
}

// Check if content is informational/non-specification content
function isInformationalContent(key: string, value: string): boolean {
  const keyLower = key.toLowerCase();
  const valueLower = value.toLowerCase();
  const combined = `${keyLower} ${valueLower}`;
  
  // Patterns for informational content that should be removed
  const informationalPatterns = [
    // Customer support & policies
    /customer\s+care|support\s+&?\s*policies|shipping\s+policy|return\s+and\s+exchange|sizing\s+guide|track\s+your\s+order|start\s+a\s+return|contact\s+us|help\s+help|station/i,
    // Buying guides - comprehensive patterns
    /buying\s+guides?|celebrities?\s+&?\s*leather|what\s+is\s+italian\s+leather|myths?\s+about|shopping\s+online\s+vs\s+offline|lambskin\s+vs\s+cowhide|why\s+a\s+\$?\d+.*jacket|keanu\s+reeves|nvidia\s+ceo|sustainable|wilsons?\s+vs\s+angel|faux\s+leather\s+vs\s+real|beckham|celebrities?\s+&?\s*leather\s+jacket|myths?\s+about\s+leather|shopping\s+online|vs\s+offline|lambskin\s+vs\s+cowhide\s+leather|why\s+a\s+\$?\d+|keanu\s+reeves\s+leather|nvidia\s+ceo\s+&?\s*leather|sustainable\s+leather|wilsons?\s+vs\s+angel\s+jackets?|beckham'?s?\s+leather/i,
    // How-to guides - comprehensive patterns
    /how\s+to'?s?|how\s+to\s+care|how\s+to\s+identify|how\s+to\s+remove|remove\s+wrinkles|remove\s+smell|how\s+to\s+care\s+letterman|how\s+to\s+care\s+suede|how\s+to\s+care\s+faux|how\s+to\s+care\s+leather\s+skirt|remove\s+wrinkles\s+from|remove\s+smell\s+from|how\s+to\s+care\s+leather\s+jacket|how\s+to\s+identify\s+real\s+leather/i,
    // General informational keywords
    /guide|policy|policies|track|return|exchange|sizing|contact|help|support|station|care\s+instructions|instructions/i,
    // Long text blocks (likely informational content)
    /.{200,}/, // Very long values are likely informational
  ];
  
  // Check if key or value matches informational patterns
  for (const pattern of informationalPatterns) {
    if (pattern.test(combined)) {
      return true;
    }
  }
  
  // Check for common non-specification keys
  const nonSpecKeys = [
    'help', 'support', 'policies', 'customer care', 'shipping', 'return', 'exchange',
    'sizing', 'guide', 'track', 'contact', 'buying guide', 'how to', 'care instructions',
    'celebrities', 'myths', 'sustainable', 'faux', 'real leather', 'italian leather',
    'buying guides', 'how to\'s', 'how tos', 'customer care station', 'support & policies',
    'shipping policy', 'return and exchange', 'sizing guide', 'track your order',
    'start a return', 'contact us', 'celebrities & leather', 'what is italian leather',
    'myths about', 'shopping online vs offline', 'lambskin vs cowhide', 'keanu reeves',
    'nvidia ceo', 'wilsons vs angel', 'faux leather vs real', 'beckham', 'remove wrinkles',
    'remove smell', 'how to care letterman', 'how to care suede', 'how to care faux',
    'how to care leather skirt', 'how to identify real leather'
  ];
  
  for (const nonSpecKey of nonSpecKeys) {
    if (keyLower.includes(nonSpecKey) || valueLower.includes(nonSpecKey)) {
      return true;
    }
  }
  
  return false;
}

// Generate a clear name from a specification value
function generateSpecName(value: string): string {
  const valueStr = String(value).trim();
  
  // Extract key terms from the value to create a meaningful name
  // Material-related
  if (/water\s+repellent|waterproof|water\s+resistant/i.test(valueStr)) {
    return 'Water Resistance';
  }
  if (/wind\s+proof|windproof|wind\s+resistant/i.test(valueStr)) {
    return 'Wind Resistance';
  }
  if (/nylon|polyester|cotton|leather|wool|suede|denim|silk|cashmere/i.test(valueStr)) {
    const materialMatch = valueStr.match(/(nylon|polyester|cotton|leather|wool|suede|denim|silk|cashmere)/i);
    if (materialMatch) {
      return `Material: ${materialMatch[1].charAt(0).toUpperCase() + materialMatch[1].slice(1)}`;
    }
  }
  
  // Feature-related
  if (/adjustable|adjust/i.test(valueStr)) {
    return 'Adjustable Features';
  }
  if (/pocket|pockets/i.test(valueStr)) {
    return 'Pockets';
  }
  if (/zipper|zip/i.test(valueStr)) {
    return 'Closure Type';
  }
  if (/strap|handle/i.test(valueStr)) {
    return 'Strap/Handle';
  }
  if (/lining|lined/i.test(valueStr)) {
    return 'Lining';
  }
  if (/padding|padded/i.test(valueStr)) {
    return 'Padding';
  }
  if (/breathable|breath/i.test(valueStr)) {
    return 'Breathability';
  }
  
  // Size/Dimension-related
  if (/inch|cm|mm|dimension|size|weight|length|width|height/i.test(valueStr)) {
    return 'Dimensions';
  }
  
  // Quality-related
  if (/premium|durable|quality|high\s+quality/i.test(valueStr)) {
    return 'Quality';
  }
  
  // Color-related
  if (/color|colour|black|white|blue|red|brown|gray|grey/i.test(valueStr)) {
    return 'Color';
  }
  
  // If value is short and descriptive, use it as the name (capitalized)
  if (valueStr.length < 50 && valueStr.length > 3) {
    // Capitalize first letter of each word
    return valueStr
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Default: use "Feature" with a number
  return 'Feature';
}

// Separate FAQs and informational content from specifications, and rename bullet specs
function cleanSpecifications(specs: Record<string, string>): { cleanSpecs: Record<string, string>, faqs: string[], removed: string[] } {
  const cleanSpecs: Record<string, string> = {};
  const faqs: string[] = [];
  const removed: string[] = [];
  const renamed: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(specs)) {
    let finalKey = key;
    let finalValue = value;
    
    // FIRST: Check if it's informational content - REMOVE IT COMPLETELY (don't move to FAQs)
    if (isInformationalContent(finalKey, finalValue)) {
      removed.push(`Removed informational: "${finalKey}: ${finalValue}"`);
      continue; // Skip this entirely - don't add to specs or FAQs
    }
    
    // Check if key contains __bullet__ pattern or similar patterns
    if (key.includes('__bullet__') || /^__\w+__\d*$/i.test(key)) {
      // Generate a clear name from the value
      const newName = generateSpecName(value);
      
      // If we already have a spec with this name, append a number
      let counter = 1;
      let uniqueName = newName;
      while (cleanSpecs[uniqueName] || renamed[uniqueName]) {
        uniqueName = `${newName} ${counter}`;
        counter++;
      }
      
      finalKey = uniqueName;
      renamed[key] = finalKey;
      removed.push(`Renamed "${key}" to "${finalKey}"`);
    }
    
    // Check if it's a question (but NOT informational content)
    if (isQuestion(finalValue)) {
      // Only add to FAQs if it's a genuine product question, not informational content
      if (!isInformationalContent(finalKey, finalValue)) {
        let question = finalValue.trim();
        if (!question.endsWith('?')) question += '?';
        faqs.push(question);
        removed.push(`Moved to FAQs: "${finalKey}: ${finalValue}"`);
      } else {
        removed.push(`Removed informational question: "${finalKey}: ${finalValue}"`);
      }
    }
    // It's a real specification
    else {
      cleanSpecs[finalKey] = finalValue;
    }
  }
  
  return { cleanSpecs, faqs, removed };
}

export async function POST(request: NextRequest) {
  try {
    await requireAnyPermission([PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_MANAGE_INVENTORY])(request);
    await connectDB();

    const { dryRun = false, limit = 1000 } = await request.json().catch(() => ({ dryRun: false, limit: 1000 }));

    console.log(`[Clean Specs] Starting cleanup (dryRun=${dryRun}, limit=${limit})`);

    const products = await Product.find({}).limit(Math.min(limit, 10000));
    console.log(`[Clean Specs] Found ${products.length} products to process`);

    let cleaned = 0;
    let totalRemoved = 0;
    let totalRenamed = 0;
    let totalFAQsAdded = 0;
    const results: any[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const existingSpecs = product.specifications instanceof Map
        ? Object.fromEntries((product.specifications as any).entries())
        : (product.specifications as any) || {};

      if (!existingSpecs || Object.keys(existingSpecs).length === 0) {
        continue;
      }

      const { cleanSpecs, faqs, removed } = cleanSpecifications(existingSpecs);
      
      // Count renamed items (items that start with "Renamed")
      const renamedItems = removed.filter(item => typeof item === 'string' && item.startsWith('Renamed'));
      const removedItems = removed.filter(item => typeof item === 'string' && !item.startsWith('Renamed'));

      // Filter out informational content from existing FAQs
      const existingFAQs = Array.isArray((product as any).faqs) ? [...(product as any).faqs] : [];
      const cleanExistingFAQs = existingFAQs.filter(faq => !isInformationalContent('', String(faq)));
      const allFAQs = Array.from(new Set([...cleanExistingFAQs, ...faqs.filter(faq => !isInformationalContent('', faq))]));

      if (removed.length > 0 || faqs.length > 0 || Object.keys(cleanSpecs).length !== Object.keys(existingSpecs).length || existingFAQs.length !== cleanExistingFAQs.length) {
        if (!dryRun) {
          product.set('specifications', cleanSpecs);
          // Only set FAQs if there are clean FAQs (not informational)
          if (allFAQs.length > 0) {
            product.set('faqs', allFAQs);
          } else {
            // Remove FAQs field if it's empty or only contains informational content
            product.set('faqs', []);
          }
          await product.save();
        }

        cleaned++;
        totalRemoved += removedItems.length;
        totalRenamed += renamedItems.length;
        totalFAQsAdded += faqs.length;

        results.push({
          productId: product._id,
          productName: product.name,
          removedCount: removedItems.length,
          renamedCount: renamedItems.length,
          faqsAdded: faqs.length,
          removedItems: removedItems.slice(0, 5), // Show first 5 removed items
          renamedItems: renamedItems.slice(0, 5), // Show first 5 renamed items
        });

        if (i % 100 === 0) {
          console.log(`[Clean Specs] Processed ${i + 1}/${products.length} products...`);
        }
      }
    }

    console.log(`[Clean Specs] Complete. Cleaned ${cleaned} products, removed ${totalRemoved} items, renamed ${totalRenamed} specs, added ${totalFAQsAdded} FAQs`);

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        totalProducts: products.length,
        cleanedProducts: cleaned,
        totalRemoved: totalRemoved,
        totalRenamed: totalRenamed,
        totalFAQsAdded: totalFAQsAdded,
      },
      results: results.slice(0, 50), // Return first 50 results
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Clean specs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

