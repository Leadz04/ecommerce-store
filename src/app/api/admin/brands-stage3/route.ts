import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';

// GET /api/admin/brands-stage3 - Get all brands from main database with product counts
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    
    // Ensure database connection
    await connectDB();

    // Get all distinct brands from main database
    const brands = await Product.distinct('brand');
    const validBrands = brands.filter((b): b is string => Boolean(b) && typeof b === 'string' && b.trim().length > 0);

    // Get product count for each brand
    const brandCounts: Record<string, number> = {};
    for (const brand of validBrands) {
      const count = await Product.countDocuments({ brand: { $regex: new RegExp(`^${brand}$`, 'i') } });
      brandCounts[brand] = count;
    }

    // Sort brands by name
    const sortedBrands = validBrands.sort();

    return NextResponse.json({
      brands: sortedBrands,
      brandCounts
    });

  } catch (error: any) {
    console.error('Brands API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch brands' },
      { status: error.message?.includes('permission') ? 403 : 500 }
    );
  }
}

