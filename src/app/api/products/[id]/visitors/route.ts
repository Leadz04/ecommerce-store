import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ProductView, Product } from '@/models';
import { isValidObjectId } from 'mongoose';

// In-memory store for tracking active visitors
// Format: Map<productId, Set<sessionId>>
const activeVisitors = new Map<string, Set<string>>();

// Clean up inactive sessions (older than 30 seconds)
const SESSION_TIMEOUT = 30000; // 30 seconds
const sessionTimestamps = new Map<string, number>(); // sessionId -> timestamp

// Cleanup function to remove stale sessions
function cleanupStaleSessions() {
  const now = Date.now();
  for (const [sessionId, timestamp] of sessionTimestamps.entries()) {
    if (now - timestamp > SESSION_TIMEOUT) {
      // Remove this session from all products
      for (const [productId, sessions] of activeVisitors.entries()) {
        sessions.delete(sessionId);
        if (sessions.size === 0) {
          activeVisitors.delete(productId);
        }
      }
      sessionTimestamps.delete(sessionId);
    }
  }
}

// Run cleanup every 10 seconds
setInterval(cleanupStaleSessions, 10000);

// Generate a unique session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;
    const body = await request.json();
    const { action, sessionId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    let currentSessionId = sessionId;

    // If no session ID provided, generate one
    if (!currentSessionId) {
      currentSessionId = generateSessionId();
    }

    // Update session timestamp
    sessionTimestamps.set(currentSessionId, Date.now());

    if (action === 'join') {
      // Add visitor to product
      if (!activeVisitors.has(productId)) {
        activeVisitors.set(productId, new Set());
      }
      
      const wasNewVisitor = !activeVisitors.get(productId)!.has(currentSessionId);
      activeVisitors.get(productId)!.add(currentSessionId);
      
      // Save view to database if this is a new visitor
      if (wasNewVisitor && isValidObjectId(productId)) {
        try {
          await connectDB();
          
          // Check if this session has already viewed this product (to avoid duplicate views)
          const existingView = await ProductView.findOne({
            productId,
            sessionId: currentSessionId
          });
          
          if (!existingView) {
            // Get IP and user agent from request
            const ipAddress = request.headers.get('x-forwarded-for') || 
                            request.headers.get('x-real-ip') || 
                            'unknown';
            const userAgent = request.headers.get('user-agent') || 'unknown';
            
            // Create new view record
            const viewRecord = await ProductView.create({
              productId,
              sessionId: currentSessionId,
              ipAddress: ipAddress.split(',')[0].trim(), // Get first IP if multiple
              userAgent,
              viewedAt: new Date()
            });
            
            // Increment product's totalViews counter
            // Use upsert: false to ensure we only update existing products
            const updateResult = await Product.findByIdAndUpdate(
              productId,
              { 
                $inc: { totalViews: 1 },
                $setOnInsert: { totalViews: 1 } // Set to 1 if field doesn't exist (though $inc should handle this)
              },
              { new: true, upsert: false }
            );
            
            if (!updateResult) {
              console.warn(`[Product View] Product ${productId} not found when trying to increment totalViews`);
            } else {
              console.log(`[Product View] Saved view for product ${productId}. View ID: ${viewRecord._id}, New totalViews: ${updateResult.totalViews || 0}`);
            }
          } else {
            console.log(`[Product View] Duplicate view prevented for product ${productId}, session ${currentSessionId}`);
          }
        } catch (dbError) {
          // Log detailed error but don't fail the request
          console.error('[Product View] Error saving product view:', {
            productId,
            sessionId: currentSessionId,
            error: dbError instanceof Error ? dbError.message : String(dbError),
            stack: dbError instanceof Error ? dbError.stack : undefined
          });
        }
      } else if (!isValidObjectId(productId)) {
        console.warn(`[Product View] Invalid productId format: ${productId}`);
      }
    } else if (action === 'leave') {
      // Remove visitor from product
      const sessions = activeVisitors.get(productId);
      if (sessions) {
        sessions.delete(currentSessionId);
        if (sessions.size === 0) {
          activeVisitors.delete(productId);
        }
      }
      sessionTimestamps.delete(currentSessionId);
    } else if (action === 'heartbeat') {
      // Just update timestamp, keep session alive
      // Already updated above
    }

    const count = activeVisitors.get(productId)?.size || 0;

    return NextResponse.json({
      success: true,
      count,
      sessionId: currentSessionId
    });

  } catch (error) {
    console.error('Visitor tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Clean up stale sessions before returning count
    cleanupStaleSessions();

    const count = activeVisitors.get(productId)?.size || 0;

    return NextResponse.json({
      count,
      productId
    });

  } catch (error) {
    console.error('Visitor count error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

