import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Role from '@/models/Role';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  console.log('[API /auth/register] Registration attempt received');
  try {
    console.log('[API /auth/register] Connecting to database...');
    await connectDB();
    console.log('[API /auth/register] Database connected');
    
    const { name, email, password, phone } = await request.json();
    console.log('[API /auth/register] Attempting registration for email:', email);

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Get CUSTOMER role (default for new users)
    console.log('[API /auth/register] Looking for CUSTOMER role...');
    let customerRole = await Role.findOne({ name: 'CUSTOMER' });
    
    // If CUSTOMER role doesn't exist, create it
    if (!customerRole) {
      console.log('[API /auth/register] CUSTOMER role not found, creating it...');
      customerRole = new Role({
        name: 'CUSTOMER',
        description: 'Customer access with limited permissions',
        permissions: ['order:view'], // Basic permission for customers
        isActive: true
      });
      await customerRole.save();
      console.log('✅ [API /auth/register] CUSTOMER role created successfully');
    } else {
      console.log('[API /auth/register] CUSTOMER role found:', customerRole._id);
    }

    // Create new user with CUSTOMER role
    const user = new User({
      name,
      email,
      password,
      phone,
      role: customerRole._id,
      permissions: customerRole.permissions,
      isActive: true,
      settings: {
        emailNotifications: true,
        smsNotifications: false,
        theme: 'system',
        language: 'en'
      }
    });

    console.log('[API /auth/register] Saving new user...');
    await user.save();
    console.log('✅ [API /auth/register] User saved successfully');

    // Get user with populated role for response
    const userWithRole = await User.findById(user._id)
      .populate('role', 'name description permissions');

    // Generate JWT token with role and permissions
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: customerRole.name,
        permissions: customerRole.permissions
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: userWithRole?.role || customerRole,
        permissions: customerRole.permissions,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [API /auth/register] Registration error:', error);
    if (error instanceof Error) {
      console.error('[API /auth/register] Error message:', error.message);
      console.error('[API /auth/register] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
