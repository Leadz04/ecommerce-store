import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITicketMessage extends Document {
  _id: Types.ObjectId;
  senderId?: string; // User ID (for customers) or null (for admin)
  senderName: string;
  senderEmail?: string;
  senderType: 'customer' | 'admin' | 'system';
  message: string;
  attachments?: Array<{
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupportTicket extends Document {
  _id: Types.ObjectId;
  ticketNumber: string; // Unique ticket number (e.g., TKT-123456)
  userId?: string; // Optional for guest tickets
  guestEmail?: string; // Email for guest tickets
  subject: string;
  category: 'order' | 'product' | 'payment' | 'shipping' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  messages: ITicketMessage[];
  assignedTo?: string; // Admin user ID
  orderId?: string; // Related order ID if applicable
  productId?: string; // Related product ID if applicable
  tags?: string[];
  metadata?: Record<string, any>;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema = new Schema<ITicketMessage>({
  senderId: { type: String, ref: 'User', required: false },
  senderName: { type: String, required: true, trim: true, maxlength: 100 },
  senderEmail: { type: String, required: false, trim: true, lowercase: true },
  senderType: { type: String, enum: ['customer', 'admin', 'system'], required: true, default: 'customer' },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  attachments: [{
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
  }],
}, { timestamps: true });

const SupportTicketSchema = new Schema<ISupportTicket>({
  ticketNumber: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    ref: 'User',
    required: false,
    index: true,
  },
  guestEmail: {
    type: String,
    required: false,
    index: true,
    lowercase: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  category: {
    type: String,
    enum: ['order', 'product', 'payment', 'shipping', 'technical', 'other'],
    required: true,
    default: 'other',
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    required: true,
    default: 'medium',
    index: true,
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'],
    required: true,
    default: 'open',
    index: true,
  },
  messages: [TicketMessageSchema],
  assignedTo: {
    type: String,
    ref: 'User',
    required: false,
    index: true,
  },
  orderId: {
    type: String,
    ref: 'Order',
    required: false,
  },
  productId: {
    type: String,
    ref: 'Product',
    required: false,
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50,
  }],
  metadata: {
    type: Schema.Types.Mixed,
  },
  resolvedAt: {
    type: Date,
  },
  closedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Generate ticket number before saving
SupportTicketSchema.pre('save', function(next) {
  if (!this.ticketNumber) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.ticketNumber = `TKT-${timestamp}-${random}`;
  }
  next();
});

// Indexes for efficient queries
SupportTicketSchema.index({ userId: 1, status: 1, createdAt: -1 });
SupportTicketSchema.index({ guestEmail: 1, status: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
SupportTicketSchema.index({ assignedTo: 1, status: 1 });
SupportTicketSchema.index({ category: 1, status: 1 });

export default mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

