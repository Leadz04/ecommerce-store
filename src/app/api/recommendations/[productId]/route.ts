import { NextRequest, NextResponse } from 'next/server';
import ProductRecommendation from '@/models/ProductRecommendation';
import Product from '@/models/Product';
import connectDB from '@/lib/mongodb';

// GET - Get product recommendations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    await connectDB();
    
    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'related';
    const limit = parseInt(searchParams.get('limit') || '5');
    
    let recommendation = await ProductRecommendation.findOne({
      productId,
      type
    }).populate('recommendedProducts.productId');
    
    // If no recommendations exist, generate them
    if (!recommendation) {
      const product = await Product.findById(productId);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      
      // Generate recommendations based on type
      let recommendedProducts: any[] = [];
      
      if (type === 'related' || type === 'similar') {
        // Find similar products by category and tags
        const similarProducts = await Product.find({
          _id: { $ne: productId },
          $or: [
            { category: product.category },
            { tags: { $in: product.tags || [] } }
          ],
          published: true
        })
        .limit(limit)
        .select('_id name price images');
        
        recommendedProducts = similarProducts.map((p, index) => ({
          productId: p._id,
          score: 100 - (index * 10),
          reason: 'Similar category or tags'
        }));
      }
      
      // Create recommendation record
      recommendation = await ProductRecommendation.create({
        productId,
        type,
        recommendedProducts,
        generatedBy: 'algorithm'
      });
      
      // Populate after creation
      recommendation = await ProductRecommendation.findById(recommendation._id)
        .populate('recommendedProducts.productId');
    }
    
    // Update view count
    recommendation.viewCount += 1;
    recommendation.updateCTR();
    await recommendation.save();
    
    return NextResponse.json({
      recommendations: recommendation.recommendedProducts.slice(0, limit)
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}

// POST - Track recommendation click
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    await connectDB();
    
    const { productId } = await params;
    const { type, clickedProductId, converted } = await request.json();
    
    const recommendation = await ProductRecommendation.findOne({
      productId,
      type: type || 'related'
    });
    
    if (recommendation) {
      recommendation.clickCount += 1;
      if (converted) {
        recommendation.conversionCount += 1;
      }
      recommendation.updateCTR();
      await recommendation.save();
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking recommendation click:', error);
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}

