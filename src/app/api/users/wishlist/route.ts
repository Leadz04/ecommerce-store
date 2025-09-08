import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import jwt from 'jsonwebtoken';

async function verifyToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const userId = await verifyToken(request);
    const user = await User.findById(userId).populate('wishlist');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ wishlist: user.wishlist || [] });
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const userId = await verifyToken(request);
    const { productId } = await request.json();
    if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    const product = await Product.findById(productId).select('_id');
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { wishlist: product._id } },
      { new: true }
    ).populate('wishlist');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ wishlist: user.wishlist });
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const userId = await verifyToken(request);
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: productId } },
      { new: true }
    ).populate('wishlist');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ wishlist: user.wishlist });
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


