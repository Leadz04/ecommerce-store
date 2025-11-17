import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';
import axios from 'axios';

// Etsy Seller Handbook Guidelines
const ETSY_GUIDELINES = {
  title: {
    maxLength: 140,
    minLength: 10,
    recommendedKeywords: 3,
    avoidWords: ['cheap', 'free shipping', 'best', 'amazing', 'wow']
  },
  description: {
    minLength: 200,
    recommendedLength: 500,
    maxLength: 5000,
    shouldInclude: ['materials', 'dimensions', 'care instructions', 'shipping info'],
    formatting: ['paragraphs', 'bullet points', 'headers']
  },
  tags: {
    minCount: 10,
    maxCount: 13,
    recommendedCount: 13,
    shouldBeSpecific: true
  },
  images: {
    minCount: 5,
    recommendedCount: 10,
    maxCount: 10,
    shouldInclude: ['lifestyle', 'detail shots', 'multiple angles']
  },
  pricing: {
    shouldBeCompetitive: true,
    shouldIncludeShipping: true
  },
  seo: {
    keywordDensity: 1.5, // percentage
    shouldUseLongTailKeywords: true
  }
};

interface AnalysisResult {
  productId: string;
  productName: string;
  score: number;
  issues: Array<{
    category: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    recommendation: string;
  }>;
  googleData?: {
    searchVisibility: number;
    competitorAnalysis: any[];
    keywordPerformance: any[];
  };
  etsyCompliance: {
    title: boolean;
    description: boolean;
    tags: boolean;
    images: boolean;
    pricing: boolean;
    seo: boolean;
  };
}

// Analyze product against Etsy guidelines
function analyzeProduct(product: any, googleData?: any): AnalysisResult {
  const issues: AnalysisResult['issues'] = [];
  let score = 100;
  const etsyCompliance: AnalysisResult['etsyCompliance'] = {
    title: true,
    description: true,
    tags: true,
    images: true,
    pricing: true,
    seo: true
  };

  // Title Analysis
  const title = product.name || '';
  const titleLength = title.length;
  
  if (titleLength > ETSY_GUIDELINES.title.maxLength) {
    issues.push({
      category: 'Title',
      severity: 'error',
      message: `Title is ${titleLength} characters (max: ${ETSY_GUIDELINES.title.maxLength})`,
      recommendation: 'Shorten your title to 140 characters or less'
    });
    score -= 10;
    etsyCompliance.title = false;
  } else if (titleLength < ETSY_GUIDELINES.title.minLength) {
    issues.push({
      category: 'Title',
      severity: 'warning',
      message: `Title is too short (${titleLength} characters, min: ${ETSY_GUIDELINES.title.minLength})`,
      recommendation: 'Add more descriptive keywords to your title'
    });
    score -= 5;
  }

  // Check for avoided words in title
  const titleLower = title.toLowerCase();
  const foundAvoidWords = ETSY_GUIDELINES.title.avoidWords.filter(word => 
    titleLower.includes(word)
  );
  if (foundAvoidWords.length > 0) {
    issues.push({
      category: 'Title',
      severity: 'warning',
      message: `Title contains words to avoid: ${foundAvoidWords.join(', ')}`,
      recommendation: 'Remove generic marketing words and use specific product descriptors'
    });
    score -= 3;
  }

  // Description Analysis
  const description = product.description || '';
  const descriptionHtml = (product as any).descriptionHtml || '';
  const plainDescription = descriptionHtml.replace(/<[^>]*>/g, ' ') || description;
  const descLength = plainDescription.length;

  if (descLength < ETSY_GUIDELINES.description.minLength) {
    issues.push({
      category: 'Description',
      severity: 'error',
      message: `Description is too short (${descLength} characters, min: ${ETSY_GUIDELINES.description.minLength})`,
      recommendation: 'Add more details about materials, dimensions, care instructions, and shipping'
    });
    score -= 15;
    etsyCompliance.description = false;
  } else if (descLength < ETSY_GUIDELINES.description.recommendedLength) {
    issues.push({
      category: 'Description',
      severity: 'warning',
      message: `Description could be more detailed (${descLength} characters, recommended: ${ETSY_GUIDELINES.description.recommendedLength}+)`,
      recommendation: 'Add more product details, usage instructions, and care information'
    });
    score -= 5;
  }

  if (descLength > ETSY_GUIDELINES.description.maxLength) {
    issues.push({
      category: 'Description',
      severity: 'warning',
      message: `Description is very long (${descLength} characters, max: ${ETSY_GUIDELINES.description.maxLength})`,
      recommendation: 'Consider breaking into sections with headers and bullet points'
    });
    score -= 3;
  }

  // Check for required elements in description
  const descLower = plainDescription.toLowerCase();
  const missingElements = ETSY_GUIDELINES.description.shouldInclude.filter(element => {
    const keywords: Record<string, string[]> = {
      'materials': ['material', 'fabric', 'made of', 'constructed from'],
      'dimensions': ['dimension', 'size', 'measurement', 'inches', 'cm', 'width', 'height', 'length'],
      'care instructions': ['care', 'wash', 'clean', 'maintain', 'instructions'],
      'shipping info': ['shipping', 'delivery', 'ship', 'arrives']
    };
    return !keywords[element]?.some(keyword => descLower.includes(keyword));
  });

  if (missingElements.length > 0) {
    issues.push({
      category: 'Description',
      severity: 'warning',
      message: `Missing important information: ${missingElements.join(', ')}`,
      recommendation: `Add details about ${missingElements.join(', ')} to help customers make informed decisions`
    });
    score -= 5;
  }

  // Tags Analysis (if available)
  const tags = (product as any).tags || [];
  const tagCount = tags.length;

  if (tagCount < ETSY_GUIDELINES.tags.minCount) {
    issues.push({
      category: 'Tags',
      severity: 'error',
      message: `Only ${tagCount} tags (recommended: ${ETSY_GUIDELINES.tags.recommendedCount})`,
      recommendation: `Add more specific tags. Etsy allows up to ${ETSY_GUIDELINES.tags.maxCount} tags - use them all!`
    });
    score -= 10;
    etsyCompliance.tags = false;
  } else if (tagCount < ETSY_GUIDELINES.tags.recommendedCount) {
    issues.push({
      category: 'Tags',
      severity: 'warning',
      message: `You have ${tagCount} tags, but Etsy allows ${ETSY_GUIDELINES.tags.recommendedCount}`,
      recommendation: 'Add more specific, long-tail keyword tags to improve discoverability'
    });
    score -= 5;
  }

  // Images Analysis
  const images = product.images || [];
  const imageCount = images.length + (product.image ? 1 : 0);

  if (imageCount < ETSY_GUIDELINES.images.minCount) {
    issues.push({
      category: 'Images',
      severity: 'error',
      message: `Only ${imageCount} images (recommended: ${ETSY_GUIDELINES.images.recommendedCount})`,
      recommendation: `Add more high-quality images showing different angles, lifestyle shots, and detail views. Etsy allows up to ${ETSY_GUIDELINES.images.maxCount} images.`
    });
    score -= 15;
    etsyCompliance.images = false;
  } else if (imageCount < ETSY_GUIDELINES.images.recommendedCount) {
    issues.push({
      category: 'Images',
      severity: 'warning',
      message: `You have ${imageCount} images, but more would help`,
      recommendation: 'Add lifestyle photos, detail shots, and images showing the product in use'
    });
    score -= 5;
  }

  // Pricing Analysis
  const price = product.price || 0;
  if (price <= 0) {
    issues.push({
      category: 'Pricing',
      severity: 'error',
      message: 'Product price is missing or invalid',
      recommendation: 'Set a competitive price for your product'
    });
    score -= 10;
    etsyCompliance.pricing = false;
  }

  // SEO Analysis
  const titleKeywords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const descKeywords = descLower.split(/\s+/).filter(w => w.length > 3);
  const keywordDensity = titleKeywords.length / Math.max(descKeywords.length, 1) * 100;

  if (keywordDensity < ETSY_GUIDELINES.seo.keywordDensity) {
    issues.push({
      category: 'SEO',
      severity: 'info',
      message: 'Keywords could be better integrated',
      recommendation: 'Use your main keywords naturally throughout the description'
    });
    score -= 3;
  }

  // Google Search Visibility (if data available)
  let googleDataResult: any = undefined;
  if (googleData) {
    googleDataResult = {
      searchVisibility: googleData.visibility || 0,
      competitorAnalysis: googleData.competitors || [],
      keywordPerformance: googleData.keywords || []
    };
  }

  return {
    productId: product._id.toString(),
    productName: product.name,
    score: Math.max(0, score),
    issues,
    googleData: googleDataResult,
    etsyCompliance
  };
}

// Fetch Google data for product
async function fetchGoogleData(product: any, baseUrl: string): Promise<any> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey || apiKey === 'demo') {
    return null;
  }

  try {
    // Search for the product on Google Shopping
    const searchQuery = product.name;
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_shopping',
        q: searchQuery,
        num: 10,
        api_key: apiKey
      }
    });

    const shoppingResults = response.data?.shopping_results || [];
    
    // Analyze competitors
    const competitors = shoppingResults.slice(0, 5).map((item: any) => ({
      title: item.title,
      price: item.extracted_price,
      rating: item.rating,
      reviews: item.reviews,
      source: item.source
    }));

    // Extract keywords from related searches
    const relatedSearches = response.data?.related_searches || [];
    const keywords = relatedSearches.map((item: any) => item.query);

    return {
      visibility: shoppingResults.length > 0 ? 50 : 0,
      competitors,
      keywords
    };
  } catch (error) {
    console.error('Google data fetch error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAnyPermission([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_UPDATE])(request);
    await connectDB();

    const { productIds, includeGoogleData = true } = await request.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'Product IDs array required' }, { status: 400 });
    }

    const products = await Product.find({ _id: { $in: productIds } });
    
    if (products.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const results: AnalysisResult[] = [];

    for (const product of products) {
      let googleData = null;
      if (includeGoogleData) {
        googleData = await fetchGoogleData(product, baseUrl);
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const analysis = analyzeProduct(product, googleData);
      if (googleData) {
        analysis.googleData = {
          searchVisibility: googleData.visibility || 0,
          competitorAnalysis: googleData.competitors || [],
          keywordPerformance: googleData.keywords || []
        };
      }
      results.push(analysis);
    }

    // Calculate overall statistics
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const complianceRate = {
      title: results.filter(r => r.etsyCompliance.title).length / results.length * 100,
      description: results.filter(r => r.etsyCompliance.description).length / results.length * 100,
      tags: results.filter(r => r.etsyCompliance.tags).length / results.length * 100,
      images: results.filter(r => r.etsyCompliance.images).length / results.length * 100,
      pricing: results.filter(r => r.etsyCompliance.pricing).length / results.length * 100,
      seo: results.filter(r => r.etsyCompliance.seo).length / results.length * 100
    };

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalProducts: results.length,
        averageScore: Math.round(avgScore * 10) / 10,
        complianceRate,
        totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
        criticalIssues: results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'error').length, 0)
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Analyze Etsy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

