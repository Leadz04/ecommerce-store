import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { sendEmail, generatePaymentNotificationEmailHTML, ADMIN_EMAIL } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update order status
        const updatedOrder = await Order.findOneAndUpdate(
          { paymentIntentId: paymentIntent.id },
          { 
            paymentStatus: 'paid',
            status: 'processing',
            paymentMethod: paymentIntent.payment_method_types[0] || 'card',
            paidAt: new Date()
          },
          { new: true }
        );
        
        if (updatedOrder) {
          console.log('Payment succeeded for order:', updatedOrder.orderNumber || updatedOrder._id);
          
          // Send email notifications
          try {
            const user = await User.findById(updatedOrder.userId).select('name email').lean();
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            
            if (user && user.email) {
              // Send to customer
              const paymentEmailHTML = generatePaymentNotificationEmailHTML({
                orderNumber: updatedOrder.orderNumber || updatedOrder._id.toString(),
                customerName: user.name || 'Customer',
                amount: updatedOrder.total,
                status: 'succeeded',
                siteUrl
              });
              
              await sendEmail({
                to: user.email,
                subject: `Payment Successful - Order #${updatedOrder.orderNumber || updatedOrder._id.toString()}`,
                html: paymentEmailHTML,
                text: `Your payment of $${updatedOrder.total.toFixed(2)} for order #${updatedOrder.orderNumber || updatedOrder._id.toString()} was successful.`
              });
            }
            
            // Send admin notification
            await sendEmail({
              to: ADMIN_EMAIL,
              subject: `✅ Payment Successful - Order #${updatedOrder.orderNumber || updatedOrder._id.toString()}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                    Payment Successful
                  </h2>
                  <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <h3 style="color: #065f46; margin-top: 0;">Payment Received</h3>
                    <p style="color: #047857; margin: 0;">Payment for order #${updatedOrder.orderNumber || updatedOrder._id.toString()} has been successfully processed.</p>
                  </div>
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Order Number:</strong> #${updatedOrder.orderNumber || updatedOrder._id.toString()}</p>
                    <p><strong>Amount:</strong> $${updatedOrder.total.toFixed(2)}</p>
                    <p><strong>Payment Method:</strong> ${paymentIntent.payment_method_types[0] || 'card'}</p>
                  </div>
                </div>
              `,
              text: `Payment successful for order #${updatedOrder.orderNumber || updatedOrder._id.toString()}\nAmount: $${updatedOrder.total.toFixed(2)}`
            });
            console.log('✅ [API /payments/webhook] Payment notification emails sent');
          } catch (emailError) {
            console.error('❌ [API /payments/webhook] Failed to send payment notification emails:', emailError);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        
        // Update order status
        const failedOrder = await Order.findOneAndUpdate(
          { paymentIntentId: failedPayment.id },
          { 
            paymentStatus: 'failed',
            status: 'cancelled',
            failureReason: failedPayment.last_payment_error?.message || 'Payment failed'
          },
          { new: true }
        );
        
        console.log('Payment failed:', failedPayment.id);
        
        // Send email notifications for failed payment
        if (failedOrder) {
          try {
            const user = await User.findById(failedOrder.userId).select('name email').lean();
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            
            if (user && user.email) {
              const paymentEmailHTML = generatePaymentNotificationEmailHTML({
                orderNumber: failedOrder.orderNumber || failedOrder._id.toString(),
                customerName: user.name || 'Customer',
                amount: failedOrder.total,
                status: 'failed',
                failureReason: failedPayment.last_payment_error?.message || 'Payment failed',
                siteUrl
              });
              
              await sendEmail({
                to: user.email,
                subject: `Payment Failed - Order #${failedOrder.orderNumber || failedOrder._id.toString()}`,
                html: paymentEmailHTML,
                text: `Your payment for order #${failedOrder.orderNumber || failedOrder._id.toString()} failed. Please try again.`
              });
            }
            
            // Send admin notification
            await sendEmail({
              to: ADMIN_EMAIL,
              subject: `❌ Payment Failed - Order #${failedOrder.orderNumber || failedOrder._id.toString()}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">
                    Payment Failed
                  </h2>
                  <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <h3 style="color: #991b1b; margin-top: 0;">Payment Failed</h3>
                    <p style="color: #dc2626; margin: 0;">Payment for order #${failedOrder.orderNumber || failedOrder._id.toString()} has failed.</p>
                  </div>
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Order Number:</strong> #${failedOrder.orderNumber || failedOrder._id.toString()}</p>
                    <p><strong>Amount:</strong> $${failedOrder.total.toFixed(2)}</p>
                    <p><strong>Failure Reason:</strong> ${failedPayment.last_payment_error?.message || 'Payment failed'}</p>
                  </div>
                </div>
              `,
              text: `Payment failed for order #${failedOrder.orderNumber || failedOrder._id.toString()}\nReason: ${failedPayment.last_payment_error?.message || 'Payment failed'}`
            });
          } catch (emailError) {
            console.error('❌ [API /payments/webhook] Failed to send failure notification emails:', emailError);
          }
        }
        break;

      case 'payment_intent.canceled':
        const canceledPayment = event.data.object as Stripe.PaymentIntent;
        
        await Order.findOneAndUpdate(
          { paymentIntentId: canceledPayment.id },
          { 
            paymentStatus: 'canceled',
            status: 'cancelled'
          }
        );
        
        console.log('Payment canceled:', canceledPayment.id);
        break;

      case 'charge.dispute.created':
        const dispute = event.data.object as Stripe.Dispute;
        
        // Handle dispute - update order status and notify admin
        const disputedOrder = await Order.findOneAndUpdate(
          { paymentIntentId: dispute.payment_intent },
          { 
            paymentStatus: 'disputed',
            status: 'disputed',
            disputeId: dispute.id
          },
          { new: true }
        );
        
        console.log('Dispute created:', dispute.id);
        
        // Send admin notification for dispute
        if (disputedOrder) {
          try {
            await sendEmail({
              to: ADMIN_EMAIL,
              subject: `⚠️ Payment Dispute - Order #${disputedOrder.orderNumber || disputedOrder._id.toString()}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
                    Payment Dispute Created
                  </h2>
                  <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <h3 style="color: #92400e; margin-top: 0;">⚠️ Action Required</h3>
                    <p style="color: #78350f; margin: 0;">A payment dispute has been filed for order #${disputedOrder.orderNumber || disputedOrder._id.toString()}.</p>
                  </div>
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Order Number:</strong> #${disputedOrder.orderNumber || disputedOrder._id.toString()}</p>
                    <p><strong>Dispute ID:</strong> ${dispute.id}</p>
                    <p><strong>Amount:</strong> $${disputedOrder.total.toFixed(2)}</p>
                    <p><strong>Reason:</strong> ${dispute.reason || 'Not specified'}</p>
                  </div>
                </div>
              `,
              text: `Payment dispute created for order #${disputedOrder.orderNumber || disputedOrder._id.toString()}\nDispute ID: ${dispute.id}\nAmount: $${disputedOrder.total.toFixed(2)}`
            });
            console.log('✅ [API /payments/webhook] Dispute notification sent to admin');
          } catch (emailError) {
            console.error('❌ [API /payments/webhook] Failed to send dispute notification:', emailError);
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
