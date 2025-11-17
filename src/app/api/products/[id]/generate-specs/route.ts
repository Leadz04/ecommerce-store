import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';

function stripHtml(html?: string) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Check if a string is a question
function isQuestion(text: string): boolean {
  const trimmed = text.trim();
  // Check if it ends with ?
  if (trimmed.endsWith('?')) return true;
  
  // Check if it starts with question words
  const questionPattern = /^(what|how|why|when|where|who|which|can|could|should|will|would|is|are|do|does|did|has|have|had)\s/i;
  if (questionPattern.test(trimmed)) return true;
  
  // Check for question phrases
  const questionPhrases = [
    /what is/i,
    /how to/i,
    /how do/i,
    /how does/i,
    /how can/i,
    /what are/i,
    /what does/i,
    /why is/i,
    /why are/i,
    /when should/i,
    /where can/i,
    /can i/i,
    /can you/i,
    /should i/i,
    /will it/i,
    /does it/i,
    /is it/i,
    /are they/i
  ];
  
  return questionPhrases.some(pattern => pattern.test(trimmed));
}

// Extract FAQs from text (excluding informational content)
function extractFAQs(descriptionPlain: string): string[] {
  const faqs: string[] = [];
  const sentences = descriptionPlain.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  
  for (const sentence of sentences) {
    if (isQuestion(sentence)) {
      // Only add if it's NOT informational content
      if (!isInformationalContent('', sentence)) {
        let question = sentence.trim();
        if (!question.endsWith('?')) question += '?';
        faqs.push(question);
      }
    }
  }
  
  return faqs;
}

function inferSpecifications(name: string, descriptionPlain: string) {
  const text = `${name} ${descriptionPlain}`.toLowerCase();
  const specs: Record<string, string> = {};
  
  // Material
  if (/full[-\s]?grain/.test(text)) specs.Material = 'Full-grain leather';
  else if (/genuine\s+leather|real\s+leather|cowhide/.test(text)) specs.Material = 'Genuine Leather';
  else if (/leather/.test(text)) specs.Material = 'Leather';
  else if (/suede/.test(text)) specs.Material = 'Suede';
  else if (/wool/.test(text)) specs.Material = 'Wool';
  else if (/cotton/.test(text)) specs.Material = 'Cotton';
  else if (/polyester/.test(text)) specs.Material = 'Polyester';
  else if (/nylon/.test(text)) specs.Material = 'Nylon';
  else if (/denim/.test(text)) specs.Material = 'Denim';
  else if (/silk/.test(text)) specs.Material = 'Silk';
  else if (/cashmere/.test(text)) specs.Material = 'Cashmere';
  
  // Color hints
  const colorMatch = text.match(/\b(black|brown|dark brown|tan|blue|red|white|navy|gray|grey|beige|burgundy|maroon|olive|khaki|green|yellow|orange|pink|purple|violet)\b/);
  if (colorMatch) specs.Color = colorMatch[1].replace(/\b\w/g, (c) => c.toUpperCase());
  
  // Size/Capacity
  if (/\b15(\.|\s)?(inch|in)\b/.test(text)) specs['Fits Laptop'] = '15-inch';
  if (/\b13(\.|\s)?(inch|in)\b/.test(text)) specs['Fits Laptop'] = (specs['Fits Laptop'] ? specs['Fits Laptop'] + ', 13-inch' : '13-inch');
  if (/\b(XS|S|M|L|XL|2XL|3XL|XXL|XXXL)\b/.test(name)) {
    const sizeMatch = name.match(/\b(XS|S|M|L|XL|2XL|3XL|XXL|XXXL)\b/);
    if (sizeMatch) specs.Size = sizeMatch[0];
  }
  
  // Style/Type
  if (/bomber/.test(text)) specs.Style = 'Bomber';
  else if (/double[-\s]?breasted/.test(text)) specs.Style = 'Double Breasted';
  else if (/single[-\s]?breasted/.test(text)) specs.Style = 'Single Breasted';
  else if (/blazer/.test(text)) specs.Style = 'Blazer';
  else if (/jacket/.test(text)) specs.Style = 'Jacket';
  else if (/coat/.test(text)) specs.Style = 'Coat';
  else if (/trench/.test(text)) specs.Style = 'Trench Coat';
  else if (/parka/.test(text)) specs.Style = 'Parka';
  else if (/windbreaker/.test(text)) specs.Style = 'Windbreaker';
  
  // Features
  const features: string[] = [];
  if (/adjustable\s+strap/.test(text)) features.push('Adjustable strap');
  if (/zipper|zippers/.test(text)) features.push('Zipper closure');
  if (/button[s]?/.test(text)) features.push('Button closure');
  if (/pockets?/.test(text)) features.push('Multiple pockets');
  if (/handmade|hand[-\s]?stitched/.test(text)) features.push('Handmade');
  if (/rib[-\s]?knit|ribbed/.test(text)) features.push('Rib-knit cuffs');
  if (/lining/.test(text)) features.push('Inner lining');
  if (/collar/.test(text)) features.push('Collar');
  if (/hood/.test(text)) features.push('Hood');
  if (/padded|padding/.test(text)) features.push('Padded');
  if (/waterproof|water[-\s]?resistant/.test(text)) features.push('Waterproof');
  if (/breathable/.test(text)) features.push('Breathable');
  if (features.length) specs.Features = features.join(', ');
  
  // Quality/Durability
  if (/durable|long[-\s]?lasting|premium/.test(text)) specs.Quality = 'Premium / Durable';
  else if (/high[-\s]?quality/.test(text)) specs.Quality = 'High Quality';
  
  // Gender
  if (/men['\s]?s|men['\s]?|male/.test(text)) specs.Gender = "Men's";
  else if (/women['\s]?s|women['\s]?|female|ladies/.test(text)) specs.Gender = "Women's";
  else if (/unisex/.test(text)) specs.Gender = 'Unisex';
  
  return specs;
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
function separateFAQsFromSpecs(specs: Record<string, string>): { cleanSpecs: Record<string, string>, faqs: string[], removed: string[] } {
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
    
    // Check if key contains __bullet__ pattern
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAnyPermission([PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_MANAGE_INVENTORY])(request);
    await connectDB();

    const { id: productId } = await params;
    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get plain text description
    const html = (product as any).descriptionHtml as string | undefined;
    const plain = stripHtml(html) || product.description || '';
    
    // Get existing specifications and FAQs
    const existingSpecs = product.specifications instanceof Map
      ? Object.fromEntries((product.specifications as any).entries())
      : (product.specifications as any) || {};
    
    const existingFAQs = Array.isArray((product as any).faqs) 
      ? [...(product as any).faqs] 
      : [];
    
    // Separate existing FAQs and informational content from specs
    const { cleanSpecs: existingCleanSpecs, faqs: existingFAQsFromSpecs, removed: removedFromExisting } = separateFAQsFromSpecs(existingSpecs);
    
    // Generate new specifications
    const newSpecs = inferSpecifications(product.name, plain);
    
    // Extract FAQs from description
    const newFAQs = extractFAQs(plain);
    
    // Merge specifications (don't overwrite existing clean specs)
    const mergedSpecs = { ...existingCleanSpecs, ...newSpecs };
    
    // Filter out informational content from existing FAQs
    const cleanExistingFAQs = existingFAQs.filter(faq => !isInformationalContent('', faq));
    
    // Merge FAQs (avoid duplicates and filter informational content)
    const allFAQs = [...cleanExistingFAQs, ...existingFAQsFromSpecs, ...newFAQs];
    const uniqueFAQs = Array.from(new Set(allFAQs.map(faq => faq.toLowerCase().trim())))
      .map(faq => {
        // Find the original case version
        const found = allFAQs.find(original => original.toLowerCase().trim() === faq) || faq;
        // Filter out informational content
        return isInformationalContent('', found) ? null : found;
      })
      .filter((faq): faq is string => faq !== null);
    
    // Separate any questions and informational content from newly generated specs
    const { cleanSpecs: finalSpecs, faqs: faqsFromNewSpecs, removed: removedFromNew } = separateFAQsFromSpecs(mergedSpecs);
    
    // Filter out informational content from FAQs
    const cleanFAQsFromNewSpecs = faqsFromNewSpecs.filter(faq => !isInformationalContent('', faq));
    const finalFAQs = Array.from(new Set([...uniqueFAQs, ...cleanFAQsFromNewSpecs]));
    const totalRemoved = [...removedFromExisting, ...removedFromNew];
    
    // Update product with clean specifications and FAQs
    product.set('specifications', finalSpecs);
    if (finalFAQs.length > 0) {
      product.set('faqs', finalFAQs);
    }
    await product.save();

    return NextResponse.json({ 
      message: 'Specifications generated successfully',
      specifications: finalSpecs,
      faqs: finalFAQs,
      generated: {
        specifications: newSpecs,
        faqs: newFAQs,
        movedToFAQs: faqsFromNewSpecs.length,
        removedInformational: totalRemoved.length
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Generate specs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

