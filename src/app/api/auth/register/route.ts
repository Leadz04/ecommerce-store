import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Role from '@/models/Role';
import jwt from 'jsonwebtoken';
import { sendEmail, generateWelcomeEmailHTML, ADMIN_EMAIL } from '@/lib/email';

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

    // Send welcome email to customer
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const welcomeEmailHTML = generateWelcomeEmailHTML({
        name: user.name,
        email: user.email,
        siteUrl
      });
      
      await sendEmail({
        to: user.email,
        subject: 'Welcome to ShopEase! 🎉',
        html: welcomeEmailHTML,
        text: `Welcome to ShopEase, ${user.name}! Your account has been successfully created. Start shopping at ${siteUrl}/products`
      });
      console.log('✅ [API /auth/register] Welcome email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ [API /auth/register] Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    // Send admin notification
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `New User Registration: ${user.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
              New User Registration
            </h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">User Details</h3>
              <p><strong>Name:</strong> ${user.name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
              <p><strong>Role:</strong> ${customerRole.name}</p>
              <p><strong>Registered At:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `,
        text: `New user registered:\n\nName: ${user.name}\nEmail: ${user.email}\nRole: ${customerRole.name}`
      });
      console.log('✅ [API /auth/register] Admin notification sent');
    } catch (emailError) {
      console.error('❌ [API /auth/register] Failed to send admin notification:', emailError);
    }

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
