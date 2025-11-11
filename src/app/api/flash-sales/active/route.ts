import { NextRequest, NextResponse } from 'next/server';
import FlashSale from '@/models/FlashSale';
import connectDB from '@/lib/mongodb';

// GET - Get currently active flash sale
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const flashSales = await FlashSale.getActive();
    
    // Return the most recent active flash sale
    const flashSale = flashSales[0] || null;
    
    if (flashSale) {
      // Increment view count
      flashSale.viewCount += 1;
      await flashSale.save();
    }
    
    return NextResponse.json({ flashSale });
  } catch (error) {
    console.error('Error fetching active flash sale:', error);
    return NextResponse.json({ error: 'Failed to fetch active flash sale' }, { status: 500 });
  }
}

