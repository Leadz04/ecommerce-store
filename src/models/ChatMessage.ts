import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  conversationId: string; // Unique conversation identifier (userId or sessionId)
  senderId?: string; // User ID (for authenticated users) or null (for guests)
  senderName: string;
  senderEmail?: string;
  senderType: 'customer' | 'admin' | 'bot';
  message: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatConversation extends Document {
  _id: Types.ObjectId;
  conversationId: string; // Unique identifier (userId or sessionId)
  userId?: string; // User ID if authenticated
  guestEmail?: string; // Email if guest
  status: 'active' | 'waiting' | 'closed';
  assignedTo?: string; // Admin user ID
  lastMessageAt: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: {
    type: String,
    ref: 'User',
    required: false,
    index: true,
  },
  senderName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  senderEmail: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
  },
  senderType: {
    type: String,
    enum: ['customer', 'admin', 'bot'],
    required: true,
    default: 'customer',
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

const ChatConversationSchema = new Schema<IChatConversation>({
  conversationId: {
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
  status: {
    type: String,
    enum: ['active', 'waiting', 'closed'],
    required: true,
    default: 'active',
    index: true,
  },
  assignedTo: {
    type: String,
    ref: 'User',
    required: false,
    index: true,
  },
  lastMessageAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  messageCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

// Indexes
ChatMessageSchema.index({ conversationId: 1, createdAt: -1 });
ChatConversationSchema.index({ userId: 1, status: 1, lastMessageAt: -1 });
ChatConversationSchema.index({ guestEmail: 1, status: 1, lastMessageAt: -1 });
ChatConversationSchema.index({ assignedTo: 1, status: 1 });

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export const ChatConversation = mongoose.models.ChatConversation || mongoose.model<IChatConversation>('ChatConversation', ChatConversationSchema);

