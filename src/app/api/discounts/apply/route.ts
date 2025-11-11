import { NextRequest, NextResponse } from 'next/server';
import Discount from '@/models/Discount';
import connectDB from '@/lib/mongodb';

// POST - Apply discount to cart
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { code, orderTotal, items, userId, quantity = 1 } = await request.json();
    
    if (!code || !orderTotal) {
      return NextResponse.json(
        { error: 'Discount code and order total required' },
        { status: 400 }
      );
    }
    
    const discount = await Discount.findOne({
      code: code.toUpperCase(),
      isActive: true
    });
    
    if (!discount) {
      return NextResponse.json(
        { error: 'Invalid discount code' },
        { status: 404 }
      );
    }
    
    // Check if discount is valid
    if (!discount.isCurrentlyValid()) {
      return NextResponse.json(
        { error: 'Discount code is expired or invalid' },
        { status: 400 }
      );
    }
    
    // Check minimum purchase amount
    if (discount.minPurchaseAmount && orderTotal < discount.minPurchaseAmount) {
      return NextResponse.json(
        {
          error: `Minimum purchase amount of $${discount.minPurchaseAmount} required`,
          minPurchaseAmount: discount.minPurchaseAmount
        },
        { status: 400 }
      );
    }
    
    // Check usage limit per customer
    if (userId && discount.usageLimitPerCustomer) {
      // TODO: Check user's usage count from orders
      // For now, we'll skip this check
    }
    
    // Check product applicability
    if (discount.applicableProducts && discount.applicableProducts.length > 0 && items) {
      const hasApplicableProduct = items.some((item: any) =>
        discount.applicableProducts!.includes(item.productId)
      );
      
      if (!hasApplicableProduct) {
        return NextResponse.json(
          { error: 'Discount not applicable to items in cart' },
          { status: 400 }
        );
      }
    }
    
    // Calculate discount amount
    const discountAmount = discount.calculateDiscount(orderTotal, quantity);
    const finalTotal = Math.max(0, orderTotal - discountAmount);
    
    return NextResponse.json({
      success: true,
      discount: {
        _id: discount._id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        value: discount.value
      },
      discountAmount,
      originalTotal: orderTotal,
      finalTotal,
      savings: discountAmount
    });
  } catch (error) {
    console.error('Error applying discount:', error);
    return NextResponse.json(
      { error: 'Failed to apply discount' },
      { status: 500 }
    );
  }
}

