import { NextRequest, NextResponse } from 'next/server';
import { seedRoles } from '@/lib/seedRoles';

export async function POST(request: NextRequest) {
  try {
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
