import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import { sendEmail, generateOrderStatusEmailHTML } from '@/lib/email';

/**
 * POST /api/orders/[id]/cancel
 * Cancel an order (within 24 hours and not shipped/delivered)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const authResult = await verifyToken(request);
    const userId = authResult.userId;

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to user
    if (order.userId && order.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if order can be cancelled
    const orderDate = new Date(order.createdAt);
    const hoursSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceOrder > 24) {
      return NextResponse.json(
        { error: 'Orders can only be cancelled within 24 hours of placement' },
        { status: 400 }
      );
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      return NextResponse.json(
        { error: 'Cannot cancel order that has already been shipped or delivered' },
        { status: 400 }
      );
    }

    if (order.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Order is already cancelled' },
        { status: 400 }
      );
    }

    // Store the original status before changing it
    const previousStatus = order.status;

    // Cancel the order
    order.status = 'cancelled';
    order.paymentStatus = 'refunded'; // Mark payment as refunded
    await order.save();

    // Send cancellation email
    try {
      const { User } = await import('@/models');
      const user = await User.findById(order.userId).select('name email').lean();
      const customerEmail = user?.email || order.guestEmail;
      const customerName = user?.name || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`;

      if (customerEmail) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const statusEmailHTML = generateOrderStatusEmailHTML({
          orderNumber: order.orderNumber || order._id.toString(),
          customerName: customerName,
          customerEmail: customerEmail,
          status: 'cancelled',
          previousStatus: previousStatus,
          siteUrl
        });

        await sendEmail({
          to: customerEmail,
          subject: `Order Cancelled - #${order.orderNumber || order._id.toString()}`,
          html: statusEmailHTML,
        });
      }
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Don't fail the cancellation if email fails
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
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

