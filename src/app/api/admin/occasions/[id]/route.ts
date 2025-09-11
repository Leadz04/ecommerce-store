import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/lib/auth';
import Occasion from '@/models/Occasion';

// GET /api/admin/occasions/[id] - Get single occasion
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Require SUPER_ADMIN permission
    const userId = await requirePermission(request, 'SUPER_ADMIN');
    
    const { id } = await context.params;
    
    const occasion = await Occasion.findById(id);
    
    if (!occasion) {
      return NextResponse.json(
        { error: 'Occasion not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ occasion });
    
  } catch (error) {
    console.error('Error fetching occasion:', error);
    return NextResponse.json(
      { error: 'Failed to fetch occasion' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/occasions/[id] - Update occasion
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Require SUPER_ADMIN permission
    const userId = await requirePermission(request, 'SUPER_ADMIN');
    
    const { id } = await context.params;
    const body = await request.json();
    const { name, description, date, orderDaysBefore, image, link, isActive } = body;
    
    // Find the occasion
    const occasion = await Occasion.findById(id);
    
    if (!occasion) {
      return NextResponse.json(
        { error: 'Occasion not found' },
        { status: 404 }
      );
    }
    
    // Validate required fields if provided
    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      );
    }
    
    if (description !== undefined && !description.trim()) {
      return NextResponse.json(
        { error: 'Description cannot be empty' },
        { status: 400 }
      );
    }
    
    // Validate date if provided
    if (date) {
      const occasionDate = new Date(date);
      if (isNaN(occasionDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
      
      // Check if another occasion with same name and date exists (excluding current one)
      const existingOccasion = await Occasion.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name || occasion.name}$`, 'i') },
        date: occasionDate
      });
      
      if (existingOccasion) {
        return NextResponse.json(
          { error: 'An occasion with this name and date already exists' },
          { status: 400 }
        );
      }
    }
    
    // Update occasion
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (date !== undefined) updateData.date = new Date(date);
    if (orderDaysBefore !== undefined) updateData.orderDaysBefore = orderDaysBefore;
    if (image !== undefined) updateData.image = image.trim();
    if (link !== undefined) updateData.link = link.trim();
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedOccasion = await Occasion.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      message: 'Occasion updated successfully',
      occasion: updatedOccasion
    });
    
  } catch (error) {
    console.error('Error updating occasion:', error);
    return NextResponse.json(
      { error: 'Failed to update occasion' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/occasions/[id] - Delete occasion
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Require SUPER_ADMIN permission
    const userId = await requirePermission(request, 'SUPER_ADMIN');
    
    const { id } = await context.params;
    
    const occasion = await Occasion.findById(id);
    
    if (!occasion) {
      return NextResponse.json(
        { error: 'Occasion not found' },
        { status: 404 }
      );
    }
    
    await Occasion.findByIdAndDelete(id);
    
    return NextResponse.json({
      message: 'Occasion deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting occasion:', error);
    return NextResponse.json(
      { error: 'Failed to delete occasion' },
      { status: 500 }
    );
  }
}
