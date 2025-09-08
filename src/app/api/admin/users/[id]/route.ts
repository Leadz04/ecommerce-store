import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Role from '@/models/Role';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// GET /api/admin/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.USER_VIEW)(request);
    await connectDB();

    const { id } = await context.params;
    const targetUser = await User.findById(id)
      .populate('role', 'name description permissions')
      .select('-password');

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: targetUser });

  } catch (error) {
    console.error('Get user error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.USER_UPDATE)(request);
    await connectDB();

    const { id } = await context.params;
    const body = await request.json();
    const { name, email, roleId, isActive, settings, phone, address } = body;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent users from modifying their own role (security measure)
    if (roleId && id === user.userId) {
      return NextResponse.json(
        { error: 'Cannot modify your own role' },
        { status: 400 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== targetUser.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Update user fields
    if (name) targetUser.name = name;
    if (email) targetUser.email = email;
    if (phone !== undefined) targetUser.phone = phone;
    if (typeof isActive === 'boolean') targetUser.isActive = isActive;
    if (settings) targetUser.settings = { ...targetUser.settings, ...settings };
    if (address) targetUser.address = { ...targetUser.address, ...address };

    // Update role if provided
    if (roleId) {
      const role = await Role.findById(roleId);
      if (!role) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
      targetUser.role = roleId;
      targetUser.permissions = role.permissions;
    }

    await targetUser.save();

    // Return updated user
    const updatedUser = await User.findById(id)
      .populate('role', 'name description permissions')
      .select('-password');

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.USER_DELETE)(request);
    await connectDB();

    const { id } = await context.params;

    // Prevent deleting yourself
    if (id === user.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
