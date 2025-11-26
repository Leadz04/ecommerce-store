import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StockNotification from '@/models/StockNotification';
import Product from '@/models/Product';
import { sendEmail } from '@/lib/email';

/**
 * Cron job endpoint for sending back-in-stock notifications
 * This should be called by a cron service (e.g., Vercel Cron, cron-job.org, etc.)
 * 
 * Example cron schedule: Every hour
 * 0 * * * * - Run at the top of every hour
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

    // Find all products that are back in stock
    const productsBackInStock = await Product.find({
      inStock: true,
      isActive: true
    }).lean();

    if (productsBackInStock.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products back in stock',
        notified: 0
      });
    }

    const productIds = productsBackInStock.map(p => p._id.toString());
    
    // Find all pending notifications for these products
    const notifications = await StockNotification.find({
      productId: { $in: productIds },
      notified: false
    }).lean();

    if (notifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending notifications',
        notified: 0
      });
    }

    let notifiedCount = 0;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Send notifications
    for (const notification of notifications) {
      try {
        const product = productsBackInStock.find(
          p => p._id.toString() === notification.productId
        );

        if (!product) continue;

        const emailHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
              🎉 Product Back in Stock!
            </h2>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #065f46; margin-top: 0;">Great news!</h3>
              <p style="color: #047857; margin: 0;">${product.name} is back in stock!</p>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <img src="${product.image}" alt="${product.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 15px;">
              <h3 style="color: #1e40af; margin-top: 0;">${product.name}</h3>
              <p style="color: #374151; margin: 10px 0;"><strong>Price:</strong> $${product.price.toFixed(2)}</p>
              ${product.originalPrice && product.originalPrice > product.price 
                ? `<p style="color: #dc2626; margin: 10px 0;"><strong>Original Price:</strong> <span style="text-decoration: line-through;">$${product.originalPrice.toFixed(2)}</span></p>`
                : ''
              }
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/products/${product._id}" 
                 style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View Product
              </a>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>Hurry!</strong> Stock is limited. Don't miss out on this product.
              </p>
            </div>
          </div>
        `;

        const emailSent = await sendEmail({
          to: notification.userEmail,
          subject: `🎉 ${product.name} is Back in Stock!`,
          html: emailHTML,
          text: `Great news! ${product.name} is back in stock. Price: $${product.price.toFixed(2)}. View it here: ${siteUrl}/products/${product._id}`
        });

        if (emailSent) {
          await StockNotification.findByIdAndUpdate(notification._id, {
            notified: true,
            notifiedAt: new Date()
          });
          notifiedCount++;
        }
      } catch (error: any) {
        console.error(`Error sending notification for ${notification._id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Stock notifications processed',
      notified: notifiedCount,
      total: notifications.length
    });
  } catch (error: any) {
    console.error('Error in stock notifications cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

