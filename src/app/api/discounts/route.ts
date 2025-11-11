import { NextRequest, NextResponse } from 'next/server';
import Discount from '@/models/Discount';
import connectDB from '@/lib/mongodb';

// GET - List all discounts or validate a discount code
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const status = searchParams.get('status');
    
    if (code) {
      // Validate discount code
      const discount = await Discount.findOne({ 
        code: code.toUpperCase(),
        isActive: true
      });
      
      if (!discount) {
        return NextResponse.json({ error: 'Discount code not found' }, { status: 404 });
      }
      
      const isValid = discount.isCurrentlyValid();
      
      return NextResponse.json({
        discount: {
          _id: discount._id,
          code: discount.code,
          name: discount.name,
          type: discount.type,
          value: discount.value,
          minPurchaseAmount: discount.minPurchaseAmount,
          maxDiscountAmount: discount.maxDiscountAmount
        },
        isValid
      });
    }
    
    // List all discounts
    const query: any = {};
    if (status) query.status = status;
    
    const discounts = await Discount.find(query)
      .sort({ createdAt: -1 })
      .limit(100);
    
    return NextResponse.json({ discounts });
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

// POST - Create a new discount
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Check if code already exists
    const existingDiscount = await Discount.findOne({ code: body.code.toUpperCase() });
    if (existingDiscount) {
      return NextResponse.json({ error: 'Discount code already exists' }, { status: 400 });
    }
    
    const discount = await Discount.create({
      ...body,
      code: body.code.toUpperCase()
    });
    
    return NextResponse.json({ discount }, { status: 201 });
  } catch (error) {
    console.error('Error creating discount:', error);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}

// PUT - Update a discount
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Discount ID required' }, { status: 400 });
    }
    
    const discount = await Discount.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!discount) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }
    
    return NextResponse.json({ discount });
  } catch (error) {
    console.error('Error updating discount:', error);
    return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 });
  }
}

// DELETE - Delete a discount
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Discount ID required' }, { status: 400 });
    }
    
    const discount = await Discount.findByIdAndDelete(id);
    
    if (!discount) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount:', error);
    return NextResponse.json({ error: 'Failed to delete discount' }, { status: 500 });
  }
}

