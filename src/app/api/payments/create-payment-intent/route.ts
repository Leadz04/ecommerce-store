import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const userId = await verifyToken(request);
    const { orderId } = await request.json();
    
    console.log('Payment intent request - userId:', userId, 'orderId:', orderId);
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order details
    const order = await Order.findOne({ _id: orderId, userId });
    console.log('Found order:', order ? 'Yes' : 'No');
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Create payment intent with production-ready configuration
    console.log('Creating Stripe payment intent for order:', order._id, 'amount:', order.total);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: userId,
        orderNumber: order.orderNumber || order._id.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
      capture_method: 'automatic',
      description: `Order ${order.orderNumber || order._id} - ${order.items.length} item(s)`,
      shipping: {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        address: {
          line1: order.shippingAddress.address1,
          line2: order.shippingAddress.address2 || undefined,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postal_code: order.shippingAddress.zipCode,
          country: order.shippingAddress.country === 'United States' ? 'US' : order.shippingAddress.country
        },
        phone: order.shippingAddress.phone || undefined
      }
    });
    
    console.log('Stripe payment intent created:', paymentIntent.id);

    // Update order with payment intent ID
    order.paymentIntentId = paymentIntent.id;
    await order.save();

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'No token provided') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('STRIPE_SECRET_KEY')) {
        return NextResponse.json(
          { error: 'Payment configuration error' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('Invalid API Key')) {
        return NextResponse.json(
          { error: 'Payment service configuration error' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
