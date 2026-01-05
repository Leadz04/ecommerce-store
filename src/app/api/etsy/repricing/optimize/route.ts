import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing, EtsyOrder } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { GoogleGenAI } from '@google/genai';
import { needsEtsyDataRefresh } from '@/lib/etsy-compliance';

interface OptimizePriceRequest {
  shopId: string;
  listingId: string;
  currentPrice: number;
  quantity: number;
  views?: number;
  favorers?: number;
  orders30d?: number;
  revenue30d?: number;
  category?: string;
  title?: string;
}

function buildPriceOptimizationPrompt(data: OptimizePriceRequest): string {
  return `You are a pricing optimization expert for Etsy sellers. Analyze the listing data and suggest an optimal price.

Current Listing Information:
- Current Price: $${data.currentPrice.toFixed(2)}
- Inventory Quantity: ${data.quantity}
- Views: ${data.views || 'N/A'}
- Favorers: ${data.favorers || 'N/A'}
- Orders (30 days): ${data.orders30d || 0}
- Revenue (30 days): $${data.revenue30d || 0}
- Category: ${data.category || 'Not specified'}
- Title: ${data.title || 'Not specified'}

Pricing Strategy Guidelines:
1. **Inventory-Based Pricing:**
   - Low inventory (≤10): Consider increasing price by 5-15% (scarcity premium)
   - Medium inventory (11-50): Maintain competitive pricing
   - High inventory (51+): Consider slight decrease to improve velocity

2. **Demand-Based Pricing:**
   - High views but low orders: Price may be too high, suggest slight decrease
   - Low views: Price may not be the issue, focus on optimization
   - High favorers but low orders: Consider promotional pricing or slight reduction

3. **Performance-Based Pricing:**
   - High sales velocity: Can support price increase (5-10%)
   - Low/no sales: Consider price reduction (5-15%) to increase velocity
   - Good conversion rate: Price is appropriate, maintain or slight increase

4. **Market Considerations:**
   - Etsy buyers value uniqueness and quality
   - Competitive pricing while maintaining profitability
   - Consider psychological pricing ($19.99 vs $20.00)

Generate ONLY a JSON object with this structure:
{
  "suggestedPrice": 24.99,
  "changePercent": 5.2,
  "reasoning": "Brief explanation of the recommendation",
  "confidence": 85,
  "strategy": "inventory_based" | "demand_based" | "performance_based" | "market_based",
  "riskLevel": "low" | "medium" | "high",
  "expectedImpact": {
    "salesVelocity": "increase" | "decrease" | "maintain",
    "revenue": "increase" | "decrease" | "maintain",
    "margin": "increase" | "decrease" | "maintain"
  }
}

Provide a data-driven recommendation that balances sales velocity with profitability.`;
}

function calculateFallbackPrice(data: OptimizePriceRequest): any {
  const { currentPrice, quantity, views, favorers, orders30d, revenue30d } = data;
  
  // Simple rule-based pricing as fallback
  let suggestedPrice = currentPrice;
  let changePercent = 0;
  let strategy = 'market_based';
  let reasoning = '';
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  // Inventory-based adjustments
  if (quantity <= 10 && quantity > 0) {
    suggestedPrice = currentPrice * 1.10; // 10% increase for low inventory
    changePercent = 10;
    strategy = 'inventory_based';
    reasoning = `Low inventory (${quantity} items) - applying scarcity premium to maximize revenue per unit`;
    riskLevel = 'low';
  } else if (quantity > 50) {
    suggestedPrice = currentPrice * 0.95; // 5% decrease for high inventory
    changePercent = -5;
    strategy = 'inventory_based';
    reasoning = `High inventory (${quantity} items) - slight price reduction to improve sales velocity`;
    riskLevel = 'low';
  }
  
  // Demand-based adjustments
  const conversionRate = orders30d && views ? (orders30d / views) * 100 : 0;
  if (views && views > 100 && conversionRate < 1) {
    // High views but low conversion - price might be too high
    if (changePercent === 0) {
      suggestedPrice = currentPrice * 0.92; // 8% decrease
      changePercent = -8;
      strategy = 'demand_based';
      reasoning = `High views (${views}) but low conversion rate - price reduction may improve sales`;
      riskLevel = 'medium';
    }
  } else if (views && views < 20 && orders30d === 0) {
    // Low visibility - maintain or slight decrease
    if (changePercent === 0) {
      suggestedPrice = currentPrice * 0.97; // 3% decrease
      changePercent = -3;
      strategy = 'demand_based';
      reasoning = `Low visibility - slight price reduction to attract more views`;
      riskLevel = 'low';
    }
  }
  
  // Performance-based adjustments
  if (orders30d && orders30d >= 5) {
    // Good sales velocity - can support price increase
    if (changePercent <= 0) {
      suggestedPrice = currentPrice * 1.05; // 5% increase
      changePercent = 5;
      strategy = 'performance_based';
      reasoning = `Strong sales performance (${orders30d} orders in 30 days) - price increase supported`;
      riskLevel = 'low';
    }
  }
  
  // Round to 2 decimal places
  suggestedPrice = Math.round(suggestedPrice * 100) / 100;
  
  return {
    suggestedPrice,
    changePercent: Math.round(changePercent * 10) / 10,
    reasoning: reasoning || 'Market-based pricing recommendation',
    confidence: 70,
    strategy,
    riskLevel,
    expectedImpact: {
      salesVelocity: changePercent < 0 ? 'increase' : changePercent > 0 ? 'decrease' : 'maintain',
      revenue: changePercent > 5 ? 'increase' : changePercent < -5 ? 'decrease' : 'maintain',
      margin: changePercent > 0 ? 'increase' : changePercent < 0 ? 'decrease' : 'maintain',
    },
  };
}

async function optimizePriceWithGemini(data: OptimizePriceRequest, retryCount = 0): Promise<{ ok: boolean; data?: any; error?: string; fallback?: boolean }> {
  const primaryKey = process.env.GEMINI_API_KEY;
  const secondaryKey = process.env.STAGE_GEMINI_API_KEY;
  const tertiaryKey = process.env.TEST_LEADZ07_FIRST_API_KEY;
  const apiKey = primaryKey || secondaryKey || tertiaryKey;

  if (!apiKey) {
    // Use fallback pricing if no API key
    return { ok: true, data: calculateFallbackPrice(data), fallback: true };
  }

  const maxRetries = 3;
  const baseDelay = 3000; // 3 seconds base delay

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-1.5-flash';
    const config = {
      responseMimeType: 'application/json',
      maxOutputTokens: 512,
      temperature: 0.3, // Lower temperature for more consistent pricing recommendations
    } as any;

    const prompt = buildPriceOptimizationPrompt(data);
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];

    const response = await (ai as any).models.generateContent({ model, config, contents });

    // Extract text from response
    let text = '';
    if (typeof response?.response?.text === 'function') {
      text = response.response.text();
    } else if (response?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = response.response.candidates[0].content.parts[0].text;
    } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = response.candidates[0].content.parts[0].text;
    }

    if (!text.trim()) {
      return { ok: false, error: 'Empty response from Gemini' };
    }

    const parsed = JSON.parse(text);
    return { ok: true, data: parsed };
  } catch (error: any) {
    const errorMessage = error?.message || '';
    const statusCode = error?.status || error?.code;
    
    // Check if it's a rate limit error (429)
    if (statusCode === 429 || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      // Check if it's a quota exhaustion (free tier limit) vs temporary rate limit
      const isQuotaExhausted = errorMessage.includes('quota') && 
                                (errorMessage.includes('limit: 0') || errorMessage.includes('free_tier'));
      
      if (isQuotaExhausted) {
        // Quota exhausted - use fallback pricing
        console.warn('[Price Optimization] Gemini quota exhausted, using fallback pricing');
        return { ok: true, data: calculateFallbackPrice(data), fallback: true };
      }
      
      // Temporary rate limit - retry with exponential backoff
      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff: 3s, 6s, 12s
        console.log(`[Price Optimization] Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return optimizePriceWithGemini(data, retryCount + 1);
      } else {
        // Max retries reached - use fallback
        console.warn('[Price Optimization] Max retries reached, using fallback pricing');
        return { ok: true, data: calculateFallbackPrice(data), fallback: true };
      }
    }
    
    // Other errors - use fallback pricing
    console.error('[Price Optimization] Gemini error:', error);
    console.warn('[Price Optimization] Using fallback pricing due to error');
    return { ok: true, data: calculateFallbackPrice(data), fallback: true };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: OptimizePriceRequest = await request.json();
    const { shopId, listingId, currentPrice } = body;

    if (!shopId || !listingId || currentPrice === undefined) {
      return NextResponse.json(
        { error: 'shopId, listingId, and currentPrice are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const shop = await EtsyShop.findOne({ shopId, isActive: true });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found or inactive' }, { status: 404 });
    }

    const etsyAPI = new EtsyAPI(
      shop.accessToken,
      shop.shopId,
      shop.refreshToken,
      async (newTokens) => {
        await EtsyShop.updateOne(
          { shopId: shop.shopId },
          {
            $set: {
              accessToken: newTokens.access_token,
              refreshToken: newTokens.refresh_token,
              tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
            }
          }
        );
      }
    );

    // Fetch listing details from DB first
    if (!body.quantity) {
      const dbListing = await EtsyListing.findOne({ etsyListingId: listingId }).lean();
      const needsListingRefresh = !dbListing || needsEtsyDataRefresh(dbListing.lastSyncedAt, 'listing');
      
      if (!needsListingRefresh && dbListing) {
        // Use DB data
        body.quantity = dbListing.inventory?.quantity || 0;
        body.views = dbListing.views || 0;
        body.favorers = dbListing.numFavorers || 0;
        body.category = dbListing.categoryPath?.[dbListing.categoryPath.length - 1];
        body.title = dbListing.title || '';
      } else {
        // Fetch from API and update DB
        const listing = await etsyAPI.getListing(listingId);
        body.quantity = listing.quantity || 0;
        body.views = listing.views || 0;
        body.favorers = listing.num_favorers || 0;
        body.category = listing.category_path?.[listing.category_path.length - 1];
        body.title = listing.title;
        
        // Update DB
        await EtsyListing.findOneAndUpdate(
          { etsyListingId: listingId },
          {
            $set: {
              userId: shop.userId,
              shopId: shop.shopId,
              etsyListingId: listingId,
              title: listing.title,
              description: listing.description,
              price: listing.price.amount / listing.price.divisor,
              currency: listing.price.currency_code,
              state: listing.state,
              tags: listing.tags || [],
              materials: listing.materials || [],
              categoryPath: listing.category_path || [],
              inventory: { quantity: listing.quantity || 0 },
              views: listing.views || 0,
              numFavorers: listing.num_favorers || 0,
              lastSyncedAt: new Date(),
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    // Fetch recent orders from DB first
    try {
      const dbOrders = await EtsyOrder.find({ 
        shopId, 
        userId: shop.userId,
        'items.listingId': listingId 
      }).lean();
      
      const needsOrdersRefresh = dbOrders.length === 0 || dbOrders.some(order => 
        needsEtsyDataRefresh(order.lastSyncedAt, 'order')
      );
      
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      
      let listingOrders: any[] = [];
      if (!needsOrdersRefresh && dbOrders.length > 0) {
        // Use DB orders
        listingOrders = dbOrders.filter(order => {
          const orderDate = order.createdAt?.getTime() || Date.now();
          return orderDate >= thirtyDaysAgo;
        });
      } else {
        // Fetch from API and update DB
        const orders = await etsyAPI.getOrders(shopId, 100, 0);
        listingOrders = orders.filter((order: any) => {
          const orderDate = (order.creation_timestamp || order.created_timestamp || 0) * 1000;
          if (orderDate < thirtyDaysAgo) return false;
          
          return order.transactions?.some((t: any) => t.listing_id?.toString() === listingId);
        });
        
        // Update DB with fresh orders (simplified - full sync happens in sync route)
        for (const order of orders) {
          const receiptId = order.receipt_id?.toString() || '';
          const etsyOrderId = receiptId;
          
          const orderData = {
            userId: shop.userId,
            etsyOrderId,
            shopId,
            receiptId,
            buyerUserId: order.buyer_user_id?.toString() || '',
            buyerEmail: order.buyer_email || '',
            status: order.was_paid ? 'completed' : 'open' as const,
            paymentStatus: order.was_paid ? 'paid' : 'pending' as const,
            shippingStatus: 'pending' as const,
            total: (order.grandtotal?.amount || order.total_price?.amount || 0) / (order.grandtotal?.divisor || order.total_price?.divisor || 100),
            currency: order.grandtotal?.currency_code || order.total_price?.currency_code || 'USD',
            shippingCost: (order.total_shipping_cost?.amount || 0) / (order.total_shipping_cost?.divisor || 100),
            taxCost: (order.total_tax_cost?.amount || 0) / (order.total_tax_cost?.divisor || 100),
            items: (order.transactions || []).map((t: any) => ({
              listingId: t.listing_id?.toString() || '',
              title: t.title || '',
              quantity: t.quantity || 1,
              price: (t.price?.amount || 0) / (t.price?.divisor || 100),
              variations: [],
            })),
            shippingAddress: {
              name: order.name || '',
              address1: order.first_line || '',
              address2: order.second_line || '',
              city: order.city || '',
              state: order.state || '',
              zip: order.zip || '',
              country: order.country_iso || '',
              phone: order.buyer_phone || '',
            },
            messageFromBuyer: order.message_from_buyer || '',
            lastSyncedAt: new Date(),
          };

          await EtsyOrder.findOneAndUpdate(
            { etsyOrderId },
            { $set: orderData },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      }

      body.orders30d = listingOrders.length;
      body.revenue30d = listingOrders.reduce((sum: number, order: any) => {
        if (order.items) {
          // DB format
          const item = order.items.find((i: any) => i.listingId === listingId);
          if (item) return sum + (item.price * item.quantity);
        } else {
          // API format
          const transaction = order.transactions?.find((t: any) => t.listing_id?.toString() === listingId);
          if (transaction) {
            return sum + ((transaction.price?.amount || 0) / (transaction.price?.divisor || 100));
          }
        }
        return sum;
      }, 0);
    } catch (error) {
      // If we can't fetch orders, continue with what we have
      console.warn('Could not fetch orders for price optimization:', error);
    }

    const result = await optimizePriceWithGemini(body);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || 'Price optimization failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      currentPrice,
      optimization: result.data,
      fallback: result.fallback || false,
      ...(result.fallback && {
        message: 'Using rule-based pricing (AI quota exceeded). Consider upgrading your Gemini API plan for AI-powered recommendations.',
      }),
    });
  } catch (error: any) {
    console.error('[Price Optimization API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to optimize price' },
      { status: 500 }
    );
  }
}

