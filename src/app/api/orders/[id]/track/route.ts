import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const userId = await verifyToken(request);
    const { id } = await context.params;
    
    // Get order details
    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate tracking information
    const trackingInfo = generateTrackingInfo(order);
    
    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      tracking: trackingInfo,
      estimatedDelivery: getEstimatedDelivery(order.createdAt, order.status),
      shippingAddress: order.shippingAddress,
      trackingNumber: order.trackingNumber || generateTrackingNumber(order.orderNumber)
    });

  } catch (error) {
    console.error('Order tracking error:', error);
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

function generateTrackingInfo(order: any) {
  const trackingEvents = [];
  const orderDate = new Date(order.createdAt);
  
  // Order placed
  trackingEvents.push({
    status: 'Order Placed',
    description: 'Your order has been received and is being processed.',
    timestamp: orderDate.toISOString(),
    location: 'Online Store',
    completed: true
  });

  // Processing
  if (['processing', 'shipped', 'delivered'].includes(order.status)) {
    const processingDate = new Date(orderDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    trackingEvents.push({
      status: 'Processing',
      description: 'Your order is being prepared for shipment.',
      timestamp: processingDate.toISOString(),
      location: 'Warehouse',
      completed: true
    });
  }

  // Shipped
  if (['shipped', 'delivered'].includes(order.status)) {
    const shippedDate = new Date(orderDate.getTime() + 24 * 60 * 60 * 1000); // 1 day later
    trackingEvents.push({
      status: 'Shipped',
      description: 'Your order has been shipped and is on its way.',
      timestamp: shippedDate.toISOString(),
      location: 'Distribution Center',
      completed: true
    });
  }

  // In Transit
  if (['shipped', 'delivered'].includes(order.status)) {
    const transitDate = new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days later
    trackingEvents.push({
      status: 'In Transit',
      description: 'Your order is on its way to the delivery address.',
      timestamp: transitDate.toISOString(),
      location: 'In Transit',
      completed: order.status === 'delivered'
    });
  }

  // Delivered
  if (order.status === 'delivered') {
    const deliveredDate = new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days later
    trackingEvents.push({
      status: 'Delivered',
      description: 'Your order has been successfully delivered.',
      timestamp: deliveredDate.toISOString(),
      location: order.shippingAddress.city + ', ' + order.shippingAddress.state,
      completed: true
    });
  }

  return trackingEvents;
}

function getEstimatedDelivery(orderDate: Date, status: string): string {
  const order = new Date(orderDate);
  
  if (status === 'delivered') {
    return 'Delivered';
  }
  
  if (status === 'shipped') {
    const estimated = new Date(order.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from shipped
    return estimated.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  if (status === 'processing') {
    const estimated = new Date(order.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from processing
    return estimated.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Pending
  const estimated = new Date(order.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from order
  return estimated.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function generateTrackingNumber(orderNumber: string): string {
  // Generate a tracking number based on order number
  const prefix = 'TRK';
  const suffix = orderNumber.split('-').pop() || '0000';
  return `${prefix}${suffix}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}
