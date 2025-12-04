import { NextRequest, NextResponse } from 'next/server';
import { seedRoles } from '@/lib/seedRoles';
import { verifyToken } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    // Verify user has admin permissions (either SYSTEM_SETTINGS or is ADMIN/SUPER_ADMIN role)
    const user = await verifyToken(request);
    
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    const hasSystemSettings = user.permissions.includes(PERMISSIONS.SYSTEM_SETTINGS);
    
    if (!isAdmin && !hasSystemSettings) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      );
    }

    await seedRoles();
    
    return NextResponse.json({
      message: 'Roles and permissions seeded successfully'
    });

  } catch (error) {
    console.error('Seed roles error:', error);
    return NextResponse.json(
      { error: 'Failed to seed roles and permissions' },
      { status: 500 }
    );
  }
}
