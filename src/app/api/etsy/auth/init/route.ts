import { NextRequest, NextResponse } from 'next/server';
import { getEtsyAuthUrl } from '@/lib/etsy';
import { getCurrentUserId } from '@/lib/etsy-auth-helper';

/**
 * POST /api/etsy/auth/init
 * Initialize OAuth flow with authenticated user
 * Returns the Etsy authorization URL with userId encoded in state
 */
export async function POST(request: NextRequest) {
  try {
    // Get userId from Authorization header
    const userId = await getCurrentUserId(request);
    
    // Generate auth URL with userId encoded in state
    const authUrl = await getEtsyAuthUrl(userId);
    
    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (error: any) {
    console.error('Etsy auth init error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to initiate Etsy authentication',
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
