import mongoose, { Document, Schema } from 'mongoose';

export interface IPriceAlert extends Document {
  _id: string;
  productId: string;
  productName: string;
  productImage: string;
  userId?: string; // Optional for guest users
  userEmail: string; // Required email for notification
  targetPrice: number; // Price threshold to trigger alert
  currentPrice: number; // Price when alert was created
  notified: boolean; // Whether notification email was sent
  notifiedAt?: Date; // When notification was sent
  isActive: boolean; // Whether alert is still active
  createdAt: Date;
  updatedAt: Date;
}

const PriceAlertSchema = new Schema<IPriceAlert>({
  productId: {
    type: String,
    ref: 'Product',
    required: true,
    index: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productImage: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    ref: 'User',
    index: true,
  },
  userEmail: {
    type: String,
    required: [true, 'Email is required for price alerts'],
    trim: true,
    lowercase: true,
    index: true,
  },
  targetPrice: {
    type: Number,
    required: [true, 'Target price is required'],
    min: [0, 'Target price cannot be negative'],
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  notified: {
    type: Boolean,
    default: false,
    index: true,
  },
  notifiedAt: Date,
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicate alerts
PriceAlertSchema.index({ productId: 1, userEmail: 1 }, { unique: true });
PriceAlertSchema.index({ productId: 1, isActive: 1, notified: 1 });
PriceAlertSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.PriceAlert || mongoose.model<IPriceAlert>('PriceAlert', PriceAlertSchema);

