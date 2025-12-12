import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import ProductCategories from '@/models/ProductCategories';

// GET /api/admin/products/categories-list - Get the latest saved categories list
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    await connectDB();

    // Get the latest extraction
    const latest = await ProductCategories.findOne()
      .sort({ extractedAt: -1 })
      .lean();

    if (!latest) {
      return NextResponse.json({
        success: true,
        message: 'No categories list found. Please extract categories first.',
        lists: {
          categories: [],
          subCategories: [],
          productTypes: [],
          types: [],
        },
        counts: {
          categories: 0,
          subCategories: 0,
          productTypes: 0,
          types: 0,
        }
      });
    }

    return NextResponse.json({
      success: true,
      extractedAt: latest.extractedAt,
      totalProducts: latest.totalProducts,
      lists: {
        categories: latest.categories || [],
        subCategories: latest.subCategories || [],
        productTypes: latest.productTypes || [],
        types: latest.types || [],
      },
      counts: {
        categories: latest.categories?.length || 0,
        subCategories: latest.subCategories?.length || 0,
        productTypes: latest.productTypes?.length || 0,
        types: latest.types?.length || 0,
      }
    });

  } catch (error: any) {
    console.error('Get categories list error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

