import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Occasion from '@/models/Occasion';

export async function GET() {
  try {
    await connectDB();
    
    // Get all active occasions from database
    const occasions = await Occasion.find({ isActive: true })
      .sort({ date: 1 })
      .lean();
    
    // Transform to match the expected format
    const transformedOccasions = occasions.map(occasion => {
      const now = new Date();
      const occasionDate = new Date(occasion.date);
      const timeDiff = occasionDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      const orderByDate = new Date(occasionDate);
      orderByDate.setDate(occasionDate.getDate() - occasion.orderDaysBefore);
      
      let urgency: 'today' | 'urgent' | 'medium' | 'low' = 'low';
      if (daysUntil <= 0) urgency = 'today';
      else if (daysUntil <= 3) urgency = 'urgent';
      else if (daysUntil <= 7) urgency = 'medium';
      
      return {
        id: occasion._id.toString(),
        name: occasion.name,
        description: occasion.description,
        date: occasionDate,
        daysUntil: Math.max(0, daysUntil),
        orderByDate: orderByDate,
        urgency,
        isActive: occasion.isActive,
        image: occasion.image,
        link: occasion.link
      };
    });
    
    // Get most urgent occasion (within 14 days)
    const mostUrgent = transformedOccasions
      .filter(o => o.daysUntil > 0 && o.daysUntil <= 14)
      .sort((a, b) => a.daysUntil - b.daysUntil)[0] || null;
    
    return NextResponse.json({ 
      occasions: transformedOccasions,
      mostUrgent
    });
  } catch (error) {
    console.error('Error fetching occasions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
