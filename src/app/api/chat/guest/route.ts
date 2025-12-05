import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ChatConversation } from '@/models/ChatMessage';

// POST /api/chat/guest - Check or create guest user for chat
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    const conversationId = `guest_${normalizedEmail}`;

    // Check if conversation already exists for this guest email
    let conversation = await ChatConversation.findOne({ 
      $or: [
        { conversationId },
        { guestEmail: normalizedEmail }
      ]
    });

    if (conversation) {
      // Update conversation if needed
      if (conversation.status === 'closed') {
        conversation.status = 'active';
        await conversation.save();
      }
      
      // Ensure guestEmail is set
      if (!conversation.guestEmail) {
        conversation.guestEmail = normalizedEmail;
        await conversation.save();
      }

      return NextResponse.json({
        success: true,
        conversationId: conversation.conversationId,
        guestEmail: normalizedEmail,
        guestName: name,
        exists: true
      });
    }

    // Create new guest conversation
    conversation = await ChatConversation.create({
      conversationId,
      guestEmail: normalizedEmail,
      status: 'active',
      lastMessageAt: new Date(),
      messageCount: 0,
    });

    console.log(`✅ Created guest chat conversation for: ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      conversationId: conversation.conversationId,
      guestEmail: normalizedEmail,
      guestName: name,
      exists: false
    });

  } catch (error) {
    console.error('Error in guest chat setup:', error);
    return NextResponse.json(
      { error: 'Failed to setup guest chat' },
      { status: 500 }
    );
  }
}
