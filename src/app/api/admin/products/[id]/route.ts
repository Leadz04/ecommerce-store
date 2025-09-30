import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { AuditLog } from '@/models';

// GET /api/admin/products/[id] - Get specific product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    await connectDB();

    const { id } = await context.params;
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });

  } catch (error) {
    console.error('Get product error:', error);
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

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_UPDATE)(request);
    await connectDB();

    const { id } = await context.params;
    const body = await request.json();
    const {
      name,
      description,
      price,
      originalPrice,
      image,
      images,
      category,
      brand,
      stockCount,
      tags,
      specifications,
      isActive,
      productType,
      sourceUrl,
      variants,
      status,
      publishAt
    } = body;

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Validate price if provided
    if (price !== undefined && price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    // Validate stock count if provided
    if (stockCount !== undefined && stockCount < 0) {
      return NextResponse.json(
        { error: 'Stock count cannot be negative' },
        { status: 400 }
      );
    }

    const before = product.toObject();

    // Update product fields
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (originalPrice !== undefined) product.originalPrice = originalPrice;
    if (image !== undefined) product.image = image;
    if (images !== undefined) product.images = images;
    if (category !== undefined) product.category = category;
    if (brand !== undefined) product.brand = brand;
    if (stockCount !== undefined) {
      product.stockCount = stockCount;
      product.inStock = stockCount > 0;
    }
    if (tags !== undefined) product.tags = tags;
    if (specifications !== undefined) product.specifications = specifications;
    if (typeof isActive === 'boolean') product.isActive = isActive;
    if (productType !== undefined) (product as any).productType = productType;
    if (sourceUrl !== undefined) (product as any).sourceUrl = sourceUrl;
    if (variants !== undefined) (product as any).variants = variants;
    if (status !== undefined) (product as any).status = status;
    if (publishAt !== undefined) (product as any).publishAt = publishAt ? new Date(publishAt) : null;

    await product.save();

    // Audit log
    try {
      const ip = request.headers.get('x-forwarded-for') || (request as any).ip || '';
      const userAgent = request.headers.get('user-agent') || '';
      await AuditLog.create({
        userId: user.userId,
        action: 'product:update',
        resourceType: 'Product',
        resourceId: String(product._id),
        metadata: { before, after: product.toObject() },
        ip,
        userAgent,
      });
    } catch {}

    return NextResponse.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    const err: any = error;
    if (err?.name === 'ValidationError') {
      return NextResponse.json({ error: err.message, errors: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_DELETE)(request);
    await connectDB();

    const { id } = await context.params;

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    await Product.findByIdAndDelete(id);

    // Audit log
    try {
      const ip = request.headers.get('x-forwarded-for') || (request as any).ip || '';
      const userAgent = request.headers.get('user-agent') || '';
      await AuditLog.create({
        userId: user.userId,
        action: 'product:delete',
        resourceType: 'Product',
        resourceId: String(product._id),
        metadata: { name: product.name },
        ip,
        userAgent,
      });
    } catch {}

    return NextResponse.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
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
