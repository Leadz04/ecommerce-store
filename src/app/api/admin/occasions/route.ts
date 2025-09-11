import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/lib/auth';
import Occasion from '@/models/Occasion';

// GET /api/admin/occasions - Get all occasions
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Require SUPER_ADMIN permission
    const userId = await requirePermission(request, 'SUPER_ADMIN');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    // Get occasions with pagination
    const occasions = await Occasion.find(query)
      .sort({ date: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await Occasion.countDocuments(query);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      occasions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
    
  } catch (error) {
    console.error('Error fetching occasions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch occasions' },
      { status: 500 }
    );
  }
}

// POST /api/admin/occasions - Create new occasion
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Require SUPER_ADMIN permission
    const userId = await requirePermission(request, 'SUPER_ADMIN');
    
    const body = await request.json();
    const { name, description, date, orderDaysBefore, image, link, isActive } = body;
    
    // Validate required fields
    if (!name || !description || !date) {
      return NextResponse.json(
        { error: 'Name, description, and date are required' },
        { status: 400 }
      );
    }
    
    // Validate date
    const occasionDate = new Date(date);
    if (isNaN(occasionDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Check if occasion with same name and date already exists
    const existingOccasion = await Occasion.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      date: occasionDate
    });
    
    if (existingOccasion) {
      return NextResponse.json(
        { error: 'An occasion with this name and date already exists' },
        { status: 400 }
      );
    }
    
    // Create new occasion
    const occasion = new Occasion({
      name: name.trim(),
      description: description.trim(),
      date: occasionDate,
      orderDaysBefore: orderDaysBefore || 3,
      image: image || 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500&h=500&fit=crop',
      link: link || '/products?category=gifts',
      isActive: isActive !== false,
      createdBy: userId
    });
    
    await occasion.save();
    
    return NextResponse.json({
      message: 'Occasion created successfully',
      occasion
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating occasion:', error);
    return NextResponse.json(
      { error: 'Failed to create occasion' },
      { status: 500 }
    );
  }
}
