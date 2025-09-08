import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Role from '@/models/Role';
import jwt from 'jsonwebtoken';

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
