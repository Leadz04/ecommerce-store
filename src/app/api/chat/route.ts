import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ChatMessage, ChatConversation } from '@/models/ChatMessage';
import { verifyTokenOptional, verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// GET /api/chat - Get chat messages for a conversation
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await verifyTokenOptional(request);
    const userId = authResult?.userId;

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const guestEmail = searchParams.get('guestEmail');

    // Determine conversation ID
    let finalConversationId = conversationId;
    if (!finalConversationId) {
      if (userId) {
        finalConversationId = userId;
      } else if (guestEmail) {
        finalConversationId = `guest_${guestEmail}`;
      } else {
        return NextResponse.json(
          { error: 'conversationId, userId, or guestEmail required' },
          { status: 400 }
        );
      }
    }

    // Verify authorization - allow users to access their own conversations
    // Convert both to strings for comparison to handle ObjectId vs string mismatches
    if (userId && String(finalConversationId) !== String(userId)) {
      // Check if admin (admins can access any conversation)
      try {
        await requirePermission(PERMISSIONS.ORDER_VIEW_ALL)(request);
      } catch {
        return NextResponse.json(
          { error: 'Unauthorized: You can only access your own conversations' },
          { status: 403 }
        );
      }
    }

    // For authenticated users, ensure conversation exists in database
    if (userId && String(finalConversationId) === String(userId)) {
      let conversation = await ChatConversation.findOne({ conversationId: finalConversationId });
      
      if (!conversation) {
        // Get user info for conversation creation
        const { User } = await import('@/models');
        const user = await User.findById(userId).select('email').lean();
        
        // Create conversation for logged-in user if it doesn't exist
        conversation = await ChatConversation.create({
          conversationId: finalConversationId,
          userId: userId,
          guestEmail: user?.email?.toLowerCase(), // Store email for admin reference
          status: 'active',
          lastMessageAt: new Date(),
          messageCount: 0,
        });
        console.log(`✅ Created chat conversation for user: ${userId}`);
      } else {
        // Update conversation status to active if it was closed
        if (conversation.status === 'closed') {
          conversation.status = 'active';
          await conversation.save();
        }
        
        // Ensure userId is set (in case conversation was created as guest first)
        if (!conversation.userId && userId) {
          conversation.userId = userId;
          await conversation.save();
        }
      }
    }

    const messages = await ChatMessage.find({ conversationId: finalConversationId })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    // Mark messages as read if user is viewing
    if (userId || guestEmail) {
      await ChatMessage.updateMany(
        {
          conversationId: finalConversationId,
          senderType: { $ne: userId ? 'customer' : 'admin' },
          isRead: false,
        },
        {
          $set: { isRead: true, readAt: new Date() },
        }
      );
    }

    return NextResponse.json({ messages, conversationId: finalConversationId });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

// POST /api/chat - Send a chat message
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await verifyTokenOptional(request);
    const userId = authResult?.userId;

    const body = await request.json();
    const { message, conversationId, guestEmail, guestName } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Determine conversation ID
    let finalConversationId = conversationId;
    if (!finalConversationId) {
      if (userId) {
        finalConversationId = userId;
      } else if (guestEmail) {
        finalConversationId = `guest_${guestEmail}`;
      } else {
        return NextResponse.json(
          { error: 'conversationId, userId, or guestEmail required' },
          { status: 400 }
        );
      }
    }

    // Get sender info
    let senderName = guestName;
    let senderEmail = guestEmail;

    if (userId) {
      const { User } = await import('@/models');
      const user = await User.findById(userId).select('name email').lean();
      if (user) {
        senderName = user.name || user.email?.split('@')[0] || 'User';
        senderEmail = user.email;
      }
    } else {
      if (!senderName || !senderEmail) {
        return NextResponse.json(
          { error: 'Name and email required for guest users' },
          { status: 400 }
        );
      }
    }

    // Check if admin
    let isAdmin = false;
    if (userId) {
      try {
        await requirePermission(PERMISSIONS.ORDER_VIEW_ALL)(request);
        isAdmin = true;
      } catch {
        // Not admin
      }
    }

    // Create or update conversation
    let conversation = await ChatConversation.findOne({ conversationId: finalConversationId });
    if (!conversation) {
      conversation = await ChatConversation.create({
        conversationId: finalConversationId,
        userId: userId || undefined,
        guestEmail: guestEmail?.toLowerCase(),
        status: 'active',
        lastMessageAt: new Date(),
        messageCount: 0,
      });
    } else {
      conversation.lastMessageAt = new Date();
      conversation.status = 'active';
      conversation.messageCount += 1;
      await conversation.save();
    }

    // Create message
    const chatMessage = await ChatMessage.create({
      conversationId: finalConversationId,
      senderId: userId || undefined,
      senderName: senderName,
      senderEmail: senderEmail,
      senderType: isAdmin ? 'admin' : 'customer',
      message: message.trim(),
      isRead: false,
    });

    // TODO: Send notification if admin message or notify admin if customer message

    return NextResponse.json({
      message: chatMessage,
      conversation,
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

