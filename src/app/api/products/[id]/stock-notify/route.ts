import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import StockNotification from '@/models/StockNotification';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';
import { User } from '@/models';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid product id' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product is already in stock
    if (product.inStock) {
      return NextResponse.json(
        { error: 'Product is already in stock' },
        { status: 400 }
      );
    }

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let userId: string | undefined;
    let userEmail: string;

    if (token) {
      try {
        const user = await verifyToken(request);
        userId = user.userId;
        const userDoc = await User.findById(userId).select('email').lean();
        userEmail = (userDoc as any)?.email;
      } catch {
        // Guest user
      }
    }

    const data = await request.json();
    const { email } = data;

    if (!userEmail && !email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    userEmail = userEmail || email.toLowerCase();

    // Check if notification already exists
    const existing = await StockNotification.findOne({
      productId: id,
      userEmail: userEmail.toLowerCase()
    });

    if (existing) {
      return NextResponse.json({
        message: 'You are already subscribed to stock notifications for this product',
        notification: existing
      });
    }

    const notification = await StockNotification.create({
      productId: id,
      productName: product.name,
      productImage: product.image,
      userId,
      userEmail: userEmail.toLowerCase(),
      notified: false,
    });

    return NextResponse.json({
      message: 'You will be notified when this product is back in stock',
      notification
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({
        message: 'You are already subscribed to stock notifications for this product'
      });
    }
    console.error('Error creating stock notification:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid product id' },
        { status: 400 }
      );
    }

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let userId: string | undefined;
    let userEmail: string | undefined;

    if (token) {
      try {
        const user = await verifyToken(request);
        userId = user.userId;
        const userDoc = await User.findById(userId).select('email').lean();
        userEmail = (userDoc as any)?.email;
      } catch {
        // Guest user
      }
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!userId && !userEmail && !email) {
      return NextResponse.json(
        { error: 'User authentication or email required' },
        { status: 401 }
      );
    }

    const query: any = { productId: id };
    if (userId) {
      query.userId = userId;
    } else {
      query.userEmail = (userEmail || email)?.toLowerCase();
    }

    const notification = await StockNotification.findOne(query).lean();

    return NextResponse.json({ 
      subscribed: !!notification,
      notification 
    });
  } catch (error: any) {
    console.error('Error checking stock notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

