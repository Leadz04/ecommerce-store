import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ProductBundle from '@/models/ProductBundle';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const query: any = { isActive: true, inStock: true };
    
    // Check date range if applicable
    const now = new Date();
    query.$or = [
      { startDate: { $exists: false } },
      { startDate: null },
      { startDate: { $lte: now } }
    ];
    query.$and = [
      ...(query.$and || []),
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } }
        ]
      }
    ];

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        ...(query.$or || []),
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const bundles = await ProductBundle.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ProductBundle.countDocuments(query);

    // Populate product details for each bundle
    const bundlesWithProducts = await Promise.all(
      bundles.map(async (bundle) => {
        const productIds = bundle.products.map((p: any) => p.productId);
        const products = await Product.find({ _id: { $in: productIds } })
          .select('name price image inStock')
          .lean();
        
        const productsMap = new Map(products.map((p: any) => [p._id.toString(), p]));
        
        return {
          ...bundle,
          products: bundle.products.map((p: any) => ({
            ...p,
            product: productsMap.get(p.productId) || null
          }))
        };
      })
    );

    return NextResponse.json({
      bundles: bundlesWithProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching bundles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

