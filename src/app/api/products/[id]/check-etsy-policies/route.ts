import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

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
      }
    });
  } catch (error) {
    console.error('Etsy policy check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

