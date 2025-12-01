import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ChatConversation, ChatMessage } from '@/models/ChatMessage';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// GET /api/admin/chat/conversations - Get all chat conversations (admin only)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await verifyToken(request);
    await requirePermission(PERMISSIONS.ORDER_VIEW_ALL)(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const searchTerm = searchParams.get('searchTerm');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (assignedTo && assignedTo !== 'all') {
      if (assignedTo === 'unassigned') {
        query.assignedTo = { $exists: false };
      } else {
        query.assignedTo = assignedTo;
      }
    }
    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, 'i');
      query.$or = [
        { conversationId: searchRegex },
        { guestEmail: searchRegex },
      ];
    }

    const conversations = await ChatConversation.find(query)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get unread message counts for each conversation
    const conversationIds = conversations.map(c => c.conversationId);
    const unreadCounts = await ChatMessage.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          senderType: 'customer',
          isRead: false,
        },
      },
      {
        $group: {
          _id: '$conversationId',
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadMap = new Map(
      unreadCounts.map((item: any) => [item._id, item.count])
    );

    // Get last message for each conversation
    const lastMessages = await ChatMessage.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
        },
      },
    ]);

    const lastMessageMap = new Map(
      lastMessages.map((item: any) => [item._id, item.lastMessage])
    );

    // Enrich conversations with unread counts and last messages
    const enrichedConversations = conversations.map((conv: any) => ({
      ...conv,
      unreadCount: unreadMap.get(conv.conversationId) || 0,
      lastMessage: lastMessageMap.get(conv.conversationId) || null,
    }));

    const total = await ChatConversation.countDocuments(query);

    return NextResponse.json({
      conversations: enrichedConversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching chat conversations:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch chat conversations' },
      { status: 500 }
    );
  }
}

