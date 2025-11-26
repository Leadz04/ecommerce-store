import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PriceAlert from '@/models/PriceAlert';
import Product from '@/models/Product';
import { sendEmail } from '@/lib/email';

/**
 * Cron job endpoint for sending price drop alerts
 * This should be called by a cron service (e.g., Vercel Cron, cron-job.org, etc.)
 * 
 * Example cron schedule: Every 6 hours
 * Cron expression: 0 0,6,12,18 * * * (runs at 0, 6, 12, and 18 hours)
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

    // Find all active price alerts
    const alerts = await PriceAlert.find({
      isActive: true,
      notified: false
    }).lean();

    if (alerts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active price alerts',
        notified: 0
      });
    }

    // Group alerts by product ID
    const productIds = [...new Set(alerts.map(a => a.productId))];
    const products = await Product.find({
      _id: { $in: productIds }
    }).lean();

    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let notifiedCount = 0;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Check each alert
    for (const alert of alerts) {
      try {
        const product = productMap.get(alert.productId);
        if (!product) continue;

        const currentPrice = product.price;
        const originalPrice = product.originalPrice || product.price;

        // Check if price has dropped to or below target
        if (currentPrice <= alert.targetPrice) {
          const emailHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
                🔔 Price Drop Alert!
              </h2>
              
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <h3 style="color: #991b1b; margin-top: 0;">Price Alert Triggered!</h3>
                <p style="color: #b91c1c; margin: 0;">${product.name} has dropped to your target price!</p>
              </div>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <img src="${product.image}" alt="${product.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="color: #1e40af; margin-top: 0;">${product.name}</h3>
                <div style="margin: 15px 0;">
                  <p style="color: #374151; margin: 5px 0;"><strong>Your Target Price:</strong> $${alert.targetPrice.toFixed(2)}</p>
                  <p style="color: #dc2626; font-size: 24px; font-weight: bold; margin: 10px 0;">
                    Current Price: $${currentPrice.toFixed(2)}
                  </p>
                  ${originalPrice > currentPrice 
                    ? `<p style="color: #6b7280; margin: 5px 0;"><strong>Original Price:</strong> <span style="text-decoration: line-through;">$${originalPrice.toFixed(2)}</span></p>`
                    : ''
                  }
                  ${currentPrice < alert.currentPrice
                    ? `<p style="color: #059669; margin: 10px 0;">
                        <strong>You're saving:</strong> $${(alert.currentPrice - currentPrice).toFixed(2)} from when you set the alert!
                      </p>`
                    : ''
                  }
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${siteUrl}/products/${product._id}" 
                   style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Buy Now
                </a>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Limited Time:</strong> Prices can change quickly. Don't miss this deal!
                </p>
              </div>
            </div>
          `;

          const emailSent = await sendEmail({
            to: alert.userEmail,
            subject: `🔔 Price Alert: ${product.name} is now $${currentPrice.toFixed(2)}!`,
            html: emailHTML,
            text: `Price Alert! ${product.name} has dropped to $${currentPrice.toFixed(2)} (your target: $${alert.targetPrice.toFixed(2)}). View it here: ${siteUrl}/products/${product._id}`
          });

          if (emailSent) {
            await PriceAlert.findByIdAndUpdate(alert._id, {
              notified: true,
              notifiedAt: new Date(),
              currentPrice: currentPrice
            });
            notifiedCount++;
          }
        } else {
          // Update current price even if not at target yet
          await PriceAlert.findByIdAndUpdate(alert._id, {
            currentPrice: currentPrice
          });
        }
      } catch (error: any) {
        console.error(`Error processing alert ${alert._id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Price alerts processed',
      notified: notifiedCount,
      total: alerts.length
    });
  } catch (error: any) {
    console.error('Error in price alerts cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

