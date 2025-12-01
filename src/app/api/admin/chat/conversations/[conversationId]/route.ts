import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ChatConversation, ChatMessage } from '@/models/ChatMessage';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// GET /api/admin/chat/conversations/[conversationId] - Get conversation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    await connectDB();
    await verifyToken(request);
    await requirePermission(PERMISSIONS.ORDER_VIEW_ALL)(request);

    const { conversationId } = await params;
    const conversation = await ChatConversation.findOne({ conversationId }).lean();
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get user information if userId exists
    let userInfo = null;
    if (conversation.userId) {
      const { User } = await import('@/models');
      const user = await User.findById(conversation.userId).select('name email phone').lean();
      if (user) {
        userInfo = {
          name: user.name,
          email: user.email,
          phone: user.phone,
        };
      }
    }

    const messages = await ChatMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      conversation: {
        ...conversation,
        userInfo,
      },
      messages,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/chat/conversations/[conversationId] - Update conversation (assign, status, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    await connectDB();
    const authResult = await verifyToken(request);
    await requirePermission(PERMISSIONS.ORDER_VIEW_ALL)(request);

    const { conversationId } = await params;
    const body = await request.json();
    const { status, assignedTo } = body;

    const conversation = await ChatConversation.findOne({ conversationId });
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (status) {
      conversation.status = status;
    }
    if (assignedTo !== undefined) {
      conversation.assignedTo = assignedTo || undefined;
    }

    await conversation.save();

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

