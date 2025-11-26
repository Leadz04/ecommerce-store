import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import { verifyTokenOptional, verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// GET /api/support/tickets/[id] - Get ticket details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const authResult = await verifyTokenOptional(request);
    const userId = authResult?.userId;

    const ticket = await SupportTicket.findById(id).lean();

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const isOwner = (userId && ticket.userId === userId) || 
                    (!userId && ticket.guestEmail && request.headers.get('x-guest-email') === ticket.guestEmail);
    
    // Admin can view any ticket
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

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

// PUT /api/support/tickets/[id] - Update ticket (admin only for most fields)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const authResult = await verifyTokenOptional(request);
    const userId = authResult?.userId;

    const body = await request.json();
    const { status, priority, assignedTo, tags } = body;

    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if user can update (owner can only update status to closed, admin can update all)
    const isOwner = (userId && ticket.userId === userId);
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

    // Update fields
    if (status && (isAdmin || status === 'closed')) {
      ticket.status = status;
      if (status === 'resolved' || status === 'closed') {
        ticket.resolvedAt = new Date();
        if (status === 'closed') {
          ticket.closedAt = new Date();
        }
      }
    }

    if (priority && isAdmin) {
      ticket.priority = priority;
    }

    if (assignedTo !== undefined && isAdmin) {
      ticket.assignedTo = assignedTo || undefined;
    }

    if (tags && isAdmin) {
      ticket.tags = tags;
    }

    await ticket.save();

    return NextResponse.json({ ticket, message: 'Ticket updated successfully' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

