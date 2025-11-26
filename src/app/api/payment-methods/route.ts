import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SavedPaymentMethod from '@/models/SavedPaymentMethod';
import { verifyToken } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// GET /api/payment-methods - Get user's saved payment methods
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await verifyToken(request);
    const userId = authResult.userId;

    const paymentMethods = await SavedPaymentMethod.find({ userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/payment-methods - Save a payment method
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await verifyToken(request);
    const userId = authResult.userId;

    const body = await request.json();
    const { paymentMethodId, setAsDefault = false } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Retrieve payment method from Stripe to get details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.type !== 'card') {
      return NextResponse.json(
        { error: 'Only card payment methods are supported' },
        { status: 400 }
      );
    }

    // Check if payment method already exists
    const existing = await SavedPaymentMethod.findOne({ paymentMethodId });
    if (existing) {
      return NextResponse.json(
        { error: 'Payment method already saved' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (setAsDefault) {
      await SavedPaymentMethod.updateMany(
        { userId, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    // Create saved payment method
    const savedMethod = await SavedPaymentMethod.create({
      userId,
      paymentMethodId,
      type: 'card',
      card: {
        brand: paymentMethod.card?.brand || 'unknown',
        last4: paymentMethod.card?.last4 || '',
        expMonth: paymentMethod.card?.exp_month || 0,
        expYear: paymentMethod.card?.exp_year || 0,
      },
      billingDetails: paymentMethod.billing_details ? {
        name: paymentMethod.billing_details.name || undefined,
        email: paymentMethod.billing_details.email || undefined,
        phone: paymentMethod.billing_details.phone || undefined,
        address: paymentMethod.billing_details.address ? {
          line1: paymentMethod.billing_details.address.line1 || undefined,
          line2: paymentMethod.billing_details.address.line2 || undefined,
          city: paymentMethod.billing_details.address.city || undefined,
          state: paymentMethod.billing_details.address.state || undefined,
          postal_code: paymentMethod.billing_details.address.postal_code || undefined,
          country: paymentMethod.billing_details.address.country || undefined,
        } : undefined,
      } : undefined,
      isDefault: setAsDefault,
    });

    return NextResponse.json({ paymentMethod: savedMethod }, { status: 201 });
  } catch (error) {
    console.error('Error saving payment method:', error);
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/payment-methods - Delete a saved payment method
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await verifyToken(request);
    const userId = authResult.userId;

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const deleted = await SavedPaymentMethod.findOneAndDelete({
      userId,
      paymentMethodId,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/payment-methods - Update payment method (e.g., set as default)
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await verifyToken(request);
    const userId = authResult.userId;

    const body = await request.json();
    const { paymentMethodId, isDefault } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const paymentMethod = await SavedPaymentMethod.findOne({
      userId,
      paymentMethodId,
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault === true) {
      await SavedPaymentMethod.updateMany(
        { userId, _id: { $ne: paymentMethod._id }, isDefault: true },
        { $set: { isDefault: false } }
      );
      paymentMethod.isDefault = true;
    } else if (isDefault === false) {
      paymentMethod.isDefault = false;
    }

    await paymentMethod.save();

    return NextResponse.json({ paymentMethod });
  } catch (error) {
    console.error('Error updating payment method:', error);
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

