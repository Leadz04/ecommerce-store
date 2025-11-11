import { NextRequest, NextResponse } from 'next/server';
import AbandonedCart from '@/models/AbandonedCart';
import Discount from '@/models/Discount';
import connectDB from '@/lib/mongodb';
// import { sendAbandonedCartEmail } from '@/lib/email';

// POST - Process abandoned carts (cron job endpoint)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    // Find active carts that should be marked as abandoned
    const activeCarts = await AbandonedCart.find({
      status: 'active',
      updatedAt: { $lt: new Date(now.getTime() - 30 * 60 * 1000) } // 30 minutes
    });
    
    for (const cart of activeCarts) {
      cart.status = 'abandoned';
      cart.scheduleReminders();
      await cart.save();
    }
    
    // Process 1-hour reminders
    const oneHourReminders = await AbandonedCart.find({
      status: 'abandoned',
      email: { $exists: true, $ne: null },
      'reminders.type': '1hour',
      'reminders.status': 'pending',
      'reminders.scheduledFor': { $lte: now }
    });
    
    for (const cart of oneHourReminders) {
      const reminder = cart.reminders.find(r => r.type === '1hour' && r.status === 'pending');
      if (reminder) {
        try {
          // Send email
          // await sendAbandonedCartEmail(cart, reminder);
          
          reminder.status = 'sent';
          reminder.sentAt = new Date();
          cart.remindersSent += 1;
          cart.lastReminderSent = new Date();
          await cart.save();
        } catch (error) {
          console.error('Failed to send 1-hour reminder:', error);
          reminder.status = 'failed';
          await cart.save();
        }
      }
    }
    
    // Process 24-hour reminders with discount
    const twentyFourHourReminders = await AbandonedCart.find({
      status: 'abandoned',
      email: { $exists: true, $ne: null },
      'reminders.type': '24hour',
      'reminders.status': 'pending',
      'reminders.scheduledFor': { $lte: now }
    });
    
    for (const cart of twentyFourHourReminders) {
      const reminder = cart.reminders.find(r => r.type === '24hour' && r.status === 'pending');
      if (reminder && reminder.discountAmount) {
        try {
          // Generate discount code
          const discountCode = `SAVE${reminder.discountAmount}-${cart.sessionId.substring(0, 6)}`.toUpperCase();
          
          // Create discount if doesn't exist
          let discount = await Discount.findOne({ code: discountCode });
          if (!discount) {
            discount = await Discount.create({
              code: discountCode,
              name: `Abandoned Cart Recovery ${reminder.discountAmount}%`,
              type: 'percentage',
              value: reminder.discountAmount,
              usageLimit: 1,
              usageLimitPerCustomer: 1,
              endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
              status: 'active'
            });
          }
          
          reminder.discountCode = discountCode;
          
          // Send email with discount
          // await sendAbandonedCartEmail(cart, reminder);
          
          reminder.status = 'sent';
          reminder.sentAt = new Date();
          cart.remindersSent += 1;
          cart.lastReminderSent = new Date();
          cart.recoveryDiscountOffered = reminder.discountAmount;
          await cart.save();
        } catch (error) {
          console.error('Failed to send 24-hour reminder:', error);
          reminder.status = 'failed';
          await cart.save();
        }
      }
    }
    
    // Process 3-day reminders with higher discount
    const threeDayReminders = await AbandonedCart.find({
      status: 'abandoned',
      email: { $exists: true, $ne: null },
      'reminders.type': '3day',
      'reminders.status': 'pending',
      'reminders.scheduledFor': { $lte: now }
    });
    
    for (const cart of threeDayReminders) {
      const reminder = cart.reminders.find(r => r.type === '3day' && r.status === 'pending');
      if (reminder && reminder.discountAmount) {
        try {
          // Generate discount code
          const discountCode = `COMEBACK${reminder.discountAmount}-${cart.sessionId.substring(0, 6)}`.toUpperCase();
          
          // Create discount if doesn't exist
          let discount = await Discount.findOne({ code: discountCode });
          if (!discount) {
            discount = await Discount.create({
              code: discountCode,
              name: `Final Offer ${reminder.discountAmount}%`,
              type: 'percentage',
              value: reminder.discountAmount,
              usageLimit: 1,
              usageLimitPerCustomer: 1,
              endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days
              status: 'active'
            });
          }
          
          reminder.discountCode = discountCode;
          
          // Send email with discount
          // await sendAbandonedCartEmail(cart, reminder);
          
          reminder.status = 'sent';
          reminder.sentAt = new Date();
          cart.remindersSent += 1;
          cart.lastReminderSent = new Date();
          cart.recoveryDiscountOffered = reminder.discountAmount;
          await cart.save();
        } catch (error) {
          console.error('Failed to send 3-day reminder:', error);
          reminder.status = 'failed';
          await cart.save();
        }
      }
    }
    
    // Mark expired carts
    const expiredCarts = await AbandonedCart.updateMany(
      {
        status: { $in: ['active', 'abandoned'] },
        expiresAt: { $lt: now }
      },
      { status: 'expired' }
    );
    
    return NextResponse.json({
      success: true,
      markedAbandoned: activeCarts.length,
      oneHourSent: oneHourReminders.length,
      twentyFourHourSent: twentyFourHourReminders.length,
      threeDaySent: threeDayReminders.length,
      expired: expiredCarts.modifiedCount
    });
  } catch (error) {
    console.error('Error processing abandoned carts:', error);
    return NextResponse.json({ error: 'Failed to process abandoned carts' }, { status: 500 });
  }
}

