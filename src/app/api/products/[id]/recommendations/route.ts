import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'similar';
    const limit = parseInt(searchParams.get('limit') || '8');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    let recommendedProducts: any[] = [];

    switch (type) {
      case 'similar':
        // Find products in same category with similar tags
        const categoryQuery: any = { 
          _id: { $ne: new mongoose.Types.ObjectId(id) },
          isActive: true,
          status: 'published'
        };
        
        if (product.category) {
          categoryQuery.category = product.category;
        }
        
        // If product has tags, prioritize products with matching tags
        if (product.tags && product.tags.length > 0) {
          categoryQuery.tags = { $in: product.tags };
        }
        
        recommendedProducts = await Product.find(categoryQuery)
          .sort({ rating: -1, reviewCount: -1 })
          .limit(limit * 2) // Get more to filter out current product
          .lean();
        
        // Filter out current product
        recommendedProducts = recommendedProducts.filter(p => p._id.toString() !== id);
        
        // If not enough results, expand search to same category without tag requirement
        if (recommendedProducts.length < limit && product.category) {
          const existingIds = recommendedProducts.map(p => p._id);
          const additional = await Product.find({
            _id: { 
              $ne: new mongoose.Types.ObjectId(id),
              $nin: existingIds
            },
            category: product.category,
            isActive: true,
            status: 'published'
          })
            .sort({ rating: -1, reviewCount: -1 })
            .limit(limit - recommendedProducts.length)
            .lean();
          
          recommendedProducts = [...recommendedProducts, ...additional];
        }
        break;

      case 'frequently_bought':
        // Find products that are frequently bought together with this product
        const ordersWithProduct = await Order.find({
          'items.productId': id.toString(),
          status: { $in: ['processing', 'shipped', 'delivered'] }
        }).lean();

        // Get all product IDs that appear in orders with this product
        const productIds = new Map<string, number>();
        ordersWithProduct.forEach(order => {
          order.items.forEach((item: any) => {
            const itemId = item.productId?.toString();
            if (itemId && itemId !== id) {
              productIds.set(itemId, (productIds.get(itemId) || 0) + item.quantity);
            }
          });
        });

        // Sort by frequency and get top products
        const sortedIds = Array.from(productIds.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([id]) => id);

        if (sortedIds.length > 0) {
          recommendedProducts = await Product.find({
            _id: { $in: sortedIds.map(id => new mongoose.Types.ObjectId(id)) },
            isActive: true,
            status: 'published'
          }).lean();

          // Sort by frequency
          recommendedProducts.sort((a, b) => {
            const aIndex = sortedIds.indexOf(a._id.toString());
            const bIndex = sortedIds.indexOf(b._id.toString());
            return aIndex - bIndex;
          });
        }
        break;

      case 'you_may_like':
        // Combination: similar category + high rating + recent
        const youMayLikeQuery: any = {
          _id: { $ne: new mongoose.Types.ObjectId(id) },
          isActive: true,
          status: 'published',
          rating: { $gte: 4.0 } // High rated products
        };
        
        // If product has a category, prioritize same category
        if (product.category) {
          youMayLikeQuery.category = product.category;
        }
        
        recommendedProducts = await Product.find(youMayLikeQuery)
          .sort({ 
            rating: -1,
            reviewCount: -1,
            createdAt: -1
          })
          .limit(limit)
          .lean();
        break;

      default:
        recommendedProducts = await Product.find({
          _id: { $ne: new mongoose.Types.ObjectId(id) },
          isActive: true,
          status: 'published'
        })
          .sort({ rating: -1 })
          .limit(limit)
          .lean();
    }

    // Remove current product and limit results
    recommendedProducts = recommendedProducts
      .filter(p => p._id.toString() !== id)
      .slice(0, limit);

    // If still not enough, fill with random high-rated products
    if (recommendedProducts.length < limit) {
      const additional = await Product.find({
        _id: { 
          $ne: new mongoose.Types.ObjectId(id),
          $nin: recommendedProducts.map(p => p._id)
        },
        isActive: true,
        status: 'published',
        rating: { $gte: 3.5 }
      })
        .sort({ rating: -1, reviewCount: -1 })
        .limit(limit - recommendedProducts.length)
        .lean();
      
      recommendedProducts = [...recommendedProducts, ...additional];
    }

    return NextResponse.json({
      products: recommendedProducts,
      count: recommendedProducts.length,
      type
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

