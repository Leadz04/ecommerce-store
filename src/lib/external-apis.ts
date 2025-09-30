// External API integrations for eRank-like functionality
import axios from 'axios';

// Google Trends API (Free)
export class GoogleTrendsAPI {
  private baseUrl = 'https://trends.google.com/trends/api';

  async getTrendingKeywords(geo = 'US', timeframe = 'today 3-m'): Promise<any[]> {
    try {
      // This is a simplified implementation
      // In production, you'd need to use a proper Google Trends API wrapper
      const response = await axios.get(`${this.baseUrl}/dailytrends`, {
        params: {
          hl: 'en-US',
          tz: '-480',
          geo: geo,
          ns: '15'
        }
      });
      
      return this.parseTrendsData(response.data);
    } catch (error) {
      console.error('Google Trends API error:', error);
      return [];
    }
  }

  private parseTrendsData(data: any): any[] {
    // Parse Google Trends data
    // This is a mock implementation - you'd need proper parsing
    return [
      { keyword: 'sustainable jewelry', volume: 45000, trend: 'rising' },
      { keyword: 'minimalist design', volume: 32000, trend: 'rising' },
      { keyword: 'personalized gifts', volume: 28000, trend: 'rising' }
    ];
  }
}

// Etsy API (Free with registration)
export class EtsyAPI {
  private baseUrl = 'https://openapi.etsy.com/v3';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchListings(query: string, limit = 20): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/application/listings/active`, {
        headers: {
          'x-api-key': this.apiKey
        },
        params: {
          keywords: query,
          limit: limit,
          includes: 'Images,Shop'
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Etsy API error:', error);
      return [];
    }
  }

  async getShopListings(shopId: string, limit = 20): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/application/shops/${shopId}/listings/active`, {
        headers: {
          'x-api-key': this.apiKey
        },
        params: {
          limit: limit,
          includes: 'Images'
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Etsy API error:', error);
      return [];
    }
  }

  async getCategories(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/application/categories`, {
        headers: {
          'x-api-key': this.apiKey
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Etsy API error:', error);
      return [];
    }
  }
}

// Free SEO APIs
export class SEOAPIs {
  // SerpAPI (Free tier available)
  async getKeywordData(keyword: string): Promise<any> {
    console.log('[SerpAPI] getKeywordData start', { keyword });
    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google',
          q: keyword,
          api_key: process.env.SERPAPI_KEY || 'demo'
        }
      });
      console.log('[SerpAPI] getKeywordData success');
      return {
        keyword,
        searchVolume: this.extractSearchVolume(response.data),
        competition: this.extractCompetition(response.data),
        difficulty: this.calculateDifficulty(response.data)
      };
    } catch (error) {
      console.error('[SerpAPI] getKeywordData error:', error);
      return null;
    }
  }

  private extractSearchVolume(data: any): number {
    // Extract search volume from SerpAPI response
    // This is a mock implementation
    return Math.floor(Math.random() * 100000) + 1000;
  }

  private extractCompetition(data: any): 'low' | 'medium' | 'high' {
    // Extract competition level
    const random = Math.random();
    if (random < 0.3) return 'low';
    if (random < 0.7) return 'medium';
    return 'high';
  }

  private calculateDifficulty(data: any): number {
    // Calculate keyword difficulty
    return Math.floor(Math.random() * 100) + 1;
  }

  async searchKeywordsSerpAPI(query: string, limit = 20): Promise<Array<{ keyword: string; searchVolume: number; competition: 'low' | 'medium' | 'high'; difficulty: number }>> {
    console.log('[SerpAPI] searchKeywords start', { query, limit });
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey || apiKey === 'demo') {
      // Graceful fallback: no real API key
      console.warn('[SerpAPI] missing API key, returning empty results');
      return [];
    }

    try {
      // Using Google related searches as a lightweight source
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google',
          q: query,
          api_key: apiKey,
          num: limit
        }
      });
      console.log('[SerpAPI] searchKeywords success');
      const related: string[] = (response.data?.related_searches || []).map((r: any) => r.query) || [];
      const base: string[] = [query, ...related].slice(0, limit);
      return base.map(k => ({
        keyword: k,
        searchVolume: this.extractSearchVolume(response.data),
        competition: this.extractCompetition(response.data),
        difficulty: this.calculateDifficulty(response.data)
      }));
    } catch (error) {
      console.error('[SerpAPI] searchKeywords error:', error);
      return [];
    }
  }

  async searchProductsSerpAPI(query: string, limit = 20): Promise<Array<{ title: string; source?: string; price?: number; originalPrice?: number; rating?: number; reviews?: number; thumbnail?: string; productId?: string; productApiUrl?: string; link?: string }>> {
    console.log('[SerpAPI] searchProducts start', { query, limit });
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey || apiKey === 'demo') {
      console.warn('[SerpAPI] missing API key, returning empty product results');
      return [];
    }
    try {
      // 1) Try Google Shopping engine (more reliable for product cards)
      const shoppingRes = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google_shopping',
          q: query,
          num: limit,
          api_key: apiKey
        }
      });
      const shopping = shoppingRes.data?.shopping_results || [];
      let products = shopping.slice(0, limit).map((p: any) => ({
        title: p.title,
        source: p.source || p.store,
        price: p.extracted_price,
        originalPrice: p.extracted_original_price,
        rating: p.rating,
        reviews: typeof p.reviews === 'string' ? parseInt(p.reviews.replace(/\D/g, '')) : p.reviews,
        thumbnail: p.thumbnail,
        productId: p.product_id,
        productApiUrl: p.serpapi_product_api,
        link: p.link
      }));

      if (products.length > 0) {
        console.log('[SerpAPI] searchProducts success (google_shopping)', { count: products.length });
        return products;
      }

      // 2) Fallback to classic Google results with immersive_products
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google',
          q: query,
          num: limit,
          api_key: apiKey
        }
      });
      const immersive = response.data?.immersive_products || [];
      products = immersive.slice(0, limit).map((p: any) => ({
        title: p.title,
        source: p.source,
        price: p.extracted_price,
        originalPrice: p.extracted_original_price,
        rating: p.rating,
        reviews: typeof p.reviews === 'string' ? parseInt(p.reviews.replace(/\D/g, '')) : p.reviews,
        thumbnail: p.thumbnail,
        productId: p.product_id,
        productApiUrl: p.serpapi_product_api,
        link: undefined
      }));
      console.log('[SerpAPI] searchProducts success (google immersive)', { count: products.length });
      return products;
    } catch (error) {
      console.error('[SerpAPI] searchProducts error:', error);
      return [];
    }
  }
}

// Mock data generator for development
export class MockDataGenerator {
  static generateKeywords(category: string, count = 20): any[] {
    const baseKeywords = {
      jewelry: [
        'handmade jewelry', 'vintage ring', 'custom necklace', 'silver bracelet',
        'gold earrings', 'diamond ring', 'pearl necklace', 'gemstone pendant'
      ],
      'home-living': [
        'vintage furniture', 'handmade pottery', 'wooden decor', 'ceramic vase',
        'textile art', 'wall hanging', 'candle holder', 'plant pot'
      ],
      clothing: [
        'handmade dress', 'vintage shirt', 'custom t-shirt', 'wool sweater',
        'leather jacket', 'cotton blouse', 'denim jeans', 'silk scarf'
      ]
    };

    const keywords = baseKeywords[category as keyof typeof baseKeywords] || baseKeywords.jewelry;
    
    return keywords.slice(0, count).map(keyword => ({
      keyword,
      searchVolume: Math.floor(Math.random() * 50000) + 1000,
      competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      difficulty: Math.floor(Math.random() * 100) + 1,
      trend: ['rising', 'stable', 'falling'][Math.floor(Math.random() * 3)] as 'rising' | 'stable' | 'falling',
      category,
      relatedKeywords: this.generateRelatedKeywords(keyword)
    }));
  }

  static generateCompetitors(category: string, count = 5): any[] {
    const shopNames = [
      'ArtisanCrafts', 'VintageFinds', 'HandmadeHaven', 'CreativeCorner',
      'UniqueDesigns', 'CraftyCreations', 'ArtisticExpressions', 'DesignerStudio'
    ];

    return Array.from({ length: count }, (_, i) => ({
      shopName: shopNames[i] || `Shop${i + 1}`,
      shopUrl: `https://www.etsy.com/shop/${shopNames[i]?.toLowerCase() || `shop${i + 1}`}`,
      category,
      totalListings: Math.floor(Math.random() * 100) + 10,
      totalSales: Math.floor(Math.random() * 5000) + 100,
      averagePrice: Math.floor(Math.random() * 200) + 20,
      topKeywords: this.generateTopKeywords(category),
      performanceMetrics: {
        listingQuality: Math.floor(Math.random() * 40) + 60,
        seoScore: Math.floor(Math.random() * 40) + 60,
        conversionRate: Math.floor(Math.random() * 5) + 2,
        averageRating: Math.floor(Math.random() * 2) + 3
      }
    }));
  }

  static generateTrends(category: string, count = 10): any[] {
    const trendingKeywords = [
      'sustainable jewelry', 'minimalist design', 'personalized gifts',
      'eco-friendly products', 'vintage style', 'handmade quality',
      'custom orders', 'unique designs', 'artisan made', 'local crafts'
    ];

    return trendingKeywords.slice(0, count).map(keyword => ({
      keyword,
      trendDirection: ['rising', 'stable', 'falling'][Math.floor(Math.random() * 3)] as 'rising' | 'stable' | 'falling',
      trendStrength: Math.floor(Math.random() * 100) + 1,
      peakMonths: this.generatePeakMonths(),
      seasonalPattern: this.generateSeasonalPattern(),
      relatedTrends: this.generateRelatedTrends(keyword)
    }));
  }

  private static generateRelatedKeywords(keyword: string): string[] {
    const related = {
      'handmade jewelry': ['custom jewelry', 'artisan jewelry', 'unique jewelry'],
      'vintage ring': ['antique ring', 'classic ring', 'retro ring'],
      'custom necklace': ['personalized necklace', 'bespoke necklace', 'made to order necklace']
    };

    return related[keyword as keyof typeof related] || ['related keyword 1', 'related keyword 2'];
  }

  private static generateTopKeywords(category: string): string[] {
    const keywords = {
      jewelry: ['handmade jewelry', 'custom ring', 'vintage necklace', 'silver bracelet'],
      'home-living': ['vintage furniture', 'handmade pottery', 'wooden decor', 'ceramic vase'],
      clothing: ['handmade dress', 'vintage shirt', 'custom t-shirt', 'wool sweater']
    };

    return keywords[category as keyof typeof keywords] || ['keyword 1', 'keyword 2', 'keyword 3'];
  }

  private static generatePeakMonths(): number[] {
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    return months.sort(() => Math.random() - 0.5).slice(0, 3);
  }

  private static generateSeasonalPattern(): Array<{ month: number; averageVolume: number }> {
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      averageVolume: Math.floor(Math.random() * 10000) + 1000
    }));
  }

  private static generateRelatedTrends(keyword: string): string[] {
    return [`${keyword} alternative`, `${keyword} similar`, `${keyword} related`];
  }
}
