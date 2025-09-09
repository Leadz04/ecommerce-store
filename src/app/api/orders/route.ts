import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Import all models to ensure proper schema registration
import { Order, Product, OrderCounter } from '@/models';

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

// Helper function to generate order number with date/time and incremental counter
async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
  
  // Get or create counter for today
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
  let counter = await OrderCounter.findOneAndUpdate(
    { date: today },
    { $inc: { counter: 1 } },
    { upsert: true, new: true }
  );
  
  // Format: YYYYMMDD-HHMMSS-XXXX (where XXXX is the incremental counter)
  const orderNumber = `${dateStr}-${timeStr}-${String(counter.counter).padStart(4, '0')}`;
  
  return orderNumber;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const userId = await verifyToken(request);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dateRange = searchParams.get('dateRange');

    // Build query
    const query: any = { userId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }
    
    if (dateRange && dateRange !== 'all') {
      const days = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query.createdAt = { $gte: startDate };
    }

    // Execute query
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(query);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const userId = await verifyToken(request);
    const orderData = await request.json();
    
    // Debug: Log the received order data
    console.log('Received order data:', JSON.stringify(orderData, null, 2));
    
    // Validate order data
    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Check product availability and update stock
    for (const item of orderData.items) {
      let product;
      
      // Handle both ObjectId and string ID formats
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        // Valid ObjectId - search by _id
        product = await Product.findById(item.productId);
      } else {
        // String ID - search by id field
        product = await Product.findOne({ id: item.productId });
      }
      
      if (!product) {
        // If product not found in database, log warning but continue
        // This handles cases where sample products are used
        console.warn(`Product ${item.name} (ID: ${item.productId}) not found in database. Skipping stock validation.`);
        continue;
      }
      
      if (!product.inStock || product.stockCount < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.name}` },
          { status: 400 }
        );
      }
      
      // Update stock
      product.stockCount -= item.quantity;
      if (product.stockCount === 0) {
        product.inStock = false;
      }
      await product.save();
    }

    // Debug: Log the Order schema paths
    console.log('Order schema paths:', Object.keys(Order.schema.paths));
    console.log('Address schema paths:', Object.keys(Order.schema.paths.shippingAddress.schema.paths));
    
    // Check if the schema still has the old 'street' field
    const addressSchemaPaths = Object.keys(Order.schema.paths.shippingAddress.schema.paths);
    console.log('Address schema has street field:', addressSchemaPaths.includes('street'));
    console.log('Address schema has address1 field:', addressSchemaPaths.includes('address1'));
    
    // Generate order number with date/time and incremental counter
    const orderNumber = await generateOrderNumber();
    
    // Create order with field mapping for backward compatibility
    const orderDataWithMapping = {
      ...orderData,
      userId,
      orderNumber,
      // Map address fields for backward compatibility
      shippingAddress: {
        ...orderData.shippingAddress,
        // If schema still expects 'street', map address1 to street
        ...(addressSchemaPaths.includes('street') && !addressSchemaPaths.includes('address1') ? {
          street: orderData.shippingAddress.address1
        } : {})
      },
      billingAddress: {
        ...orderData.billingAddress,
        // If schema still expects 'street', map address1 to street
        ...(addressSchemaPaths.includes('street') && !addressSchemaPaths.includes('address1') ? {
          street: orderData.billingAddress.address1
        } : {})
      }
    };
    
    console.log('Final order data with mapping:', JSON.stringify(orderDataWithMapping, null, 2));
    
    const order = new Order(orderDataWithMapping);

    // Validate the order before saving
    const validationError = order.validateSync();
    if (validationError) {
      console.error('Order validation error:', validationError);
      console.error('Validation error details:', validationError.errors);
      return NextResponse.json(
        { error: 'Order validation failed', details: validationError.errors },
        { status: 400 }
      );
    }

    await order.save();

    console.log('Order saved successfully:', {
      _id: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      total: order.total
    });

    return NextResponse.json({
      message: 'Order created successfully',
      order
    }, { status: 201 });

  } catch (error) {
    console.error('Order creation error:', error);
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
