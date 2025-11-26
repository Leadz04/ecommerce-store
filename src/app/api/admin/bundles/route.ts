import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ProductBundle from '@/models/ProductBundle';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';
import { User } from '@/models';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    let userRole = user.role;
    if (!userRole || userRole === 'CUSTOMER' || !userRole.includes('ADMIN')) {
      const userDoc = await User.findById(user.userId).populate('role', 'name');
      if (userDoc && userDoc.role) {
        userRole = (userDoc.role as any).name;
      }
    }
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    
    const bundles = await ProductBundle.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ bundles });
  } catch (error: any) {
    console.error('Error fetching bundles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    let userRole = user.role;
    if (!userRole || userRole === 'CUSTOMER' || !userRole.includes('ADMIN')) {
      const userDoc = await User.findById(user.userId).populate('role', 'name');
      if (userDoc && userDoc.role) {
        userRole = (userDoc.role as any).name;
      }
    }
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    
    const data = await request.json();
    const { name, description, products, bundlePrice, category, image, images, startDate, endDate, stockCount } = data;

    if (!name || !description || !products || !Array.isArray(products) || products.length === 0 || !bundlePrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate original total price and discount
    const productIds = products.map((p: any) => p.productId);
    const productDocs = await Product.find({ _id: { $in: productIds } }).lean();
    
    if (productDocs.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Some products not found' },
        { status: 400 }
      );
    }

    let originalTotalPrice = 0;
    for (const bundleProduct of products) {
      const product = productDocs.find((p: any) => p._id.toString() === bundleProduct.productId);
      if (product) {
        originalTotalPrice += (product.price as number) * (bundleProduct.quantity || 1);
      }
    }

    const discountPercent = originalTotalPrice > 0 
      ? Math.round(((originalTotalPrice - bundlePrice) / originalTotalPrice) * 100)
      : 0;

    const bundle = await ProductBundle.create({
      name,
      description,
      products,
      bundlePrice,
      originalTotalPrice,
      discountPercent,
      category,
      image,
      images,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      stockCount: stockCount || 0,
      inStock: stockCount === undefined || stockCount > 0,
      isActive: true,
    });

    return NextResponse.json({ bundle }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bundle:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

