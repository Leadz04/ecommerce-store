import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import Order from '@/models/Order';
import Product from '@/models/Product';

/**
 * Cron job endpoint for processing subscription deliveries
 * This should be called by a cron service (e.g., Vercel Cron, cron-job.org, etc.)
 * 
 * Example cron schedule: Daily at 9 AM
 * 0 9 * * * - Run daily at 9:00 AM
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

    // Find subscriptions due for delivery today
    const subscriptions = await Subscription.find({
      status: 'active',
      nextDeliveryDate: { $lte: today },
      $or: [
        { pauseUntil: { $exists: false } },
        { pauseUntil: null },
        { pauseUntil: { $lte: today } }
      ]
    }).lean();

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions due for delivery',
        processed: 0
      });
    }

    let processedCount = 0;
    const errors: string[] = [];

    for (const subscription of subscriptions) {
      try {
        // Check if subscription has reached total deliveries limit
        if (subscription.totalDeliveries && subscription.deliveryCount >= subscription.totalDeliveries) {
          await Subscription.findByIdAndUpdate(subscription._id, {
            status: 'expired',
            endDate: new Date()
          });
          continue;
        }

        // Check if product is still available
        const product = await Product.findById(subscription.productId).lean();
        if (!product || !product.inStock) {
          // Skip this delivery, but don't cancel subscription
          errors.push(`Product ${subscription.productId} not available for subscription ${subscription._id}`);
          continue;
        }

        // Create order for this delivery
        const order = await Order.create({
          userId: subscription.userId,
          orderNumber: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          items: [{
            productId: subscription.productId,
            name: subscription.productName,
            price: subscription.price,
            quantity: subscription.quantity,
            image: subscription.productImage
          }],
          subtotal: subscription.price * subscription.quantity,
          shipping: 0, // Free shipping for subscriptions
          tax: 0, // Calculate based on address if needed
          total: subscription.price * subscription.quantity,
          status: 'processing',
          shippingAddress: subscription.shippingAddress,
          billingAddress: subscription.shippingAddress,
          paymentMethod: subscription.paymentMethod,
          paymentStatus: 'paid', // Assuming payment is already authorized
          paymentIntentId: subscription.paymentIntentId,
          notes: `Subscription delivery #${subscription.deliveryCount + 1}`
        });

        // Calculate next delivery date
        let nextDeliveryDate = new Date(subscription.nextDeliveryDate);
        switch (subscription.frequency) {
          case 'weekly':
            nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);
            break;
          case 'biweekly':
            nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 14);
            break;
          case 'monthly':
            nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDeliveryDate.setFullYear(nextDeliveryDate.getFullYear() + 1);
            break;
        }

        // Update subscription
        await Subscription.findByIdAndUpdate(subscription._id, {
          deliveryCount: subscription.deliveryCount + 1,
          lastDeliveryDate: new Date(),
          nextDeliveryDate: nextDeliveryDate
        });

        processedCount++;
      } catch (error: any) {
        console.error(`Error processing subscription ${subscription._id}:`, error);
        errors.push(`Subscription ${subscription._id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription deliveries processed',
      processed: processedCount,
      total: subscriptions.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error in subscriptions cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

