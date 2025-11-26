import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import ProductBundle from '@/models/ProductBundle';
import Product from '@/models/Product';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid bundle id' },
        { status: 400 }
      );
    }

    const bundle = await ProductBundle.findById(id).lean();
    
    if (!bundle) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      );
    }

    // Populate product details
    const productIds = bundle.products.map((p: any) => p.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name description price image images inStock stockCount')
      .lean();
    
    const productsMap = new Map(products.map((p: any) => [p._id.toString(), p]));
    
    const bundleWithProducts = {
      ...bundle,
      products: bundle.products.map((p: any) => ({
        ...p,
        product: productsMap.get(p.productId) || null
      }))
    };

    return NextResponse.json({ bundle: bundleWithProducts });
  } catch (error: any) {
    console.error('Error fetching bundle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

