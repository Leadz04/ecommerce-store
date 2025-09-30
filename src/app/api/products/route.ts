import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock');
    const brand = searchParams.get('brand');
    const minRating = searchParams.get('minRating');
    const collection = (searchParams.get('collection') || '').toLowerCase();

    // Build query - include legacy products without status/publishAt
    const now = new Date();
    const query: any = { isActive: true };

    // Status/publish window
    query.$and = [
      { $or: [ { status: 'published' }, { status: { $exists: false } }, { status: null } ] },
      { $or: [ { publishAt: null }, { publishAt: { $lte: now } }, { publishAt: { $exists: false } } ] },
    ];
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (inStock === 'true') {
      query.inStock = true;
    }

    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    if (minRating) {
      const parsed = parseFloat(minRating);
      if (!Number.isNaN(parsed)) {
        query.rating = { $gte: parsed };
      }
    }

    // Collections can influence query and sort
    let sort: any = {};
    if (collection === 'new' || collection === 'new-arrivals') {
      sort.createdAt = -1; // newest first
    } else if (collection === 'best' || collection === 'best-sellers') {
      sort.rating = -1;
      sort.reviewCount = -1;
    } else if (collection === 'seasonal' || collection === 'season') {
      query.$or = [
        ...(query.$or || []),
        { tags: { $in: [/season/i] } },
        { productType: { $regex: 'season', $options: 'i' } }
      ];
      if (!sortBy || sortBy === 'name') {
        sort.createdAt = -1;
      }
    }

    if (Object.keys(sort).length === 0) {
      switch (sortBy) {
        case 'price-low':
          sort.price = 1;
          break;
        case 'price-high':
          sort.price = -1;
          break;
        case 'rating':
          sort.rating = -1;
          break;
        case 'newest':
          sort.createdAt = -1;
          break;
        default:
          sort.name = 1;
      }
    }

    const products = await Product.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments(query);

    const [categories, brands] = await Promise.all([
      Product.distinct('category', { isActive: true }),
      Product.distinct('brand', { isActive: true })
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: { categories, brands }
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const productData = await request.json();
    
    const product = new Product(productData);
    await product.save();

    return NextResponse.json({
      message: 'Product created successfully',
      product
    }, { status: 201 });

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
