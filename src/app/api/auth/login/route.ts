import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Role from '@/models/Role';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email with role populated
    const user = await User.findOne({ email })
      .populate('role', 'name description permissions')
      .select('+password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.isLocked()) {
      return NextResponse.json(
        { error: 'Account is temporarily locked due to too many failed login attempts' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Get user permissions (from role or direct permissions)
    const permissions = user.role && (user.role as any).permissions 
      ? (user.role as any).permissions 
      : user.permissions;

    // Generate JWT token with role and permissions
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role?.name || 'CUSTOMER',
        permissions: permissions || []
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        permissions: permissions || [],
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
