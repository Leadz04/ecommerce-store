import mongoose, { Document, Schema } from 'mongoose';

export interface IStockNotification extends Document {
  _id: string;
  productId: string;
  productName: string;
  productImage: string;
  userId?: string; // Optional for guest users
  userEmail: string; // Required email for notification
  notified: boolean; // Whether notification email was sent
  notifiedAt?: Date; // When notification was sent
  createdAt: Date;
  updatedAt: Date;
}

const StockNotificationSchema = new Schema<IStockNotification>({
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
    required: [true, 'Email is required for stock notifications'],
    trim: true,
    lowercase: true,
    index: true,
  },
  notified: {
    type: Boolean,
    default: false,
    index: true,
  },
  notifiedAt: Date,
}, {
  timestamps: true,
});

// Compound index to prevent duplicate notifications
StockNotificationSchema.index({ productId: 1, userEmail: 1 }, { unique: true });
StockNotificationSchema.index({ productId: 1, notified: 1 });
StockNotificationSchema.index({ userId: 1, notified: 1 });

export default mongoose.models.StockNotification || mongoose.model<IStockNotification>('StockNotification', StockNotificationSchema);

