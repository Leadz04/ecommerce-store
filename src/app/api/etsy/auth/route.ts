import { NextRequest, NextResponse } from 'next/server';
import { getEtsyAuthUrl, exchangeCodeForToken } from '@/lib/etsy';
import { EtsyShop } from '@/models';
import connectDB from '@/lib/mongodb';
import { getCurrentUserId, getCurrentUserIdOptional } from '@/lib/etsy-auth-helper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // If Etsy returned an error, surface it instead of looping redirects
    if (error) {
      return NextResponse.json(
        {
          success: false,
          error,
          errorDescription,
        },
        { status: 400 }
      );
    }

    if (!code) {
      // OAuth initiation should use /api/etsy/auth/init endpoint instead
      // This route only handles the callback
      return NextResponse.json(
        { error: 'Use /api/etsy/auth/init to start OAuth flow' },
        { status: 400 }
      );
    }

    // Exchange code for token (uses PKCE code_verifier encoded in state)
    // userId may be encoded in state, or we try to get it from headers as fallback
    const tokenResponse = await exchangeCodeForToken(code, state);
    let userId = tokenResponse.userId;
    
    // Fallback: try to get userId from Authorization header if not in state
    if (!userId) {
      try {
        userId = await getCurrentUserId(request);
      } catch {
        return NextResponse.json(
          { error: 'User authentication required. Please log in and try again.' },
          { status: 401 }
        );
      }
    }
    
    await connectDB();

    // Get shop information
    const { EtsyAPI } = await import('@/lib/etsy');
    const etsyAPI = new EtsyAPI(tokenResponse.access_token);
    const shops = await etsyAPI.getShopsForUser();
    
    if (shops.length === 0) {
      return NextResponse.json({ error: 'No shops found for this user' }, { status: 400 });
    }

    // Save all shops for this user (multi-shop support)
    const savedShops: any[] = [];
    for (const shop of shops) {
      const shopIdStr = shop.shop_id.toString();
      
      // Check if shop already exists for this user using findOneAndUpdate with upsert
      // This handles the case where the old unique index might still exist
      try {
        const existingShop = await EtsyShop.findOneAndUpdate(
          { userId, shopId: shopIdStr },
          {
            $set: {
              shopName: shop.shop_name,
              accessToken: tokenResponse.access_token,
              refreshToken: tokenResponse.refresh_token,
              tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
              isActive: true,
              syncSettings: {
                autoSyncProducts: true,
                autoSyncOrders: true,
                autoSyncInventory: true,
                syncInterval: 60,
              },
            },
            $setOnInsert: {
              userId,
              shopId: shopIdStr,
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );
        savedShops.push(existingShop);
      } catch (error: any) {
        // Handle duplicate key error - try to find and update instead
        if (error.code === 11000 || error.codeName === 'DuplicateKey') {
          console.warn(`Duplicate key error for shop ${shopIdStr}, attempting update...`);
          const existingShop = await EtsyShop.findOne({ userId, shopId: shopIdStr });
          if (existingShop) {
            existingShop.shopName = shop.shop_name;
            existingShop.accessToken = tokenResponse.access_token;
            existingShop.refreshToken = tokenResponse.refresh_token;
            existingShop.tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
            existingShop.isActive = true;
            await existingShop.save();
            savedShops.push(existingShop);
          } else {
            // This shouldn't happen, but log it
            console.error(`Shop ${shopIdStr} exists but not found for user ${userId}`);
            throw new Error(`Failed to save shop ${shopIdStr}: duplicate key error`);
          }
        } else {
          throw error;
        }
      }
    }

    const etsyShop = savedShops[0]; // Return first shop for backwards compatibility

    return NextResponse.json({
      success: true,
      message: 'Etsy shop connected successfully',
      shop: {
        shopId: etsyShop.shopId,
        shopName: etsyShop.shopName,
        isActive: etsyShop.isActive,
      },
    });

  } catch (error) {
    console.error('Etsy auth error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Etsy' },
      { status: 500 }
    );
  }
}
