import axios from 'axios';

interface EtsyMobileResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class EtsyMobileAPI {
  private baseUrl = 'https://www.etsy.com/api/v3/ajax';
  private sessionId?: string;
  private csrfToken?: string;

  constructor() {
    this.initializeSession();
  }

  private async initializeSession() {
    try {
      // Get initial session data
      const response = await axios.get('https://www.etsy.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      // Extract session ID and CSRF token from response
      const html = response.data;
      const sessionMatch = html.match(/sessionId['"]\s*:\s*['"]([^'"]+)['"]/);
      const csrfMatch = html.match(/csrfToken['"]\s*:\s*['"]([^'"]+)['"]/);

      if (sessionMatch) this.sessionId = sessionMatch[1];
      if (csrfMatch) this.csrfToken = csrfMatch[1];

      console.log('Session initialized:', { sessionId: this.sessionId, csrfToken: this.csrfToken });
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  private getHeaders() {
    return {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': this.csrfToken || '',
      'Cookie': this.sessionId ? `sessionId=${this.sessionId}` : '',
    };
  }

  // Test method to get shop information
  async getShopInfo(shopName: string): Promise<EtsyMobileResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/shops/${shopName}`, {
        headers: this.getHeaders(),
        timeout: 10000,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Failed to get shop info:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Test method to get shop listings
  async getShopListings(shopName: string, limit = 20): Promise<EtsyMobileResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/shops/${shopName}/listings`, {
        headers: this.getHeaders(),
        params: {
          limit,
          offset: 0,
        },
        timeout: 10000,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Failed to get shop listings:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Test method to get listing details
  async getListingDetails(listingId: string): Promise<EtsyMobileResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/listings/${listingId}`, {
        headers: this.getHeaders(),
        timeout: 10000,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Failed to get listing details:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Test method to search listings
  async searchListings(query: string, limit = 20): Promise<EtsyMobileResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/search/listings`, {
        headers: this.getHeaders(),
        params: {
          q: query,
          limit,
          offset: 0,
        },
        timeout: 10000,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Failed to search listings:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Test method to get categories
  async getCategories(): Promise<EtsyMobileResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/categories`, {
        headers: this.getHeaders(),
        timeout: 10000,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Failed to get categories:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Test method to get trending listings
  async getTrendingListings(): Promise<EtsyMobileResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/trending/listings`, {
        headers: this.getHeaders(),
        timeout: 10000,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Failed to get trending listings:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Test function to run all API tests
export async function testEtsyMobileAPI() {
  console.log('🧪 Testing Etsy Mobile API...\n');

  const api = new EtsyMobileAPI();

  // Wait a bit for session initialization
  await new Promise(resolve => setTimeout(resolve, 2000));

  const tests = [
    {
      name: 'Get Categories',
      test: () => api.getCategories(),
    },
    {
      name: 'Search Listings (test query)',
      test: () => api.searchListings('handmade jewelry', 5),
    },
    {
      name: 'Get Trending Listings',
      test: () => api.getTrendingListings(),
    },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`);
    try {
      const result = await test.test();
      results.push({
        name: test.name,
        success: result.success,
        data: result.data,
        error: result.error,
      });

      if (result.success) {
        console.log(`✅ ${test.name}: SUCCESS`);
        console.log(`📊 Data received:`, JSON.stringify(result.data, null, 2));
      } else {
        console.log(`❌ ${test.name}: FAILED - ${result.error}`);
      }
    } catch (error: any) {
      console.log(`💥 ${test.name}: ERROR - ${error.message}`);
      results.push({
        name: test.name,
        success: false,
        error: error.message,
      });
    }
    console.log('---\n');
  }

  // Summary
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log(`📈 Test Summary: ${successCount}/${totalCount} tests passed`);
  
  if (successCount > 0) {
    console.log('🎉 Etsy Mobile API is accessible!');
    console.log('💡 You can use this method to get data from Etsy');
  } else {
    console.log('⚠️ Etsy Mobile API is not accessible');
    console.log('💡 Consider using official API or alternative methods');
  }

  return results;
}
