import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// Import all models to ensure proper schema registration
import { User, Role } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Find user with role populated
    const user = await User.findById(decoded.userId)
      .populate('role', 'name description permissions')
      .populate('wishlist');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user permissions (from role or direct permissions)
    const permissions = user.role && (user.role as any).permissions 
      ? (user.role as any).permissions 
      : user.permissions;

    return NextResponse.json({
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        permissions: permissions || [],
        isEmailVerified: user.isEmailVerified,
        wishlist: user.wishlist || [],
        settings: user.settings || {
          emailNotifications: true,
          smsNotifications: false,
          theme: 'system',
          language: 'en'
        },
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Get update data from request body
    const updates = await request.json();
    const { name, email, phone, address, settings } = updates;
    
    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: decoded.userId } });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }
    
    // Load user, mutate fields, then save (keeps nested merges safe)
    const userDoc: any = await User.findById(decoded.userId);
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (name) userDoc.name = name;
    if (email) userDoc.email = email;
    if (phone !== undefined) userDoc.phone = phone;
    if (address) userDoc.address = { ...(userDoc.address || {}), ...address };
    if (settings) userDoc.settings = { ...(userDoc.settings || {}), ...settings };

    await userDoc.save();

    const updatedUser = await User.findById(decoded.userId)
      .populate('role', 'name description permissions')
      .populate('wishlist');
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get user permissions (from role or direct permissions)
    const permissions = updatedUser.role && (updatedUser.role as any).permissions 
      ? (updatedUser.role as any).permissions 
      : updatedUser.permissions;

    return NextResponse.json({
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        permissions: permissions || [],
        isEmailVerified: updatedUser.isEmailVerified,
        wishlist: updatedUser.wishlist || [],
        settings: updatedUser.settings || {
          emailNotifications: true,
          smsNotifications: false,
          theme: 'system',
          language: 'en'
        },
        isActive: updatedUser.isActive,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}