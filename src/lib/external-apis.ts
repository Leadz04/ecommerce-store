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

  async getRelatedQuestions(query: string): Promise<{
    questions: Array<{ question: string; snippet?: string; title?: string; link?: string; nextPageToken?: string }>;
    relatedSearches: string[];
    peopleAlsoSearchFor: Array<{ text: string; link?: string; highlightedWords?: string[] }>;
  }> {
    console.log('[SerpAPI] getRelatedQuestions start', { query });
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey || apiKey === 'demo') {
      console.warn('[SerpAPI] missing API key, returning empty results');
      return { questions: [], relatedSearches: [], peopleAlsoSearchFor: [] };
    }

    // Retry logic with exponential backoff
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
          console.log(`[SerpAPI] Retry attempt ${attempt} after ${delay}ms delay`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // First, get initial questions from regular Google search
        // Use async mode for faster response (submits search and returns immediately)
        // Then we'll poll for results if needed
        const startTime = Date.now();
        const response = await axios.get('https://serpapi.com/search.json', {
          params: {
            engine: 'google',
            q: query,
            api_key: apiKey,
            // Use async mode for faster initial response
            async: 'false', // Set to false for immediate results, true for async (faster but requires polling)
            // Reduce data we don't need to speed up response
            no_cache: 'false' // Use cache if available for faster responses
          },
          timeout: 20000, // Reduced to 20 second timeout
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        });
        
        const elapsed = Date.now() - startTime;
        console.log(`[SerpAPI] Request completed in ${elapsed}ms`);
      
        // Check for errors in response first
        if (response.data?.error) {
          const errorMsg = response.data.error;
          console.warn(`[SerpAPI] API returned error (attempt ${attempt + 1}/${maxRetries + 1}):`, errorMsg);
          
          // If it's a 503 or timeout error, retry
          if ((response.status === 503 || errorMsg.includes("couldn't get valid results")) && attempt < maxRetries) {
            lastError = new Error(errorMsg);
            continue; // Retry
          }
          
          // Otherwise, return empty
          return { questions: [], relatedSearches: [], peopleAlsoSearchFor: [] };
        }

        // Check for HTTP errors
        if (response.status >= 400 && response.status < 500) {
          console.error(`[SerpAPI] Client error ${response.status}:`, response.data);
          return { questions: [], relatedSearches: [], peopleAlsoSearchFor: [] };
        }

        if (response.status >= 500 && attempt < maxRetries) {
          console.warn(`[SerpAPI] Server error ${response.status}, will retry (attempt ${attempt + 1}/${maxRetries + 1})`);
          lastError = new Error(`Server error: ${response.status}`);
          continue; // Retry
        }

        console.log('[SerpAPI] getRelatedQuestions response data keys:', Object.keys(response.data || {}));
        
        // Check related_questions first (newer format), then people_also_ask (older format)
        let questions: any[] = [];
        
        // Check related_questions array
        if (Array.isArray(response.data?.related_questions)) {
          questions = response.data.related_questions;
          console.log('[SerpAPI] Found related_questions array with', questions.length, 'items');
        } else if (response.data?.related_questions) {
          // Sometimes it might be an object with a results array
          questions = response.data.related_questions.results || response.data.related_questions.items || [];
          console.log('[SerpAPI] Found related_questions object, extracted', questions.length, 'items');
        }
        
        // Fallback to people_also_ask if related_questions is empty
        if (questions.length === 0 && Array.isArray(response.data?.people_also_ask)) {
          questions = response.data.people_also_ask;
          console.log('[SerpAPI] Using people_also_ask with', questions.length, 'items');
        }
      
        console.log('[SerpAPI] getRelatedQuestions found', questions.length, 'initial questions');
        
        if (questions.length === 0) {
          // Log detailed structure for debugging
          console.warn('[SerpAPI] No related questions found. Debug info:', {
            hasRelatedQuestions: !!response.data?.related_questions,
            relatedQuestionsType: typeof response.data?.related_questions,
            relatedQuestionsIsArray: Array.isArray(response.data?.related_questions),
            relatedQuestionsValue: response.data?.related_questions ? JSON.stringify(response.data.related_questions).substring(0, 200) : null,
            hasPeopleAlsoAsk: !!response.data?.people_also_ask,
            peopleAlsoAskIsArray: Array.isArray(response.data?.people_also_ask),
            keys: Object.keys(response.data || {})
          });
        }
        
        // Extract related searches (People also search for) from regular Google search
        const searches = response.data?.related_searches || [];
        const relatedSearches: string[] = searches
          .slice(0, 8) // Limit to 8 searches
          .map((item: any) => item.query || item)
          .filter((query: string) => query && query.trim().length > 0);
        
        console.log('[SerpAPI] Found', relatedSearches.length, 'related searches');
        
        // Also fetch "People Also Search For" from Google Shopping (more relevant for products)
        // Only make this call if we have a valid query and it's not empty
        let peopleAlsoSearchFor: Array<{ text: string; link?: string; highlightedWords?: string[] }> = [];
        if (query && query.trim().length > 0) {
          try {
            const shoppingResponse = await axios.get('https://serpapi.com/search.json', {
              params: {
                engine: 'google_shopping',
                q: query,
                api_key: apiKey,
                num: 10, // Just need a few results to get people_also_search_for
                no_cache: 'false'
              },
              timeout: 15000, // Shorter timeout for this secondary call
              validateStatus: (status) => status < 500,
            });
            
            if (shoppingResponse.data && !shoppingResponse.data.error) {
              const shoppingSearches = shoppingResponse.data?.people_also_search_for || [];
              peopleAlsoSearchFor = shoppingSearches
                .slice(0, 8) // Limit to 8
                .map((item: any) => ({
                  text: item.text || '',
                  link: item.link,
                  highlightedWords: item.highlighted_words || []
                }))
                .filter((item: any) => item.text && item.text.trim().length > 0);
              console.log('[SerpAPI] Found', peopleAlsoSearchFor.length, 'people also search for from Google Shopping');
            }
          } catch (shoppingError) {
            console.warn('[SerpAPI] Failed to fetch people_also_search_for from Google Shopping:', shoppingError);
            // Don't fail the whole request if this fails
          }
        } else {
          console.log('[SerpAPI] Skipping Google Shopping API call - invalid or empty query');
        }
        
        // Success - return questions, related searches, and people also search for
        return {
          questions: questions.map((item: any, index: number) => {
          // Log first item structure for debugging
          if (index === 0 && questions.length > 0) {
            console.log('[SerpAPI] Sample question item structure:', {
              keys: Object.keys(item),
              hasQuestion: !!item.question,
              hasNextPageToken: !!item.next_page_token,
              hasSerpapiLink: !!item.serpapi_related_questions_link,
              item: JSON.stringify(item).substring(0, 300)
            });
          }
          
          // Extract token - check multiple possible fields
          let token: string | undefined = undefined;
          
          // 1. Direct next_page_token field (most common)
          if (item.next_page_token) {
            token = item.next_page_token;
          }
          // 2. Extract from serpapi_related_questions_link URL
          else if (item.serpapi_related_questions_link) {
            try {
              const url = new URL(item.serpapi_related_questions_link);
              token = url.searchParams.get('next_page_token') || undefined;
            } catch {
              // If it's not a URL, it might be the token itself
              token = item.serpapi_related_questions_link;
            }
          }
          // 3. Check for token in other possible fields
          else if (item.token) {
            token = item.token;
          }
          
            return {
              question: item.question || item.title || '',
              snippet: item.snippet || item.answer || '',
              title: item.title || '',
              link: item.link || '',
              nextPageToken: token
            };
          }),
          relatedSearches,
          peopleAlsoSearchFor
        };
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a timeout error
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          console.warn(`[SerpAPI] Request timeout (attempt ${attempt + 1}/${maxRetries + 1})`);
          if (attempt < maxRetries) {
            continue; // Retry
          }
        }
        
        // Check if it's a network error
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          console.warn(`[SerpAPI] Network error (attempt ${attempt + 1}/${maxRetries + 1}):`, error.code);
          if (attempt < maxRetries) {
            continue; // Retry
          }
        }
        
        // For other errors or if we've exhausted retries
        console.error('[SerpAPI] getRelatedQuestions error:', error.message || error);
        if (error.response) {
          console.error('[SerpAPI] Response status:', error.response.status);
          console.error('[SerpAPI] Response data:', error.response.data);
        }
        
        // If this was the last attempt, return empty
        if (attempt === maxRetries) {
          return { questions: [], relatedSearches: [], peopleAlsoSearchFor: [] };
        }
      }
    }
    
    // If we get here, all retries failed
    console.error('[SerpAPI] All retry attempts failed. Last error:', lastError?.message);
    return { questions: [], relatedSearches: [], peopleAlsoSearchFor: [] };
  }

  async getMoreRelatedQuestions(nextPageToken: string): Promise<Array<{ question: string; snippet?: string; title?: string; link?: string; nextPageToken?: string }>> {
    console.log('[SerpAPI] getMoreRelatedQuestions start', { nextPageToken });
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey || apiKey === 'demo') {
      console.warn('[SerpAPI] missing API key, returning empty results');
      return [];
    }

    // Retry logic with exponential backoff
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
          console.log(`[SerpAPI] Retry attempt ${attempt} after ${delay}ms delay`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Use Google Related Questions API with the token (as shown in user's example)
        const startTime = Date.now();
        const response = await axios.get('https://serpapi.com/search.json', {
          params: {
            engine: 'google_related_questions',
            next_page_token: nextPageToken,
            api_key: apiKey,
            no_cache: 'false' // Use cache if available
          },
          timeout: 20000, // Reduced to 20 second timeout
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        });
        
        const elapsed = Date.now() - startTime;
        console.log(`[SerpAPI] getMoreRelatedQuestions request completed in ${elapsed}ms`);
      
      console.log('[SerpAPI] getMoreRelatedQuestions response data keys:', Object.keys(response.data || {}));
      
        // Check for errors in response
        if (response.data?.error) {
          const errorMsg = response.data.error;
          console.warn(`[SerpAPI] API returned error (attempt ${attempt + 1}/${maxRetries + 1}):`, errorMsg);
          
          // If it's a 503 or timeout error, retry
          if ((response.status === 503 || errorMsg.includes("couldn't get valid results")) && attempt < maxRetries) {
            lastError = new Error(errorMsg);
            continue; // Retry
          }
          
          // Otherwise, return empty
          return [];
        }

        // Check for HTTP errors
        if (response.status >= 400 && response.status < 500) {
          console.error(`[SerpAPI] Client error ${response.status}:`, response.data);
          return [];
        }

        if (response.status >= 500 && attempt < maxRetries) {
          console.warn(`[SerpAPI] Server error ${response.status}, will retry (attempt ${attempt + 1}/${maxRetries + 1})`);
          lastError = new Error(`Server error: ${response.status}`);
          continue; // Retry
        }
      
      // Check for related_questions array
      let relatedQuestions: any[] = [];
      if (Array.isArray(response.data?.related_questions)) {
        relatedQuestions = response.data.related_questions;
      } else if (response.data?.related_questions) {
        // Sometimes it might be an object with nested arrays
        relatedQuestions = response.data.related_questions.results || response.data.related_questions.items || [];
      }
      
      console.log('[SerpAPI] getMoreRelatedQuestions found', relatedQuestions.length, 'additional questions');
      
      if (relatedQuestions.length === 0) {
        console.warn('[SerpAPI] No related questions in response. Response structure:', {
          hasRelatedQuestions: !!response.data?.related_questions,
          relatedQuestionsType: typeof response.data?.related_questions,
          relatedQuestionsIsArray: Array.isArray(response.data?.related_questions),
          hasError: !!response.data?.error,
          errorMessage: response.data?.error,
          keys: Object.keys(response.data || {})
        });
      }
      
      return relatedQuestions.map((item: any, index: number) => {
        // Log first item structure for debugging
        if (index === 0 && relatedQuestions.length > 0) {
          console.log('[SerpAPI] Sample additional question item structure:', {
            keys: Object.keys(item),
            hasQuestion: !!item.question,
            hasNextPageToken: !!item.next_page_token,
            item: JSON.stringify(item).substring(0, 300)
          });
        }
        
        // Extract token - check multiple possible fields
        let token: string | undefined = undefined;
        
        // 1. Direct next_page_token field (most common)
        if (item.next_page_token) {
          token = item.next_page_token;
        }
        // 2. Extract from serpapi_related_questions_link URL
        else if (item.serpapi_related_questions_link) {
          try {
            const url = new URL(item.serpapi_related_questions_link);
            token = url.searchParams.get('next_page_token') || undefined;
          } catch {
            token = item.serpapi_related_questions_link;
          }
        }
        // 3. Check for token in other possible fields
        else if (item.token) {
          token = item.token;
        }
        
        return {
          question: item.question || item.title || '',
          snippet: item.snippet || item.answer || '',
          title: item.title || '',
          link: item.link || '',
          nextPageToken: token
        };
      });
        // Success - return the questions
        return relatedQuestions.map((item: any, index: number) => {
          // Log first item structure for debugging
          if (index === 0 && relatedQuestions.length > 0) {
            console.log('[SerpAPI] Sample additional question item structure:', {
              keys: Object.keys(item),
              hasQuestion: !!item.question,
              hasNextPageToken: !!item.next_page_token,
              item: JSON.stringify(item).substring(0, 300)
            });
          }
          
          // Extract token - check multiple possible fields
          let token: string | undefined = undefined;
          
          // 1. Direct next_page_token field (most common)
          if (item.next_page_token) {
            token = item.next_page_token;
          }
          // 2. Extract from serpapi_related_questions_link URL
          else if (item.serpapi_related_questions_link) {
            try {
              const url = new URL(item.serpapi_related_questions_link);
              token = url.searchParams.get('next_page_token') || undefined;
            } catch {
              token = item.serpapi_related_questions_link;
            }
          }
          // 3. Check for token in other possible fields
          else if (item.token) {
            token = item.token;
          }
          
          return {
            question: item.question || item.title || '',
            snippet: item.snippet || item.answer || '',
            title: item.title || '',
            link: item.link || '',
            nextPageToken: token
          };
        });
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a timeout error
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          console.warn(`[SerpAPI] Request timeout (attempt ${attempt + 1}/${maxRetries + 1})`);
          if (attempt < maxRetries) {
            continue; // Retry
          }
        }
        
        // Check if it's a network error
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          console.warn(`[SerpAPI] Network error (attempt ${attempt + 1}/${maxRetries + 1}):`, error.code);
          if (attempt < maxRetries) {
            continue; // Retry
          }
        }
        
        // For other errors or if we've exhausted retries
        console.error('[SerpAPI] getMoreRelatedQuestions error:', error.message || error);
        if (error.response) {
          console.error('[SerpAPI] Response status:', error.response.status);
          console.error('[SerpAPI] Response data:', JSON.stringify(error.response.data).substring(0, 500));
        }
        
        // If this was the last attempt, return empty
        if (attempt === maxRetries) {
          return [];
        }
      }
    }
    
    // If we get here, all retries failed
    console.error('[SerpAPI] All retry attempts failed. Last error:', lastError?.message);
    return [];
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
