import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import mongoose from 'mongoose';

// POST /api/admin/products/by-ids - Get products by array of IDs
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    await connectDB();

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Limit to 1000 products at a time
    const productIds = ids.slice(0, 1000).filter((id: string) => {
      return mongoose.Types.ObjectId.isValid(id);
    });

    if (productIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Fetch products by IDs
    const foundProducts = await Product.find({
      _id: { $in: productIds }
    }).lean();

    return NextResponse.json({
      products: foundProducts,
      count: foundProducts.length,
      requested: productIds.length
    });

  } catch (error: any) {
    console.error('Products by IDs API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
