import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// GET /api/admin/roles - Get all roles
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.USER_MANAGE_ROLES)(request);
    await connectDB();

    const roles = await Role.find({ isActive: true })
      .sort({ name: 1 });

    return NextResponse.json({ roles });

  } catch (error) {
    console.error('Get roles error:', error);
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

// POST /api/admin/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.USER_MANAGE_ROLES)(request);
    await connectDB();

    const body = await request.json();
    const { name, description, permissions } = body;

    // Validate required fields
    if (!name || !description || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Name, description, and permissions are required' },
        { status: 400 }
      );
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ name: name.toUpperCase() });
    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // Create new role
    const newRole = new Role({
      name: name.toUpperCase(),
      description,
      permissions,
      isActive: true
    });

    await newRole.save();

    return NextResponse.json({
      message: 'Role created successfully',
      role: newRole
    }, { status: 201 });

  } catch (error) {
    console.error('Create role error:', error);
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
