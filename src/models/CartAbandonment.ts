import mongoose, { Document, Schema } from 'mongoose';

export interface ICartAbandonment extends Document {
  _id: string;
  userId?: string; // Optional for guest users
  userEmail?: string; // Email for guest users or backup for authenticated users
  sessionId?: string; // Browser session ID
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    image: string;
    size?: string;
    color?: string;
  }>;
  subtotal: number;
  total: number;
  lastActivityAt: Date; // Last time cart was updated
  emailSent: boolean; // Whether recovery email was sent
  emailSentAt?: Date; // When recovery email was sent
  recovered: boolean; // Whether cart was recovered (converted to order)
  recoveredAt?: Date; // When cart was recovered
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema({
  productId: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    required: true,
  },
  size: String,
  color: String,
}, { _id: false });

const CartAbandonmentSchema = new Schema<ICartAbandonment>(
  {
    userId: {
      type: String,
      ref: 'User',
      index: true,
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    items: [CartItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    emailSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailSentAt: Date,
    recovered: {
      type: Boolean,
      default: false,
      index: true,
    },
    recoveredAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
CartAbandonmentSchema.index({ userId: 1, emailSent: 1, recovered: 1 });
CartAbandonmentSchema.index({ userEmail: 1, emailSent: 1, recovered: 1 });
CartAbandonmentSchema.index({ lastActivityAt: 1, emailSent: 1, recovered: 1 });

export default mongoose.models.CartAbandonment || mongoose.model<ICartAbandonment>('CartAbandonment', CartAbandonmentSchema);

