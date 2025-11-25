import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { AuditLog } from '@/models';
import { deleteImagesFromCloudinary, isCloudinaryUrl } from '@/lib/cloudinary';

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
      publishAt,
      etsyExported,
      etsyExportedAt,
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

    // Track images to delete from Cloudinary
    const imagesToDelete: string[] = [];

    // If image or images are being updated, check for removed Cloudinary images
    if (image !== undefined || images !== undefined) {
      const oldMainImage = product.image;
      const oldImages = product.images || [];
      const oldAllImages = [oldMainImage, ...oldImages].filter(Boolean) as string[];

      const newMainImage = image !== undefined ? image : product.image;
      const newImages = images !== undefined ? images : (product.images || []);
      const newAllImages = [newMainImage, ...newImages].filter(Boolean) as string[];

      // Find images that were removed (exist in old but not in new)
      for (const oldImageUrl of oldAllImages) {
        if (isCloudinaryUrl(oldImageUrl) && !newAllImages.includes(oldImageUrl)) {
          imagesToDelete.push(oldImageUrl);
        }
      }
    }

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
    if (etsyExported !== undefined) {
      (product as any).etsyExported = etsyExported;
      (product as any).etsyExportedAt = etsyExported
        ? (etsyExportedAt ? new Date(etsyExportedAt) : new Date())
        : null;
    } else if (etsyExportedAt !== undefined) {
      (product as any).etsyExportedAt = etsyExportedAt ? new Date(etsyExportedAt) : null;
    }

    await product.save();

    // Delete removed images from Cloudinary (non-blocking)
    if (imagesToDelete.length > 0) {
      // Don't await - delete in background to not slow down the response
      deleteImagesFromCloudinary(imagesToDelete).catch(error => {
        console.error('Error deleting images from Cloudinary:', error);
      });
    }

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

    // Collect all Cloudinary images to delete
    const imagesToDelete: string[] = [];
    if (product.image && isCloudinaryUrl(product.image)) {
      imagesToDelete.push(product.image);
    }
    if (product.images && Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img && isCloudinaryUrl(img) && !imagesToDelete.includes(img)) {
          imagesToDelete.push(img);
        }
      }
    }

    await Product.findByIdAndDelete(id);

    // Delete all product images from Cloudinary (non-blocking)
    if (imagesToDelete.length > 0) {
      // Don't await - delete in background to not slow down the response
      deleteImagesFromCloudinary(imagesToDelete).catch(error => {
        console.error('Error deleting product images from Cloudinary:', error);
      });
    }

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
