import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import { verifyTokenOptional, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { Types } from 'mongoose';

// GET /api/support/tickets - Get user's support tickets (or all tickets if admin)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await verifyTokenOptional(request);
    const userId = authResult?.userId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Check if user is admin
    let isAdmin = false;
    if (userId) {
      try {
        await requirePermission(PERMISSIONS.ORDER_VIEW_ALL)(request);
        isAdmin = true;
      } catch {
        // Not admin
      }
    }

    // Build query
    const query: any = {};
    
    if (isAdmin) {
      // Admin can see all tickets, optionally filter by assignedTo
      if (assignedTo && assignedTo !== 'all') {
        if (assignedTo === 'unassigned') {
          query.assignedTo = { $exists: false };
        } else {
          query.assignedTo = assignedTo;
        }
      }
    } else {
      // Regular users can only see their own tickets
      if (userId) {
        query.userId = userId;
      } else {
        // For guest users, require email
        const guestEmail = searchParams.get('guestEmail');
        if (!guestEmail) {
          return NextResponse.json(
            { error: 'Authentication or guest email required' },
            { status: 401 }
          );
        }
        query.guestEmail = guestEmail.toLowerCase();
      }
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Search functionality (for admin)
    if (search && search.trim()) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { 'messages.message': { $regex: search, $options: 'i' } },
      ];
    }

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await SupportTicket.countDocuments(query);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      isAdmin,
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

// POST /api/support/tickets - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await verifyTokenOptional(request);
    const userId = authResult?.userId;

    const body = await request.json();
    const {
      subject,
      category = 'other',
      priority = 'medium',
      message,
      guestEmail,
      guestName,
      orderId,
      productId,
      tags,
    } = body;

    // Validation
    if (!subject || subject.trim().length === 0) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    let finalUserId = userId;
    let finalGuestEmail = guestEmail;
    let finalGuestName = guestName;

    // Get user info if authenticated
    if (userId) {
      const { User } = await import('@/models');
      const user = await User.findById(userId).select('name email').lean();
      if (user) {
        finalGuestName = user.name || user.email?.split('@')[0] || 'User';
        finalGuestEmail = user.email;
      }
    } else {
      // For guest users, email and name are required
      if (!finalGuestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalGuestEmail)) {
        return NextResponse.json(
          { error: 'Valid email is required for guest tickets' },
          { status: 400 }
        );
      }
      if (!finalGuestName || finalGuestName.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name is required for guest tickets' },
          { status: 400 }
        );
      }
    }

    // Generate unique ticket number
    const generateTicketNumber = (): string => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      return `TKT-${timestamp}-${random}`;
    };

    let ticketNumber = generateTicketNumber();
    
    // Ensure uniqueness (retry if collision, though very unlikely)
    let attempts = 0;
    while (attempts < 5) {
      const existing = await SupportTicket.findOne({ ticketNumber });
      if (!existing) break;
      ticketNumber = generateTicketNumber();
      attempts++;
    }

    // Create ticket with initial message
    const ticketData: any = {
      ticketNumber,
      userId: finalUserId || undefined,
      guestEmail: finalGuestEmail?.toLowerCase(),
      subject: subject.trim(),
      category,
      priority,
      status: 'open',
      orderId: orderId || undefined,
      productId: productId || undefined,
      tags: tags || [],
      messages: [{
        senderId: finalUserId || undefined,
        senderName: finalGuestName,
        senderEmail: finalGuestEmail,
        senderType: 'customer',
        message: message.trim(),
      }],
    };
    
    const ticket = await SupportTicket.create(ticketData);

    // TODO: Send notification email to support team

    return NextResponse.json(
      { ticket, message: 'Support ticket created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

