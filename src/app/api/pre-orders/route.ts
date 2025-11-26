import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PreOrder from '@/models/PreOrder';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let userId: string | undefined;
    
    if (token) {
      try {
        const user = await verifyToken(request);
        userId = user.userId;
      } catch {
        // Guest user, continue without userId
      }
    }

    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');
    
    const query: any = {};
    if (userId) {
      query.userId = userId;
    } else if (userEmail) {
      query.userEmail = userEmail.toLowerCase();
    } else {
      return NextResponse.json(
        { error: 'User authentication or email required' },
        { status: 401 }
      );
    }

    const preOrders = await PreOrder.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ preOrders });
  } catch (error: any) {
    console.error('Error fetching pre-orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let userId: string | undefined;
    let userEmail: string | undefined;
    
    if (token) {
      try {
        const user = await verifyToken(request);
        userId = user.userId;
      } catch {
        // Guest user, continue
      }
    }

    const data = await request.json();
    const {
      productId,
      quantity,
      userEmail: providedEmail,
      shippingAddress,
      paymentMethod
    } = data;

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!userId && !providedEmail) {
      return NextResponse.json(
        { error: 'User authentication or email required' },
        { status: 400 }
      );
    }

    userEmail = providedEmail?.toLowerCase();

    // Get product details
    const product = await Product.findById(productId).lean();
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has pre-order enabled (you might want to add a field for this)
    // For now, we'll allow pre-orders for any product

    const preOrder = await PreOrder.create({
      productId,
      productName: product.name,
      productImage: product.image,
      userId,
      userEmail,
      quantity,
      price: product.price,
      expectedReleaseDate: (product as any).expectedReleaseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      shippingAddress,
      paymentMethod,
      status: 'pending',
      paymentStatus: 'pending',
    });

    return NextResponse.json({ preOrder }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pre-order:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

