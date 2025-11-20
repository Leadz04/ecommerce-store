import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

const ETSY_SELLER_HANDBOOK_URL = 'https://www.etsy.com/seller-handbook';
const DEFAULT_GEMINI_POLICY_MODEL = process.env.GEMINI_POLICY_MODEL?.trim() || 'gemini-2.5-pro';

type GeminiPolicySeverity = 'critical' | 'warning' | 'info';

interface GeminiPolicyIssue {
  policy: string;
  severity: GeminiPolicySeverity;
  description: string;
  handbookReference?: string;
  fix?: string;
}

interface GeminiPolicyReview {
  enabled: boolean;
  status: 'complete' | 'skipped' | 'error';
  handbookUrl: string;
  model?: string;
  summary?: string;
  score?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  strengths?: string[];
  issues?: GeminiPolicyIssue[];
  nextSteps?: string[];
  references?: string[];
  reason?: string;
  raw?: string;
}

// Etsy Policy Violations to Check
const ETSY_POLICY_VIOLATIONS = {
  // Personal Information (not allowed in listings)
  personalInfo: {
    patterns: [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
      /\b(www\.|http:\/\/|https:\/\/)[^\s]+/gi, // External URLs (except allowed ones)
      /\b\d{5}(-\d{4})?\b/, // ZIP codes
      /\b\d{1,5}\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Circle|Cir)\b/i, // Addresses
    ],
    message: 'Personal contact information (phone, email, address) is not allowed in listings'
  },
  
  // External marketplace links (prohibited)
  externalLinks: {
    patterns: [
      /\b(amazon|ebay|etsy|shopify|walmart|target|aliexpress|wish|facebook|instagram|pinterest|tiktok|twitter|x\.com)\s*(\.com|\.net|\.org|\.io|\.co)\b/gi,
      /\b(buy\s+on|shop\s+on|find\s+on|available\s+on)\s+(amazon|ebay|shopify|walmart|target)/gi,
    ],
    message: 'Links to external marketplaces are prohibited'
  },
  
  // Prohibited content keywords
  prohibitedContent: {
    patterns: [
      /\b(counterfeit|fake|replica|knockoff|unauthorized|bootleg)\b/gi,
      /\b(weapon|gun|knife|ammunition|explosive)\b/gi,
      /\b(drug|marijuana|cannabis|cocaine|heroin)\b/gi,
      /\b(hate\s+speech|discriminatory|offensive)\b/gi,
    ],
    message: 'Prohibited content detected'
  },
  
  // Misleading information
  misleadingInfo: {
    patterns: [
      /\b(100%\s+guaranteed|risk\s+free|no\s+questions\s+asked)\b/gi,
      /\b(limited\s+time|act\s+now|buy\s+now|order\s+now)\b/gi,
      /\b(click\s+here|visit\s+our\s+website|go\s+to\s+our\s+site)\b/gi,
    ],
    message: 'Misleading or spam-like language detected'
  },
  
  // Copyright/trademark violations
  copyrightViolations: {
    patterns: [
      /\b(disney|mickey\s+mouse|disney\s+character|marvel|dc\s+comics|superman|batman|spiderman|pokemon|nintendo|sony|microsoft|xbox|playstation)\b/gi,
      /\b(designer\s+inspired|luxury\s+replica|designer\s+style)\b/gi,
    ],
    message: 'Potential copyright or trademark violations'
  },
  
  // Spam keywords
  spamKeywords: {
    patterns: [
      /\b(buy\s+now|order\s+now|click\s+here|limited\s+offer|act\s+fast)\b/gi,
      /\b(!!!|!!!|!!!)/g, // Excessive punctuation
      /\b[A-Z]{10,}\b/, // ALL CAPS words
    ],
    message: 'Spam-like keywords or formatting detected'
  },
  
  // Misleading/Inaccurate Descriptors (PROHIBITED)
  misleadingDescriptors: {
    patterns: [
      // Common mislabeling patterns (e.g., "cashmere" when not cashmere)
      /\b(cashmere|silk|wool|leather|gold|silver|diamond|platinum)\b/gi,
    ],
    message: 'Verify material descriptors are accurate - mislabeling violates Etsy policies',
    check: (title: string, description: string, tags: string[]) => {
      // This is a placeholder - actual material verification would need product data
      // The AI review will catch specific mislabeling cases
      return false;
    }
  },
  
  // Keyword Stuffing - Repetitive Content (PROHIBITED)
  keywordStuffing: {
    check: (title: string, description: string, tags: string[]) => {
      const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const descText = description.toLowerCase().replace(/<[^>]*>/g, ' ');
      const descWords = descText.split(/\s+/).filter(w => w.length > 3);
      
      // Check if title is copied verbatim into description (prohibited)
      const titlePhrase = title.toLowerCase().trim();
      if (descText.includes(titlePhrase) && titlePhrase.length > 10) {
        return true; // Title copied verbatim to description
      }
      
      // Check for excessive repetition of same words/phrases
      const wordCounts: Record<string, number> = {};
      [...titleWords, ...descWords].forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
      
      // Flag if any word appears more than 5 times (likely keyword stuffing)
      const excessiveRepetition = Object.values(wordCounts).some(count => count > 5);
      if (excessiveRepetition) {
        return true;
      }
      
      // Check if description is just a list of keywords from title/tags
      const tagWords = tags.join(' ').toLowerCase().split(/\s+/);
      const descIsKeywordList = descWords.every(word => 
        titleWords.includes(word) || tagWords.includes(word)
      );
      if (descIsKeywordList && descWords.length > 10) {
        return true; // Description is just keyword list
      }
      
      return false;
    },
    message: 'Keyword stuffing detected: repetitive content, title copied to description, or keyword list instead of natural description'
  },
  
  // Irrelevant Keywords (PROHIBITED)
  irrelevantKeywords: {
    check: (title: string, description: string, tags: string[], category: string, productType: string) => {
      // This is a placeholder - AI review will catch irrelevant keywords better
      // But we can check for obvious mismatches
      const allText = `${title} ${description} ${tags.join(' ')}`.toLowerCase();
      const categoryLower = category.toLowerCase();
      const typeLower = productType.toLowerCase();
      
      // Check for completely unrelated categories (basic check)
      const unrelatedCategories = ['electronics', 'software', 'digital', 'food', 'medicine'];
      const hasUnrelated = unrelatedCategories.some(cat => 
        allText.includes(cat) && !categoryLower.includes(cat) && !typeLower.includes(cat)
      );
      
      return hasUnrelated;
    },
    message: 'Irrelevant or unrelated keywords detected - may negatively impact search ranking'
  },
  
  // Required information missing
  missingInfo: {
    check: (text: string) => {
      const hasDetails = text.length > 50;
      const hasKeywords = text.split(/\s+/).length > 5;
      return hasDetails && hasKeywords;
    },
    message: 'Listing may be missing important details'
  }
};

interface PolicyCheckResult {
  category: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  found: string[];
  recommendation: string;
}

function checkTextForViolations(text: string, category: string): PolicyCheckResult[] {
  const results: PolicyCheckResult[] = [];
  const textLower = text.toLowerCase();
  
  // Check each policy category
  for (const [key, policy] of Object.entries(ETSY_POLICY_VIOLATIONS)) {
    // Skip checks that require full product context (handled separately)
    if (key === 'keywordStuffing' || key === 'irrelevantKeywords') {
      continue;
    }
    
    if (key === 'missingInfo') {
      // Special check for missing info
      if (!policy.check(text)) {
        results.push({
          category,
          severity: 'warning',
          message: policy.message,
          found: [],
          recommendation: 'Add more detailed information about your product'
        });
      }
      continue;
    }
    
    // Skip checks that only have a check function (no patterns)
    if (!policy.patterns || policy.patterns.length === 0) {
      continue;
    }
    
    // Check patterns
    const found: string[] = [];
    for (const pattern of policy.patterns) {
      const matches = text.match(pattern);
      if (matches) {
        found.push(...matches.slice(0, 5)); // Limit to first 5 matches
      }
    }
    
    if (found.length > 0) {
      const severity = key === 'personalInfo' || key === 'externalLinks' || key === 'prohibitedContent' 
        ? 'error' 
        : key === 'copyrightViolations' 
        ? 'warning' 
        : 'info';
      
      let recommendation = '';
      switch (key) {
        case 'personalInfo':
          recommendation = 'Remove all personal contact information. Etsy handles communication through their messaging system.';
          break;
        case 'externalLinks':
          recommendation = 'Remove links to other marketplaces. Only link to your own website if you have a standalone shop.';
          break;
        case 'prohibitedContent':
          recommendation = 'Remove prohibited content. Review Etsy\'s Prohibited Items Policy.';
          break;
        case 'misleadingInfo':
          recommendation = 'Use honest, descriptive language. Avoid spam-like phrases.';
          break;
        case 'copyrightViolations':
          recommendation = 'Ensure you have rights to use any brand names or character references.';
          break;
        case 'spamKeywords':
          recommendation = 'Use natural, descriptive language. Avoid excessive punctuation and ALL CAPS.';
          break;
        default:
          recommendation = 'Review Etsy\'s Seller Policy for guidelines.';
      }
      
      results.push({
        category,
        severity,
        message: policy.message,
        found: [...new Set(found)], // Remove duplicates
        recommendation
      });
    }
  }
  
  return results;
}

function normalizeSpecifications(specs: any): Record<string, string> {
  if (!specs) return {};
  if (specs instanceof Map) {
    return Object.fromEntries(Array.from(specs.entries()).map(([key, value]) => [String(key), String(value ?? '')]));
  }
  if (typeof specs === 'object') {
    if (typeof (specs as any).toObject === 'function') {
      return normalizeSpecifications((specs as any).toObject());
    }
    return Object.fromEntries(
      Object.entries(specs).map(([key, value]) => [String(key), String(value ?? '')])
    );
  }
  return {};
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

function extractChunkText(chunk: any): string {
  if (!chunk) return '';
  if (typeof chunk.text === 'string') return chunk.text;
  if (Array.isArray(chunk.candidates)) {
    return chunk.candidates
      .map((candidate: any) =>
        candidate?.content?.parts
          ?.map((part: any) => part?.text || '')
          .join('') || ''
      )
      .join('');
  }
  return '';
}

async function callGeminiPolicyReview(prompt: string, apiKey?: string) {
  if (!apiKey) {
    return { ok: false, error: 'Missing Gemini API key' } as const;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = DEFAULT_GEMINI_POLICY_MODEL;
    const config = {
      responseMimeType: 'application/json',
      maxOutputTokens: 2048,
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: -1 }
    } as any;

    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    const stream = await (ai as any).models.generateContentStream({ model, config, contents });
    let output = '';
    for await (const chunk of stream as any) {
      const text = extractChunkText(chunk);
      if (text) {
        output += text;
      }
    }

    if (!output.trim()) {
      return { ok: false, error: 'Empty response from Gemini' } as const;
    }

    const parsed = safeJsonParse(output);
    if (!parsed) {
      return { ok: false, error: 'Unable to parse Gemini JSON', raw: output } as const;
    }

    return { ok: true, parsed, raw: output, model } as const;
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Gemini policy call failed' } as const;
  }
}

function buildPolicyPrompt(listingContext: Record<string, any>, deterministicSummary: Record<string, any>) {
  return [
    `You are an Etsy compliance expert referencing the official Seller Handbook (${ETSY_SELLER_HANDBOOK_URL}).`,
    'Review the listing data and the automated keyword-based findings.',
    'Identify potential policy violations, risky language, or missing disclosures.',
    '',
    'ETSY RANKING FACTORS TO CONSIDER:',
    '',
    'PHASE 2 RANKING FACTORS:',
    '1. Listing Quality/Engagement Rate: How well listing converts (views → clicks → favorites → purchases)',
    '   - Multiple high-quality photos improve score',
    '   - Clear return policies improve score',
    '   - Using all 10 available photos may increase conversion rate',
    '2. Customer Service Quality (heavily influence ranking):',
    '   - Average review rating: Aim for 4 or 5 stars',
    '   - Message response rate: Respond to initial messages within 48 hours',
    '   - Case rate: Keep case rate low (past 3 months, excluding cases over $250 or Etsy Purchase Protection)',
    '3. Shipping Price: US domestic listings with shipping < $6 are prioritized (high shipping is barrier to purchase)',
    '4. Recency: New or renewed listings get small temporary boost to gather buyer interaction data',
    '5. Personalization: CSR (Context Specific Ranking) technology learns individual buyer interests',
    '',
    'Shop Quality Factors (affect Phase 2: Ranking):',
    '1. Shop Icon: Should have a shop icon to represent business and brand',
    '2. Shop Language/Translations: Add your own translations for additional languages',
    '3. Shop Policies: Clear policies for shipping, returns, exchanges (critical for buyers, positive effect on search placement)',
    '4. Shop Description & About Section: Highlight expertise, authority, trustworthiness, brand story',
    '',
    'OPTIMIZATION BEST PRACTICES:',
    '',
    'TITLE OPTIMIZATION:',
    '- Short, clear, easy-to-read (max 140 chars)',
    '- Place MOST IMPORTANT descriptive keywords FIRST (buyers only see first few words in search)',
    '- For Google SEO: First 50-60 characters shown in search results - include critical traits upfront',
    '- Exact keyword matches may rank higher in Phase 1 (Query Matching)',
    '',
    'TAGS OPTIMIZATION:',
    '- USE ALL 13 TAGS (Etsy best practice - not optional)',
    '- Multi-word phrases REQUIRED (e.g., "custom bracelet" not "custom" and "bracelet" separately)',
    '- Use "LONG TAIL" keywords: specific, descriptive phrases that convert better than generic terms',
    '- Do NOT repeat phrases already covered by categories or attributes as separate tags',
    '- Max 20 characters per tag',
    '',
    'DESCRIPTION OPTIMIZATION:',
    '- Place ESSENTIAL INFORMATION at TOP: sizes, colors, ordering directions',
    '- Incorporate keywords casually in FIRST FEW SENTENCES in a way that sounds human',
    '- Write informative and engaging content for buyers',
    '',
    'PHOTOS:',
    '- FIRST PHOTO is crucial for driving clicks: high-resolution, clear, avoid collages or text overlays',
    '- Using ALL 10 AVAILABLE PHOTOS may increase conversion rate',
    '',
    'ATTRIBUTES:',
    '- Category-specific data points (color, holiday, occasion, sizing) act like tags and power filters',
    '- Use relevant attributes - they help items appear in filtered results',
    '',
    'GOOGLE SEO (External Search):',
    '- Add descriptive alt text to images (helps Google understand content, assists visually impaired)',
    '- Shop description and About section: highlight expertise, authority, trustworthiness',
    '- Create helpful, informative content (Google\'s goal is to help people find what they\'re looking for)',
    '',
    'PROHIBITED KEYWORD PRACTICES (Can prevent listings from being shown in search):',
    '',
    '1. MISLEADING/INACCURATE DESCRIPTORS (PROHIBITED):',
    '   - Do NOT mislabel products (e.g., calling something "cashmere" when it is not cashmere)',
    '   - Do NOT add irrelevant attributes that do not apply to your listing',
    '   - Use accurate descriptors that follow Etsy policies',
    '',
    '2. KEYWORD STUFFING / OVER-OPTIMIZATION (PROHIBITED):',
    '   - Do NOT use lots of irrelevant keywords hoping to appear in more searches',
    '   - Do NOT add unrelated keywords hoping to rank for those terms',
    '   - Do NOT copy your title verbatim into the description',
    '   - Do NOT simply list your top keywords in the description',
    '   - Do NOT repeat the same words/phrases over and over in titles and descriptions',
    '   - Do NOT add random keywords to image alt text (unhelpful for screen readers)',
    '',
    'CONSEQUENCES:',
    '- Google may rank pages lower if practices meant to "trick" search engines are used',
    '- Etsy may prevent listings from being shown in search or sold on Etsy',
    '- Focus on accurate descriptors and natural language that helps buyers',
    '',
    'When identifying issues or next steps, flag any prohibited keyword practices.',
    '',
    'Respond ONLY with valid JSON (no code fences, no commentary) that matches this schema:',
    `{
  "summary": "High level Etsy compliance assessment in 1-2 sentences",
  "aiScore": 0-100,
  "riskLevel": "low" | "medium" | "high",
  "strengths": ["What complies well"],
  "violations": [
    {
      "policy": "Seller handbook section or rule",
      "severity": "critical" | "warning" | "info",
      "description": "What is wrong and why it matters",
      "handbookReference": "Direct seller handbook URL or section name",
      "fix": "Specific action to become compliant"
    }
  ],
  "nextSteps": ["Actionable steps seller should take"],
  "references": ["Seller handbook URLs or section names referenced above"]
}`,
    'If no issues exist, return an empty array for "violations".',
    'Do not repeat the deterministic findings verbatim—provide your own reasoning tied to Etsy policy language.',
    'Listing Data:',
    JSON.stringify(listingContext, null, 2),
    'Automated Findings Summary:',
    JSON.stringify(deterministicSummary, null, 2)
  ].join('\n\n');
}

async function runGeminiPolicyReview(
  product: any,
  plainDescription: string,
  deterministicSummary: Record<string, any>
): Promise<GeminiPolicyReview> {
  const handbookUrl = ETSY_SELLER_HANDBOOK_URL;
  const primaryKey = process.env.GEMINI_API_KEY;
  const secondaryKey = process.env.STAGE_GEMINI_API_KEY;
  const availableKey = primaryKey || secondaryKey;

  if (!availableKey) {
    return {
      enabled: false,
      status: 'skipped',
      handbookUrl,
      reason: 'Gemini API key not configured'
    };
  }

  const specs = normalizeSpecifications(product.specifications);
  const listingContext = {
    title: product.name,
    description: plainDescription?.trim().slice(0, 4000) || product.description || '',
    category: product.category,
    brand: product.brand,
    productType: product.productType,
    price: product.price,
    tags: Array.isArray(product.tags) ? product.tags.slice(0, 13) : [],
    specifications: specs,
    status: product.status,
    stockCount: product.stockCount,
    hasVariants: Array.isArray(product.variants) ? product.variants.length : 0,
    media: {
      mainImage: product.image,
      additionalImageCount: Array.isArray(product.images) ? product.images.length : 0
    }
  };

  const prompt = buildPolicyPrompt(listingContext, deterministicSummary);

  let response = await callGeminiPolicyReview(prompt, primaryKey || availableKey);
  if (!response.ok && primaryKey && secondaryKey) {
    response = await callGeminiPolicyReview(prompt, secondaryKey);
  }

  if (!response.ok) {
    return {
      enabled: false,
      status: 'error',
      handbookUrl,
      reason: response.error,
      raw: (response as any).raw
    };
  }

  const parsed = response.parsed as {
    summary?: string;
    aiScore?: number;
    riskLevel?: 'low' | 'medium' | 'high';
    strengths?: string[];
    violations?: GeminiPolicyIssue[];
    nextSteps?: string[];
    references?: string[];
  };

  return {
    enabled: true,
    status: 'complete',
    handbookUrl,
    model: response.model,
    summary: parsed.summary,
    score: typeof parsed.aiScore === 'number' ? parsed.aiScore : undefined,
    riskLevel: parsed.riskLevel ?? 'medium',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 6) : [],
    issues: Array.isArray(parsed.violations) ? parsed.violations.slice(0, 10) : [],
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.slice(0, 6) : [],
    references: Array.isArray(parsed.references) ? parsed.references.slice(0, 6) : [],
    raw: (response as any).raw
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: productId } = await params;
    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const violations: PolicyCheckResult[] = [];
    let overallScore = 100;
    const compliance: Record<string, boolean> = {
      title: true,
      description: true,
      imageAltText: true
    };

    // Check Title
    const title = product.name || '';
    if (title) {
      const titleViolations = checkTextForViolations(title, 'Title');
      violations.push(...titleViolations);
      
      titleViolations.forEach(v => {
        if (v.severity === 'error') {
          overallScore -= 15;
          compliance.title = false;
        } else if (v.severity === 'warning') {
          overallScore -= 5;
        } else {
          overallScore -= 2;
        }
      });
    } else {
      violations.push({
        category: 'Title',
        severity: 'error',
        message: 'Title is missing',
        found: [],
        recommendation: 'Add a descriptive title for your product'
      });
      overallScore -= 20;
      compliance.title = false;
    }

    // Check Description
    const descriptionHtml = (product as any).descriptionHtml || '';
    const description = product.description || '';
    const plainDescription = descriptionHtml.replace(/<[^>]*>/g, ' ') || description;
    
    if (plainDescription.trim()) {
      const descViolations = checkTextForViolations(plainDescription, 'Description');
      violations.push(...descViolations);
      
      descViolations.forEach(v => {
        if (v.severity === 'error') {
          overallScore -= 20;
          compliance.description = false;
        } else if (v.severity === 'warning') {
          overallScore -= 8;
        } else {
          overallScore -= 3;
        }
      });
    } else {
      violations.push({
        category: 'Description',
        severity: 'error',
        message: 'Description is missing',
        found: [],
        recommendation: 'Add a detailed description of your product'
      });
      overallScore -= 25;
      compliance.description = false;
    }

    // Check for Keyword Stuffing and Irrelevant Keywords (PROHIBITED PRACTICES)
    const tags = Array.isArray((product as any).tags) ? (product as any).tags : [];
    const category = product.category || '';
    const productType = (product as any).productType || '';
    
    // Check keyword stuffing
    if (ETSY_POLICY_VIOLATIONS.keywordStuffing.check && 
        ETSY_POLICY_VIOLATIONS.keywordStuffing.check(title, plainDescription, tags)) {
      violations.push({
        category: 'Keyword Stuffing',
        severity: 'error',
        message: ETSY_POLICY_VIOLATIONS.keywordStuffing.message,
        found: [],
        recommendation: 'Avoid repeating the same words/phrases. Write natural descriptions instead of keyword lists. Do not copy your title verbatim into the description.'
      });
      overallScore -= 25;
      compliance.description = false;
    }
    
    // Check irrelevant keywords
    if (ETSY_POLICY_VIOLATIONS.irrelevantKeywords.check && 
        ETSY_POLICY_VIOLATIONS.irrelevantKeywords.check(title, plainDescription, tags, category, productType)) {
      violations.push({
        category: 'Irrelevant Keywords',
        severity: 'warning',
        message: ETSY_POLICY_VIOLATIONS.irrelevantKeywords.message,
        found: [],
        recommendation: 'Remove unrelated keywords. Only use keywords that are relevant to your specific product. This can hurt your search ranking.'
      });
      overallScore -= 15;
    }

    // Check Image Alt Text
    const images = product.images || [];
    const mainImage = product.image;
    const allImages = mainImage ? [mainImage, ...images] : images;
    
    let altTextIssues = 0;
    let missingAltText = 0;
    
    // Note: We can't check actual alt text from the database if it's not stored
    // But we can check if images exist and recommend adding alt text
    if (allImages.length === 0) {
      violations.push({
        category: 'Images',
        severity: 'error',
        message: 'No product images found',
        found: [],
        recommendation: 'Add at least 5 high-quality product images'
      });
      overallScore -= 15;
      compliance.imageAltText = false;
    } else {
      // Check if images might have problematic filenames
      allImages.forEach((img: string) => {
        const imgLower = img.toLowerCase();
        // Check for personal info in image URLs/filenames
        if (/\b(email|phone|address|contact)\b/i.test(imgLower)) {
          altTextIssues++;
        }
        // We can't check actual alt text without it being stored, so we'll recommend it
      });
      
      if (altTextIssues > 0) {
        violations.push({
          category: 'Image Alt Text',
          severity: 'warning',
          message: `${altTextIssues} image(s) may have issues`,
          found: [],
          recommendation: 'Ensure image alt text is descriptive and doesn\'t contain personal information'
        });
        overallScore -= 5;
      }
      
      // Recommend adding alt text if not present
      if (allImages.length > 0) {
        violations.push({
          category: 'Image Alt Text',
          severity: 'info',
          message: `Add descriptive alt text to all ${allImages.length} image(s)`,
          found: [],
          recommendation: 'Alt text helps with accessibility and SEO. Describe what\'s in each image without using personal information.'
        });
      }
    }

    // Calculate compliance percentage
    const complianceRate = Object.values(compliance).filter(v => v).length / Object.keys(compliance).length * 100;

    // Categorize violations
    const errors = violations.filter(v => v.severity === 'error');
    const warnings = violations.filter(v => v.severity === 'warning');
    const info = violations.filter(v => v.severity === 'info');

    const aiContextViolations = violations.slice(0, 12).map(v => ({
      category: v.category,
      severity: v.severity,
      message: v.message,
      recommendation: v.recommendation
    }));

    const deterministicSummary = {
      score: Math.max(0, overallScore),
      complianceRate: Math.round(complianceRate),
      totals: { errors: errors.length, warnings: warnings.length, info: info.length },
      sampleFindings: aiContextViolations
    };

    const aiReview = await runGeminiPolicyReview(product, plainDescription, deterministicSummary);

    return NextResponse.json({
      success: true,
      productId: product._id.toString(),
      productName: product.name,
      score: Math.max(0, overallScore),
      complianceRate: Math.round(complianceRate),
      compliance,
      violations: {
        all: violations,
        errors,
        warnings,
        info
      },
      summary: {
        totalViolations: violations.length,
        criticalIssues: errors.length,
        warnings: warnings.length,
        recommendations: info.length,
        isCompliant: errors.length === 0 && complianceRate >= 80
      },
      aiReview
    });
  } catch (error) {
    console.error('Etsy policy check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

