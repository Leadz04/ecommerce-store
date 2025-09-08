import { NextRequest, NextResponse } from 'next/server';
import { seedRoles } from '@/lib/seedRoles';
import { verifyToken } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    // Verify user has admin permissions
    const user = await verifyToken(request);
    
    if (!user.permissions.includes(PERMISSIONS.SYSTEM_SETTINGS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
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
