import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Role from '@/models/Role';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { applyDeduplication } from '@/lib/deduplication';

// GET /api/admin/users - Get all users with pagination and filtering
export async function GET(request: NextRequest) {
  console.log('[API /admin/users] GET request received');
  try {
    console.log('[API /admin/users] Verifying permissions...');
    const user = await requirePermission(PERMISSIONS.USER_VIEW)(request);
    console.log('[API /admin/users] Permission verified, connecting to database...');
    await connectDB();
    console.log('[API /admin/users] Database connected');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    console.log('[API /admin/users] Query params:', { page, limit, search, role, status });

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

    console.log('[API /admin/users] Executing query:', JSON.stringify(query));

    // Get users with pagination
    const skip = (page - 1) * limit;
    const usersRaw = await User.find(query)
      .populate('role', 'name description')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log('[API /admin/users] Found', usersRaw.length, 'users (before deduplication)');
    
    // Check for null roles
    const usersWithNullRoles = usersRaw.filter(u => !u.role);
    if (usersWithNullRoles.length > 0) {
      console.warn('[API /admin/users] WARNING:', usersWithNullRoles.length, 'users have null roles');
      console.warn('[API /admin/users] Users with null roles:', usersWithNullRoles.map(u => ({ id: u._id, email: u.email })));
    }

    // Apply deduplication to ensure unique users
    const users = applyDeduplication(usersRaw, 'users');

    console.log('[API /admin/users] After deduplication:', users.length, 'users');

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    console.log('[API /admin/users] Success - Returning', users.length, 'users');

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
    console.error('❌ [API /admin/users] Get users error:', error);
    if (error instanceof Error) {
      console.error('[API /admin/users] Error message:', error.message);
      console.error('[API /admin/users] Error stack:', error.stack);
    }
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

    // Send welcome email to new admin user
    try {
      const { sendEmail, generateAdminUserCreatedEmailHTML, ADMIN_EMAIL } = await import('@/lib/email');
      const creator = await User.findById(user.userId).select('name email').lean();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      
      const adminEmailHTML = generateAdminUserCreatedEmailHTML({
        userName: newUser.name,
        userEmail: newUser.email,
        roleName: role.name,
        createdBy: creator?.name || 'Administrator',
        siteUrl
      });
      
      await sendEmail({
        to: newUser.email,
        subject: 'Your ShopEase Admin Account Has Been Created',
        html: adminEmailHTML,
        text: `Your ShopEase admin account has been created with ${role.name} role. Login at ${siteUrl}/login`
      });
      console.log('✅ [API /admin/users] Welcome email sent to new admin user');
      
      // Also send notification to super admin
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `New Admin User Created: ${newUser.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
              New Admin User Created
            </h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">User Details</h3>
              <p><strong>Name:</strong> ${newUser.name}</p>
              <p><strong>Email:</strong> ${newUser.email}</p>
              <p><strong>Role:</strong> ${role.name}</p>
              <p><strong>Created By:</strong> ${creator?.name || 'Administrator'}</p>
              <p><strong>Created At:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `,
        text: `New admin user created:\n\nName: ${newUser.name}\nEmail: ${newUser.email}\nRole: ${role.name}\nCreated By: ${creator?.name || 'Administrator'}`
      });
    } catch (emailError) {
      console.error('❌ [API /admin/users] Failed to send admin user creation emails:', emailError);
      // Don't fail user creation if email fails
    }

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
