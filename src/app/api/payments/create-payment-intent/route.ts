import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper function to verify JWT token (optional for guest checkout)
async function verifyTokenOptional(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null; // Guest checkout allowed
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded.userId;
  } catch {
    return null; // Invalid token, treat as guest
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Try to get userId, but allow guest checkout if no token
    const userId = await verifyTokenOptional(request);
    const { orderId, paymentMethodId } = await request.json();
    
    console.log('Payment intent request - userId:', userId || 'guest', 'orderId:', orderId);
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order details - for guest orders, don't filter by userId
    // First try to find by orderId and userId if authenticated
    // Otherwise, find by orderId only (guest orders)
    let order;
    if (userId) {
      order = await Order.findOne({ _id: orderId, userId });
    } else {
      // For guest checkout, find order without userId requirement
      order = await Order.findById(orderId);
      // Additional security: verify it's actually a guest order
      if (order && order.userId) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
    }
    console.log('Found order:', order ? 'Yes' : 'No');
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Create payment intent with production-ready configuration
    console.log('Creating Stripe payment intent for order:', order._id, 'amount:', order.total);
    
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(order.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: userId || 'guest',
        guestEmail: order.guestEmail || '',
        orderNumber: order.orderNumber || order._id.toString()
      },
      ...(paymentMethodId ? {
        payment_method: paymentMethodId,
        confirm: true, // Auto-confirm if using saved payment method
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout?payment_intent={CHECKOUT_SESSION_ID}`,
      } : {
        automatic_payment_methods: {
          enabled: true,
        },
      }),
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
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    
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
