import { NextRequest, NextResponse } from 'next/server';
import AbandonedCart from '@/models/AbandonedCart';
import connectDB from '@/lib/mongodb';

// GET - List abandoned carts
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    
    const query: any = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (sessionId) query.sessionId = sessionId;
    
    const carts = await AbandonedCart.find(query)
      .sort({ abandonedAt: -1 })
      .limit(100);
    
    return NextResponse.json({ carts });
  } catch (error) {
    console.error('Error fetching abandoned carts:', error);
    return NextResponse.json({ error: 'Failed to fetch abandoned carts' }, { status: 500 });
  }
}

// POST - Create or update abandoned cart
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    const existingCart = await AbandonedCart.findOne({
      sessionId: body.sessionId,
      status: { $in: ['active', 'abandoned'] }
    });
    
    if (existingCart) {
      // Update existing cart
      existingCart.items = body.items;
      existingCart.subtotal = body.subtotal;
      existingCart.total = body.total;
      existingCart.itemCount = body.itemCount;
      existingCart.email = body.email || existingCart.email;
      existingCart.customerName = body.customerName || existingCart.customerName;
      existingCart.userId = body.userId || existingCart.userId;
      
      await existingCart.save();
      
      return NextResponse.json({ cart: existingCart });
    }
    
    // Create new cart
    const cart = await AbandonedCart.create({
      sessionId: body.sessionId,
      userId: body.userId,
      email: body.email,
      customerName: body.customerName,
      items: body.items,
      subtotal: body.subtotal,
      total: body.total,
      itemCount: body.itemCount,
      abandonedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      ipAddress: body.ipAddress,
      userAgent: body.userAgent,
      source: body.source
    });
    
    return NextResponse.json({ cart }, { status: 201 });
  } catch (error) {
    console.error('Error creating abandoned cart:', error);
    return NextResponse.json({ error: 'Failed to create abandoned cart' }, { status: 500 });
  }
}

