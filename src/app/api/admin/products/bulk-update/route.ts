import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { AuditLog } from '@/models';
import Product from '@/models/Product';

// POST /api/admin/products/bulk-update - Bulk update products
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_UPDATE)(request);
    await connectDB();

    const body = await request.json();
    const { productIds, updates } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'productIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'updates must be an object' },
        { status: 400 }
      );
    }

    // Validate price if provided
    if (updates.price !== undefined && updates.price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    // Validate stock count if provided
    if (updates.stockCount !== undefined && updates.stockCount < 0) {
      return NextResponse.json(
        { error: 'Stock count cannot be negative' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.subCategory !== undefined) updateData.subCategory = updates.subCategory;
    if (updates.productType !== undefined) updateData.productType = updates.productType;
    if (updates.brand !== undefined) updateData.brand = updates.brand;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.stockCount !== undefined) {
      updateData.stockCount = updates.stockCount;
      updateData.inStock = updates.stockCount > 0;
    }

    // Handle type field - it should be saved in specifications
    if (updates.type !== undefined) {
      // For bulk update, we need to update each product's specifications
      // We'll use updateMany with $set for specifications.type
      updateData['specifications.type'] = updates.type;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Perform bulk update
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: updateData }
    );

    // Audit log for bulk update
    try {
      const ip = request.headers.get('x-forwarded-for') || '';
      const userAgent = request.headers.get('user-agent') || '';
      await AuditLog.create({
        userId: user.userId,
        action: 'product:bulk-update',
        resourceType: 'Product',
        resourceId: productIds.join(','),
        metadata: { 
          productCount: productIds.length,
          updates: updateData 
        },
        ip,
        userAgent,
      });
    } catch {}

    return NextResponse.json({
      message: 'Products updated successfully',
      updatedCount: result.modifiedCount,
      totalCount: result.matchedCount
    });

  } catch (error) {
    console.error('Bulk update products error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

