import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Role from '@/models/Role';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { applyDeduplication } from '@/lib/deduplication';

// GET /api/admin/users - Get all users with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.USER_VIEW)(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (roleDoc) {
        query.role = roleDoc._id;
      }
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Get users with pagination
    const skip = (page - 1) * limit;
    const usersRaw = await User.find(query)
      .populate('role', 'name description')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Apply deduplication to ensure unique users
    const users = applyDeduplication(usersRaw, 'users');

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('Invalid token')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.USER_CREATE)(request);
    await connectDB();

    const body = await request.json();
    const { name, email, password, roleId, isActive = true } = body;

    // Validate required fields
    if (!name || !email || !password || !roleId) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
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

    // Get role and its permissions
    const role = await Role.findById(roleId);
    if (!role) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      role: roleId,
      permissions: role.permissions,
      isActive,
      isEmailVerified: true, // Admin created users are auto-verified
      settings: {
        emailNotifications: true,
        smsNotifications: false,
        theme: 'system',
        language: 'en'
      }
    });

    await newUser.save();

    // Return user without password
    const userResponse = await User.findById(newUser._id)
      .populate('role', 'name description')
      .select('-password');

    return NextResponse.json({
      message: 'User created successfully',
      user: userResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('Invalid token')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
