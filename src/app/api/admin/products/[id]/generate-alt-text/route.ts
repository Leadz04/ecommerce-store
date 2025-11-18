import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { generateImageAltTexts } from '@/lib/generateImageAltText';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_UPDATE)(request);
    await connectDB();

    const { id } = await context.params;
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get all images
    const allImages = [product.image, ...(product.images || [])].filter(Boolean);
    
    if (allImages.length === 0) {
      return NextResponse.json(
        { error: 'No images found for this product' },
        { status: 400 }
      );
    }

    // Generate alt text for all images
    const altTexts = generateImageAltTexts(
      product.name || '',
      product.description || '',
      product.category || '',
      product.brand,
      allImages.length
    );

    // Update product with alt texts
    product.imageAltTexts = altTexts;
    await product.save();

    return NextResponse.json({
      success: true,
      altTexts,
      message: `Generated ${altTexts.length} unique alt texts for product images`
    });

  } catch (error) {
    console.error('Generate alt text error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

