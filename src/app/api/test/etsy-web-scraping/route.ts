import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapingResult {
  success: boolean;
  data?: any;
  error?: string;
}

async function scrapeEtsyShop(shopName: string): Promise<ScrapingResult> {
  try {
    const shopUrl = `https://www.etsy.com/shop/${shopName}`;
    
    const response = await axios.get(shopUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    
    // Extract shop information
    const shopInfo = {
      name: $('h1').first().text().trim(),
      description: $('.shop-description').text().trim(),
      location: $('.shop-location').text().trim(),
      totalSales: $('.shop-sales').text().trim(),
      memberSince: $('.shop-member-since').text().trim(),
    };

    // Extract listings
    const listings: any[] = [];
    $('.listing-link').each((index, element) => {
      const $element = $(element);
      const listing = {
        title: $element.find('.listing-title').text().trim(),
        price: $element.find('.currency-value').text().trim(),
        url: $element.attr('href'),
        image: $element.find('img').attr('src'),
        reviews: $element.find('.review-count').text().trim(),
      };
      
      if (listing.title && listing.price) {
        listings.push(listing);
      }
    });

    return {
      success: true,
      data: {
        shopInfo,
        listings,
        totalListings: listings.length,
      },
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function scrapeEtsySearch(query: string): Promise<ScrapingResult> {
  try {
    const searchUrl = `https://www.etsy.com/search?q=${encodeURIComponent(query)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    
    const listings: any[] = [];
    $('.listing-link').each((index, element) => {
      const $element = $(element);
      const listing = {
        title: $element.find('.listing-title').text().trim(),
        price: $element.find('.currency-value').text().trim(),
        url: $element.attr('href'),
        image: $element.find('img').attr('src'),
        shop: $element.find('.shop-name').text().trim(),
        reviews: $element.find('.review-count').text().trim(),
      };
      
      if (listing.title && listing.price) {
        listings.push(listing);
      }
    });

    return {
      success: true,
      data: {
        query,
        listings,
        totalResults: listings.length,
      },
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopName = searchParams.get('shop');
    const query = searchParams.get('query');
    
    console.log('🔍 Starting Etsy Web Scraping Test...');
    
    const results = [];
    
    if (shopName) {
      console.log(`📦 Scraping shop: ${shopName}`);
      const shopResult = await scrapeEtsyShop(shopName);
      results.push({
        type: 'shop',
        name: shopName,
        ...shopResult,
      });
    }
    
    if (query) {
      console.log(`🔎 Scraping search: ${query}`);
      const searchResult = await scrapeEtsySearch(query);
      results.push({
        type: 'search',
        name: query,
        ...searchResult,
      });
    }
    
    // Default test if no parameters
    if (!shopName && !query) {
      console.log('🔎 Running default search test...');
      const searchResult = await scrapeEtsySearch('handmade jewelry');
      results.push({
        type: 'search',
        name: 'handmade jewelry',
        ...searchResult,
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    return NextResponse.json({
      success: true,
      message: `Etsy Web Scraping Test Completed: ${successCount}/${totalCount} tests passed`,
      results,
      summary: {
        total: totalCount,
        passed: successCount,
        failed: totalCount - successCount,
        accessible: successCount > 0,
      },
    });

  } catch (error) {
    console.error('Etsy Web Scraping Test Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
