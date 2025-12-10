import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';

// GET /api/admin/jacket-maker-products - Get all products from The Jacket Maker from main database
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    
    // Ensure database connection
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const status = searchParams.get('status') || '';
    const isActive = searchParams.get('isActive') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query - only products from The Jacket Maker
    const query: any = {
      sourceUrl: { $regex: /thejacketmaker/i }
    };
    const andConditions: any[] = [];
    
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }
    
    if (category) {
      query.category = category;
    }
    
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    if (status) {
      if (['draft', 'published', 'archived'].includes(status)) {
        query.status = status;
      }
    }

    if (isActive) {
      if (isActive === 'active') {
        query.isActive = true;
      } else if (isActive === 'inactive') {
        query.isActive = false;
      }
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Build sort
    const sort: any = {};
    if (sortBy === 'name') {
      sort.name = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'price') {
      sort.price = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'createdAt') {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'updatedAt') {
      sort.updatedAt = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(query)
    ]);

    // Get distinct brands and categories for filters
    const [brands, categories] = await Promise.all([
      Product.distinct('brand', query),
      Product.distinct('category', query)
    ]);

    return NextResponse.json({
      products: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        brands: brands.filter((b): b is string => Boolean(b) && typeof b === 'string').sort(),
        categories: categories.filter((c): c is string => Boolean(c) && typeof c === 'string').sort()
      }
    });

  } catch (error: any) {
    console.error('Jacket Maker Products API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jacket maker products' },
      { status: error.message?.includes('permission') ? 403 : 500 }
    );
  }
}

