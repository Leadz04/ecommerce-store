/**
 * Generate unique alt text for product images
 * Each image gets different alt text to avoid keyword stuffing
 */

const COLOR_WORDS = [
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
  'brown', 'gray', 'grey', 'beige', 'tan', 'navy', 'maroon', 'burgundy', 'crimson',
  'ivory', 'cream', 'khaki', 'olive', 'teal', 'turquoise', 'cyan', 'magenta',
  'silver', 'gold', 'bronze', 'copper', 'platinum', 'charcoal', 'slate',
  'camel', 'taupe', 'mocha', 'espresso', 'cognac', 'mahogany', 'walnut',
  'coral', 'salmon', 'peach', 'apricot', 'lime', 'mint', 'sage', 'forest',
  'royal', 'sky', 'ocean', 'midnight', 'ebony', 'ivory', 'bone', 'pearl',
  'champagne', 'amber', 'rust', 'copper', 'rose', 'blush', 'lavender', 'lilac',
  'violet', 'indigo', 'azure', 'cerulean', 'emerald', 'jade', 'olive', 'lime'
];

const VIEW_DESCRIPTORS = [
  'front view', 'side view', 'back view', 'detail view', 'close-up view',
  'angle view', 'full view', 'profile view', 'top view', 'bottom view',
  'interior view', 'exterior view', 'featured detail', 'texture detail',
  'styling view', 'worn view', 'packaging view', 'label view'
];

const MATERIAL_DESCRIPTORS = [
  'leather', 'fabric', 'cotton', 'wool', 'synthetic', 'metal', 'wood',
  'plastic', 'rubber', 'suede', 'denim', 'silk', 'linen', 'polyester'
];

const STYLE_DESCRIPTORS = [
  'classic', 'modern', 'vintage', 'casual', 'formal', 'sporty', 'elegant',
  'minimalist', 'bold', 'sophisticated', 'trendy', 'timeless', 'contemporary'
];

/**
 * Extract color from product name
 */
function extractColor(name: string): string | null {
  const lowerName = name.toLowerCase();
  for (const color of COLOR_WORDS) {
    if (lowerName.includes(color)) {
      return color;
    }
  }
  return null;
}

/**
 * Extract key words from description (excluding common words)
 */
function extractKeyWords(description: string, maxWords: number = 5): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now'
  ]);

  const words = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .filter((word, index, self) => self.indexOf(word) === index) // unique
    .slice(0, maxWords);

  return words;
}

/**
 * Generate unique alt text for each image
 */
export function generateImageAltTexts(
  productName: string,
  description: string,
  category: string,
  brand: string | undefined,
  imageCount: number
): string[] {
  const altTexts: string[] = [];
  const usedKeywords = new Set<string>();
  
  // Extract base information
  const color = extractColor(productName);
  const keyWords = extractKeyWords(description, 8);
  const categoryLower = (category || '').toLowerCase();
  const brandLower = (brand || '').toLowerCase();
  
  // Base product name without color
  let baseName = productName;
  if (color) {
    baseName = baseName.replace(new RegExp(`\\b${color}\\b`, 'gi'), '').trim();
    baseName = baseName.replace(/\s+/g, ' ').trim();
  }
  
  // Generate unique alt text for each image
  for (let i = 0; i < imageCount; i++) {
    const parts: string[] = [];
    const keywords: string[] = [];
    
    // Always include base product name (varied)
    if (i === 0) {
      parts.push(baseName);
    } else if (i === 1) {
      parts.push(baseName);
      keywords.push('product');
    } else {
      // Vary the product name reference
      const nameVariations = [
        baseName,
        `${baseName} item`,
        `${baseName} piece`,
        `this ${baseName.toLowerCase()}`,
        `the ${baseName.toLowerCase()}`
      ];
      parts.push(nameVariations[i % nameVariations.length]);
    }
    
    // Add color if available (only for some images to avoid repetition)
    if (color && i < 3) {
      if (!usedKeywords.has(color)) {
        keywords.push(color);
        usedKeywords.add(color);
      }
    }
    
    // Add category (varied)
    if (categoryLower && i % 2 === 0) {
      const categoryVariations = [
        categoryLower,
        `${categoryLower} product`,
        `${categoryLower} item`
      ];
      keywords.push(categoryVariations[i % categoryVariations.length]);
    }
    
    // Add brand (only once or twice)
    if (brandLower && i < 2 && !usedKeywords.has(brandLower)) {
      keywords.push(brandLower);
      usedKeywords.add(brandLower);
    }
    
    // Add view descriptor (different for each image)
    const viewIndex = i % VIEW_DESCRIPTORS.length;
    const viewDescriptor = VIEW_DESCRIPTORS[viewIndex];
    keywords.push(viewDescriptor);
    
    // Add material/style descriptors from description (varied)
    if (keyWords.length > 0) {
      const availableWords = keyWords.filter(w => !usedKeywords.has(w));
      if (availableWords.length > 0) {
        const wordIndex = i % availableWords.length;
        const selectedWord = availableWords[wordIndex];
        keywords.push(selectedWord);
        usedKeywords.add(selectedWord);
      }
    }
    
    // Check for material descriptors in description
    const descLower = description.toLowerCase();
    for (const material of MATERIAL_DESCRIPTORS) {
      if (descLower.includes(material) && !usedKeywords.has(material) && keywords.length < 4) {
        keywords.push(material);
        usedKeywords.add(material);
        break;
      }
    }
    
    // Check for style descriptors in description
    for (const style of STYLE_DESCRIPTORS) {
      if (descLower.includes(style) && !usedKeywords.has(style) && keywords.length < 5) {
        keywords.push(style);
        usedKeywords.add(style);
        break;
      }
    }
    
    // Build the alt text
    let altText = parts.join(' ');
    if (keywords.length > 0) {
      // Shuffle keywords to avoid same order
      const shuffled = [...keywords].sort(() => Math.random() - 0.5);
      altText += ' ' + shuffled.join(' ');
    }
    
    // Clean up and format
    altText = altText
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[a-z]/, (char) => char.toUpperCase()); // Capitalize first letter
    
    // Ensure minimum length
    if (altText.length < 20) {
      altText += ' product image';
    }
    
    // Ensure maximum length (125 chars is good for SEO)
    if (altText.length > 125) {
      altText = altText.substring(0, 122) + '...';
    }
    
    altTexts.push(altText);
  }
  
  return altTexts;
}

