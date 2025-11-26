import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PreOrder from '@/models/PreOrder';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { sendEmail } from '@/lib/email';

/**
 * Cron job endpoint for processing pre-orders when products are released
 * This should be called by a cron service (e.g., Vercel Cron, cron-job.org, etc.)
 * 
 * Example cron schedule: Daily at 8 AM
 * 0 8 * * * - Run daily at 8:00 AM
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (optional security check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find pre-orders that are due for release
    const preOrders = await PreOrder.find({
      status: { $in: ['pending', 'confirmed'] },
      expectedReleaseDate: { $lte: today }
    }).lean();

    if (preOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pre-orders due for release',
        processed: 0
      });
    }

    let processedCount = 0;
    const errors: string[] = [];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    for (const preOrder of preOrders) {
      try {
        // Check if product is now in stock
        const product = await Product.findById(preOrder.productId).lean();
        if (!product || !product.inStock) {
          // Product not ready yet, skip
          continue;
        }

        // Create order for pre-order
        const order = await Order.create({
          userId: preOrder.userId,
          guestEmail: preOrder.userEmail,
          orderNumber: `PRE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          items: [{
            productId: preOrder.productId,
            name: preOrder.productName,
            price: preOrder.price,
            quantity: preOrder.quantity,
            image: preOrder.productImage
          }],
          subtotal: preOrder.price * preOrder.quantity,
          shipping: 0, // Calculate based on address
          tax: 0, // Calculate based on address
          total: preOrder.price * preOrder.quantity,
          status: 'processing',
          shippingAddress: preOrder.shippingAddress || {
            firstName: '',
            lastName: '',
            address1: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States'
          },
          billingAddress: preOrder.shippingAddress || {
            firstName: '',
            lastName: '',
            address1: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States'
          },
          paymentMethod: preOrder.paymentMethod || 'card',
          paymentStatus: preOrder.paymentStatus === 'paid' ? 'paid' : 'pending',
          paymentIntentId: preOrder.paymentIntentId,
          notes: 'Pre-order fulfillment'
        });

        // Update pre-order status
        await PreOrder.findByIdAndUpdate(preOrder._id, {
          status: 'released',
          releaseDate: new Date(),
          orderId: order._id.toString()
        });

        // Send notification email if not already sent
        if (!preOrder.notifiedAt && preOrder.userEmail) {
          const emailHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                🎉 Your Pre-Order is Ready!
              </h2>
              
              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #065f46; margin-top: 0;">Great news!</h3>
                <p style="color: #047857; margin: 0;">${preOrder.productName} is now available and your order has been processed!</p>
              </div>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <img src="${preOrder.productImage}" alt="${preOrder.productName}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="color: #1e40af; margin-top: 0;">${preOrder.productName}</h3>
                <p style="color: #374151; margin: 10px 0;"><strong>Quantity:</strong> ${preOrder.quantity}</p>
                <p style="color: #374151; margin: 10px 0;"><strong>Price:</strong> $${preOrder.price.toFixed(2)}</p>
                <p style="color: #374151; margin: 10px 0;"><strong>Order Number:</strong> #${order.orderNumber}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${siteUrl}/orders/${order._id}" 
                   style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  View Order
                </a>
              </div>
            </div>
          `;

          await sendEmail({
            to: preOrder.userEmail,
            subject: `🎉 Your Pre-Order is Ready: ${preOrder.productName}`,
            html: emailHTML,
            text: `Great news! ${preOrder.productName} is now available and your order #${order.orderNumber} has been processed. View it here: ${siteUrl}/orders/${order._id}`
          });

          await PreOrder.findByIdAndUpdate(preOrder._id, {
            notifiedAt: new Date()
          });
        }

        processedCount++;
      } catch (error: any) {
        console.error(`Error processing pre-order ${preOrder._id}:`, error);
        errors.push(`Pre-order ${preOrder._id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pre-orders processed',
      processed: processedCount,
      total: preOrders.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error in pre-orders cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

