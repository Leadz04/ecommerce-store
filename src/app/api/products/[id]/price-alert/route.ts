import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import PriceAlert from '@/models/PriceAlert';
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
    const { email, targetPrice } = data;

    if (!userEmail && !email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!targetPrice || targetPrice <= 0) {
      return NextResponse.json(
        { error: 'Valid target price is required' },
        { status: 400 }
      );
    }

    if (targetPrice >= product.price) {
      return NextResponse.json(
        { error: 'Target price must be less than current price' },
        { status: 400 }
      );
    }

    userEmail = userEmail || email.toLowerCase();

    // Check if alert already exists
    const existing = await PriceAlert.findOne({
      productId: id,
      userEmail: userEmail.toLowerCase(),
      isActive: true
    });

    if (existing) {
      // Update existing alert
      existing.targetPrice = targetPrice;
      existing.currentPrice = product.price;
      await existing.save();
      
      return NextResponse.json({
        message: 'Price alert updated',
        alert: existing
      });
    }

    const alert = await PriceAlert.create({
      productId: id,
      productName: product.name,
      productImage: product.image,
      userId,
      userEmail: userEmail.toLowerCase(),
      targetPrice,
      currentPrice: product.price,
      notified: false,
      isActive: true,
    });

    return NextResponse.json({
      message: 'Price alert created. You will be notified when the price drops to your target.',
      alert
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({
        message: 'You already have an active price alert for this product'
      });
    }
    console.error('Error creating price alert:', error);
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

    const query: any = { productId: id, isActive: true };
    if (userId) {
      query.userId = userId;
    } else {
      query.userEmail = (userEmail || email)?.toLowerCase();
    }

    const alert = await PriceAlert.findOne(query).lean();

    return NextResponse.json({ 
      hasAlert: !!alert,
      alert 
    });
  } catch (error: any) {
    console.error('Error checking price alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query: any = { productId: id, isActive: true };
    if (userId) {
      query.userId = userId;
    } else {
      query.userEmail = userEmail?.toLowerCase();
    }

    const alert = await PriceAlert.findOne(query);
    if (!alert) {
      return NextResponse.json(
        { error: 'Price alert not found' },
        { status: 404 }
      );
    }

    alert.isActive = false;
    await alert.save();

    return NextResponse.json({ message: 'Price alert cancelled' });
  } catch (error: any) {
    console.error('Error deleting price alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

