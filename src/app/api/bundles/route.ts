import { NextRequest, NextResponse } from 'next/server';
import ProductBundle from '@/models/ProductBundle';
import Product from '@/models/Product';
import connectDB from '@/lib/mongodb';

// GET - List product bundles
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const query: any = { isActive: true };
    if (featured === 'true') query.featured = true;
    if (category) query.category = category;
    
    const bundles = await ProductBundle.find(query)
      .populate('products.productId')
      .sort({ featured: -1, salesCount: -1 })
      .limit(limit);
    
    return NextResponse.json({ bundles });
  } catch (error) {
    console.error('Error fetching bundles:', error);
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 });
  }
}

// POST - Create a product bundle
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate products exist and calculate original price
    let originalPrice = 0;
    for (const item of body.products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        );
      }
      originalPrice += product.price * item.quantity;
    }
    
    const bundle = await ProductBundle.create({
      ...body,
      originalPrice,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    });
    
    return NextResponse.json({ bundle }, { status: 201 });
  } catch (error) {
    console.error('Error creating bundle:', error);
    return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 });
  }
}

// PUT - Update a bundle
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Bundle ID required' }, { status: 400 });
    }
    
    const bundle = await ProductBundle.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }
    
    return NextResponse.json({ bundle });
  } catch (error) {
    console.error('Error updating bundle:', error);
    return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 });
  }
}

