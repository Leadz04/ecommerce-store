import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product, Order, User } from '@/models';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token (optional for guests)
async function verifyTokenOptional(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const userId = await verifyTokenOptional(request);
    
    const personalizedData: {
      recommendedForYou: any[];
      basedOnWishlist: any[];
      trendingInYourCategories: any[];
      continueShopping: any[];
      featuredProducts: any[];
    } = {
      recommendedForYou: [],
      basedOnWishlist: [],
      trendingInYourCategories: [],
      continueShopping: [],
      featuredProducts: []
    };

    // For authenticated users, get personalized recommendations
    if (userId) {
      // 1. Recommended For You - Based on purchase history
      const userOrders = await Order.find({
        userId: userId,
        status: { $in: ['processing', 'shipped', 'delivered'] }
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Get categories and products from order history
      const purchasedProductIds = new Set<string>();
      const purchasedCategories = new Map<string, number>();
      
      // Collect all product IDs from orders
      const allProductIds: string[] = [];
      userOrders.forEach(order => {
        order.items.forEach((item: any) => {
          const productId = item.productId?.toString();
          if (productId) {
            purchasedProductIds.add(productId);
            allProductIds.push(productId);
          }
        });
      });

      // Fetch actual products to get their categories
      if (allProductIds.length > 0) {
        const uniqueProductIds = Array.from(new Set(allProductIds));
        const purchasedProducts = await Product.find({
          _id: { $in: uniqueProductIds.map(id => new mongoose.Types.ObjectId(id)) }
        }).select('category').lean();

        purchasedProducts.forEach((product: any) => {
          if (product.category) {
            purchasedCategories.set(product.category, (purchasedCategories.get(product.category) || 0) + 1);
          }
        });
      }

      // Get products similar to purchased ones (same categories, high ratings)
      if (purchasedCategories.size > 0) {
        const topCategories = Array.from(purchasedCategories.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([category]) => category);

        personalizedData.recommendedForYou = await Product.find({
          _id: { $nin: Array.from(purchasedProductIds).map(id => new mongoose.Types.ObjectId(id)) },
          category: { $in: topCategories },
          isActive: true,
          status: 'published',
          rating: { $gte: 3.5 }
        })
          .sort({ rating: -1, reviewCount: -1, createdAt: -1 })
          .limit(8)
          .lean();
      }

      // 2. Based on Wishlist - Products similar to wishlist items
      const user = await User.findById(userId).lean();
      if (user?.wishlist && user.wishlist.length > 0) {
        const wishlistProductIds = user.wishlist.map((id: any) => id.toString());
        const wishlistProducts = await Product.find({
          _id: { $in: wishlistProductIds.map(id => new mongoose.Types.ObjectId(id)) }
        }).lean();

        const wishlistCategories = new Set(
          wishlistProducts.map((p: any) => p.category).filter(Boolean)
        );

        if (wishlistCategories.size > 0) {
          const excludedIds = [
            ...wishlistProductIds.map(id => new mongoose.Types.ObjectId(id)),
            ...Array.from(purchasedProductIds).map(id => new mongoose.Types.ObjectId(id))
          ];
          
          personalizedData.basedOnWishlist = await Product.find({
            _id: { $nin: excludedIds },
            category: { $in: Array.from(wishlistCategories) },
            isActive: true,
            status: 'published',
            rating: { $gte: 4.0 }
          })
            .sort({ rating: -1, reviewCount: -1 })
            .limit(8)
            .lean();
        }
      }

      // 3. Trending in Your Categories - Popular products in user's favorite categories
      if (purchasedCategories.size > 0) {
        const favoriteCategories = Array.from(purchasedCategories.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([category]) => category);

        personalizedData.trendingInYourCategories = await Product.find({
          category: { $in: favoriteCategories },
          isActive: true,
          status: 'published',
          rating: { $gte: 4.0 },
          reviewCount: { $gte: 5 }
        })
          .sort({ reviewCount: -1, rating: -1, createdAt: -1 })
          .limit(8)
          .lean();
      }

      // 4. Continue Shopping - Recently viewed (this will be handled client-side from localStorage)
      // We'll return empty array here, client will use recentlyViewedStore
    }

    // 5. Featured Products - Fallback for all users (guests and authenticated)
    // High-rated, popular products
    personalizedData.featuredProducts = await Product.find({
      isActive: true,
      status: 'published',
      rating: { $gte: 4.0 },
      reviewCount: { $gte: 3 }
    })
      .sort({ rating: -1, reviewCount: -1, createdAt: -1 })
      .limit(8)
      .lean();

    // If user is authenticated but no personalized data, fill with featured
    if (userId) {
      if (personalizedData.recommendedForYou.length === 0) {
        personalizedData.recommendedForYou = personalizedData.featuredProducts.slice(0, 8);
      }
      if (personalizedData.basedOnWishlist.length === 0 && personalizedData.featuredProducts.length > 0) {
        personalizedData.basedOnWishlist = personalizedData.featuredProducts.slice(0, 8);
      }
      if (personalizedData.trendingInYourCategories.length === 0 && personalizedData.featuredProducts.length > 0) {
        personalizedData.trendingInYourCategories = personalizedData.featuredProducts.slice(0, 8);
      }
    }

    return NextResponse.json({
      personalized: personalizedData,
      isAuthenticated: !!userId,
      hasPersonalizedData: userId && (
        personalizedData.recommendedForYou.length > 0 ||
        personalizedData.basedOnWishlist.length > 0 ||
        personalizedData.trendingInYourCategories.length > 0
      )
    });

  } catch (error) {
    console.error('Personalized homepage API error:', error);
    // Return featured products as fallback
    try {
      await connectDB();
      const featuredProducts = await Product.find({
        isActive: true,
        status: 'published',
        rating: { $gte: 4.0 }
      })
        .sort({ rating: -1, reviewCount: -1 })
        .limit(8)
        .lean();

      return NextResponse.json({
        personalized: {
          recommendedForYou: featuredProducts,
          basedOnWishlist: [],
          trendingInYourCategories: [],
          continueShopping: [],
          featuredProducts: featuredProducts
        },
        isAuthenticated: false,
        hasPersonalizedData: false
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to fetch personalized content' },
        { status: 500 }
      );
    }
  }
}

