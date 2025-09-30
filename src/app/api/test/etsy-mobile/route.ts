import { NextRequest, NextResponse } from 'next/server';
import { testEtsyMobileAPI } from '@/lib/etsy-mobile-api';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting Etsy Mobile API Test...');
    
    const results = await testEtsyMobileAPI();
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    return NextResponse.json({
      success: true,
      message: `Etsy Mobile API Test Completed: ${successCount}/${totalCount} tests passed`,
      results,
      summary: {
        total: totalCount,
        passed: successCount,
        failed: totalCount - successCount,
        accessible: successCount > 0,
      },
    });

  } catch (error) {
    console.error('Etsy Mobile API Test Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
