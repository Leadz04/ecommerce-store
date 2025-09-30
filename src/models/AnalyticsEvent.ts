import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  type: 'product_view' | 'add_to_cart' | 'checkout_start' | 'purchase' | 'page_view';
  userId?: string;
  sessionId?: string;
  productId?: string;
  orderId?: string;
  value?: number; // revenue for purchase
  currency?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>({
  type: { type: String, required: true },
  userId: { type: String, index: true },
  sessionId: { type: String, index: true },
  productId: { type: String, index: true },
  orderId: { type: String, index: true },
  value: Number,
  currency: { type: String, default: 'USD' },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });

AnalyticsEventSchema.index({ type: 1, createdAt: -1 });

export default mongoose.models.AnalyticsEvent || mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);


