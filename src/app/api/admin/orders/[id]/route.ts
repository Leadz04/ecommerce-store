import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order, User } from '@/models';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { sendEmail, generateOrderStatusEmailHTML, ADMIN_EMAIL } from '@/lib/email';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requirePermission(PERMISSIONS.ORDER_VIEW_ALL)(request);
    
    const { id } = await params;

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const plain = order.toObject();
    const user = await User.findById(plain.userId).select('name email phone address');
    const transformedOrder = {
      ...plain,
      user: user ? {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: (user as any).address
      } : null,
      items: plain.items.map((item: any) => ({
        ...item,
        product: {
          _id: item.productId,
          name: item.name,
          image: item.image,
          price: item.price,
          category: undefined,
          brand: undefined
        }
      }))
    };

    return NextResponse.json({ order: transformedOrder });

  } catch (error) {
    console.error('Admin order fetch error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requirePermission(PERMISSIONS.ORDER_UPDATE)(request);
    
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousStatus = order.status;
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Send email notification to customer if status changed
    if (status && status !== previousStatus) {
      try {
        const plain = updatedOrder.toObject();
        const user = await User.findById(plain.userId).select('name email phone address');
        const customerEmail = user?.email || updatedOrder.guestEmail;
        const customerName = user?.name || `${updatedOrder.shippingAddress.firstName} ${updatedOrder.shippingAddress.lastName}`;
        
        if (customerEmail) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
          
          // Special delivery confirmation email
          if (status === 'delivered') {
            const { generateDeliveryConfirmationEmailHTML } = await import('@/lib/email-templates-delivery');
            const deliveryEmailHTML = generateDeliveryConfirmationEmailHTML({
              orderNumber: updatedOrder.orderNumber || updatedOrder._id.toString(),
              customerName: customerName,
              customerEmail: customerEmail,
              items: updatedOrder.items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                image: item.image,
              })),
              shippingAddress: updatedOrder.shippingAddress,
              trackingNumber: updatedOrder.trackingNumber,
              estimatedDeliveryDate: updatedOrder.estimatedDeliveryDate 
                ? new Date(updatedOrder.estimatedDeliveryDate).toLocaleDateString()
                : undefined,
              siteUrl,
            });

            await sendEmail({
              to: customerEmail,
              subject: `🎉 Your Order Has Been Delivered - #${updatedOrder.orderNumber || updatedOrder._id.toString()}`,
              html: deliveryEmailHTML,
            });
            console.log('✅ [API /admin/orders] Delivery confirmation email sent to customer');
          } else {
            // Regular status update email
            const statusEmailHTML = generateOrderStatusEmailHTML({
              orderNumber: updatedOrder.orderNumber || updatedOrder._id.toString(),
              customerName: customerName,
              customerEmail: customerEmail,
              status: status,
              previousStatus: previousStatus,
              trackingNumber: updatedOrder.trackingNumber,
              notes: body.notes,
              siteUrl
            });

            await sendEmail({
              to: customerEmail,
              subject: `Order Status Update - #${updatedOrder.orderNumber || updatedOrder._id.toString()}`,
              html: statusEmailHTML,
              text: `Your order #${updatedOrder.orderNumber || updatedOrder._id.toString()} status has been updated to: ${status}`
            });
            console.log('✅ [API /admin/orders] Status update email sent to customer');
          }
        }
      } catch (emailError) {
        console.error('❌ [API /admin/orders] Failed to send status update email:', emailError);
        // Don't fail order update if email fails
      }
    }

    const plain = updatedOrder.toObject();
    const user = await User.findById(plain.userId).select('name email phone address');
    const transformedOrder = {
      ...plain,
      user: user ? {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: (user as any).address
      } : null,
      items: plain.items.map((item: any) => ({
        ...item,
        product: {
          _id: item.productId,
          name: item.name,
          image: item.image,
          price: item.price,
          category: undefined,
          brand: undefined
        }
      }))
    };

    return NextResponse.json({ order: transformedOrder });

  } catch (error) {
    console.error('Admin order update error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requirePermission(PERMISSIONS.ORDER_UPDATE)(request);
    
    const { id } = await params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Order deleted successfully' });

  } catch (error) {
    console.error('Admin order delete error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete order' },
      { status: 500 }
    );
  }
}
