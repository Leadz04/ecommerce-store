import { NextRequest, NextResponse } from 'next/server';
import FlashSale from '@/models/FlashSale';
import connectDB from '@/lib/mongodb';

// GET - List flash sales
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const query: any = {};
    if (status) query.status = status;
    
    const flashSales = await FlashSale.find(query)
      .populate('products.productId')
      .sort({ startDate: -1 })
      .limit(50);
    
    // Update statuses based on time
    for (const sale of flashSales) {
      sale.updateStatus();
      await sale.save();
    }
    
    return NextResponse.json({ flashSales });
  } catch (error) {
    console.error('Error fetching flash sales:', error);
    return NextResponse.json({ error: 'Failed to fetch flash sales' }, { status: 500 });
  }
}

// POST - Create a flash sale
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    const flashSale = await FlashSale.create(body);
    flashSale.updateStatus();
    await flashSale.save();
    
    return NextResponse.json({ flashSale }, { status: 201 });
  } catch (error) {
    console.error('Error creating flash sale:', error);
    return NextResponse.json({ error: 'Failed to create flash sale' }, { status: 500 });
  }
}

// PUT - Update a flash sale
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Flash sale ID required' }, { status: 400 });
    }
    
    const flashSale = await FlashSale.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!flashSale) {
      return NextResponse.json({ error: 'Flash sale not found' }, { status: 404 });
    }
    
    flashSale.updateStatus();
    await flashSale.save();
    
    return NextResponse.json({ flashSale });
  } catch (error) {
    console.error('Error updating flash sale:', error);
    return NextResponse.json({ error: 'Failed to update flash sale' }, { status: 500 });
  }
}

