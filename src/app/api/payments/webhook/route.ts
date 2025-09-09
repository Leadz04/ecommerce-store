import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

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
          // Here you could send confirmation emails, update inventory, etc.
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        
        // Update order status
        await Order.findOneAndUpdate(
          { paymentIntentId: failedPayment.id },
          { 
            paymentStatus: 'failed',
            status: 'cancelled',
            failureReason: failedPayment.last_payment_error?.message || 'Payment failed'
          }
        );
        
        console.log('Payment failed:', failedPayment.id);
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
        await Order.findOneAndUpdate(
          { paymentIntentId: dispute.payment_intent },
          { 
            paymentStatus: 'disputed',
            status: 'disputed',
            disputeId: dispute.id
          }
        );
        
        console.log('Dispute created:', dispute.id);
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
