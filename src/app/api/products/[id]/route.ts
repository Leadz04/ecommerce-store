import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';
import { User } from '@/models';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid product id' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });

  } catch (error) {
    console.error('Product fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify token and get user info
    let user;
    try {
      user = await verifyToken(request);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('No token provided') || error.message.includes('Invalid token')) {
          return NextResponse.json(
            { error: error.message },
            { status: 401 }
          );
        }
      }
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // If role is not in token or seems invalid, fetch from database
    let userRole = user.role;
    if (!userRole || userRole === 'CUSTOMER' || !userRole.includes('ADMIN')) {
      const userDoc = await User.findById(user.userId).populate('role', 'name');
      if (userDoc && userDoc.role) {
        userRole = (userDoc.role as any).name;
      }
    }

    // Check if user is SUPER_ADMIN
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      );
    }
    
    const updateData = await request.json();
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid product id' },
        { status: 400 }
      );
    }

    // Validate data before updating
    if (updateData.price !== undefined && updateData.price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    if (updateData.stockCount !== undefined && updateData.stockCount < 0) {
      return NextResponse.json(
        { error: 'Stock count cannot be negative' },
        { status: 400 }
      );
    }

    if (updateData.originalPrice !== undefined && updateData.originalPrice < 0) {
      return NextResponse.json(
        { error: 'Original price cannot be negative' },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Product update error:', error);
    
    // Handle Mongoose validation errors
    if (error && typeof error === 'object' && 'name' in error) {
      if (error.name === 'ValidationError') {
        const validationError = error as any;
        // Extract the first validation error message
        const firstError = validationError.errors 
          ? Object.values(validationError.errors)[0] as any
          : null;
        const errorMessage = firstError?.message || validationError.message || 'Validation failed';
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
      
      // Handle CastError (invalid ObjectId, etc.)
      if (error.name === 'CastError') {
        return NextResponse.json(
          { error: 'Invalid data format' },
          { status: 400 }
        );
      }
    }
    
    // Handle other known error types
    if (error instanceof Error) {
      // If it's a known error with a message, return it
      if (error.message.includes('Validation failed') || error.message.includes('Stock count')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid product id' },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Product delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
