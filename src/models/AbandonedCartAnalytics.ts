import mongoose, { Document, Schema } from 'mongoose';

export interface IAbandonedCartAnalytics extends Document {
  _id: string;
  date: Date; // Date of the analytics snapshot
  totalAbandonedCarts: number;
  totalCartValue: number; // Total value of all abandoned carts
  averageCartValue: number;
  uniqueUsers: number;
  recoveryRate: number; // Percentage of carts recovered
  recoveredCarts: number;
  recoveredValue: number;
  timeToAbandonment: {
    average: number; // Average minutes before abandonment
    median: number;
  };
  topAbandonedProducts: Array<{
    productId: string;
    productName: string;
    abandonmentCount: number;
    totalValue: number;
  }>;
  abandonmentReasons: Array<{
    reason: string;
    count: number;
  }>;
  emailSentCount: number;
  emailOpenRate: number;
  emailClickRate: number;
  emailConversionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductStatsSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  abandonmentCount: { type: Number, default: 0, min: 0 },
  totalValue: { type: Number, default: 0, min: 0 },
}, { _id: false });

const ReasonStatsSchema = new Schema({
  reason: { type: String, required: true },
  count: { type: Number, default: 0, min: 0 },
}, { _id: false });

const AbandonedCartAnalyticsSchema = new Schema<IAbandonedCartAnalytics>({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  totalAbandonedCarts: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalCartValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  averageCartValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  uniqueUsers: {
    type: Number,
    default: 0,
    min: 0,
  },
  recoveryRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  recoveredCarts: {
    type: Number,
    default: 0,
    min: 0,
  },
  recoveredValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  timeToAbandonment: {
    average: { type: Number, default: 0, min: 0 },
    median: { type: Number, default: 0, min: 0 },
  },
  topAbandonedProducts: [ProductStatsSchema],
  abandonmentReasons: [ReasonStatsSchema],
  emailSentCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  emailOpenRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  emailClickRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  emailConversionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
}, {
  timestamps: true,
});

// Indexes
AbandonedCartAnalyticsSchema.index({ date: -1 });
AbandonedCartAnalyticsSchema.index({ date: 1 }, { unique: true }); // One record per day

export default mongoose.models.AbandonedCartAnalytics || mongoose.model<IAbandonedCartAnalytics>('AbandonedCartAnalytics', AbandonedCartAnalyticsSchema);

