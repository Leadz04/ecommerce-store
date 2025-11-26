import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import { verifyTokenOptional, verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// POST /api/support/tickets/[id]/messages - Add message to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const authResult = await verifyTokenOptional(request);
    const userId = authResult?.userId;

    const body = await request.json();
    const { message, guestEmail, guestName } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const isOwner = (userId && ticket.userId === userId) || 
                    (!userId && ticket.guestEmail && guestEmail === ticket.guestEmail);
    
    let isAdmin = false;
    if (userId) {
      try {
        await requirePermission(PERMISSIONS.ORDER_VIEW_ALL)(request);
        isAdmin = true;
      } catch {
        // Not admin
      }
    }

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
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
    }

    // Add message
    ticket.messages.push({
      senderId: userId || undefined,
      senderName: senderName || 'User',
      senderEmail: senderEmail,
      senderType: isAdmin ? 'admin' : 'customer',
      message: message.trim(),
    });

    // Update ticket status
    if (ticket.status === 'waiting_customer' && isAdmin) {
      ticket.status = 'in_progress';
    } else if (ticket.status === 'in_progress' && !isAdmin) {
      ticket.status = 'waiting_customer';
    } else if (ticket.status === 'closed') {
      ticket.status = 'open'; // Reopen if customer/admin responds
    }

    await ticket.save();

    // TODO: Send email notification

    return NextResponse.json({
      ticket,
      message: 'Message added successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}

