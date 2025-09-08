import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';
import User from '@/models/User';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// GET /api/admin/roles/[id] - Get specific role
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.USER_MANAGE_ROLES)(request);
    await connectDB();

    const { id } = await context.params;
    const role = await Role.findById(id);

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ role });

  } catch (error) {
    console.error('Get role error:', error);
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

// PUT /api/admin/roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.USER_MANAGE_ROLES)(request);
    await connectDB();

    const { id } = await context.params;
    const body = await request.json();
    const { name, description, permissions, isActive } = body;

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Prevent modification of system roles (optional security measure)
    const systemRoles = ['SUPER_ADMIN', 'CUSTOMER'];
    if (systemRoles.includes(role.name) && name !== role.name) {
      return NextResponse.json(
        { error: 'Cannot modify system role name' },
        { status: 400 }
      );
    }

    // Check if new name conflicts with existing role
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ name: name.toUpperCase(), _id: { $ne: id } });
      if (existingRole) {
        return NextResponse.json(
          { error: 'Role with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update role fields
    if (name) role.name = name.toUpperCase();
    if (description) role.description = description;
    if (permissions) role.permissions = permissions;
    if (typeof isActive === 'boolean') role.isActive = isActive;

    await role.save();

    // Update all users with this role to have the new permissions
    await User.updateMany(
      { role: role._id },
      { permissions: role.permissions }
    );

    return NextResponse.json({
      message: 'Role updated successfully',
      role
    });

  } catch (error) {
    console.error('Update role error:', error);
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

// DELETE /api/admin/roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.USER_MANAGE_ROLES)(request);
    await connectDB();

    const { id } = await context.params;

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of system roles
    const systemRoles = ['SUPER_ADMIN', 'CUSTOMER'];
    if (systemRoles.includes(role.name)) {
      return NextResponse.json(
        { error: 'Cannot delete system roles' },
        { status: 400 }
      );
    }

    // Check if any users are using this role
    const usersWithRole = await User.countDocuments({ role: role._id });
    if (usersWithRole > 0) {
      return NextResponse.json(
        { error: `Cannot delete role. ${usersWithRole} user(s) are currently using this role.` },
        { status: 400 }
      );
    }

    await Role.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Role deleted successfully'
    });

  } catch (error) {
    console.error('Delete role error:', error);
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
