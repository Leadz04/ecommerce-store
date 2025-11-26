import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomerAnalytics extends Document {
  _id: string;
  userId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  firstOrderDate?: Date;
  favoriteCategories: Array<{
    category: string;
    count: number;
    totalSpent: number;
  }>;
  favoriteProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    totalSpent: number;
  }>;
  cartAbandonmentRate: number;
  returnRate: number;
  lifetimeValue: number;
  customerSegment: 'new' | 'regular' | 'vip' | 'at-risk';
  lastActivityDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CategoryStatsSchema = new Schema({
  category: { type: String, required: true },
  count: { type: Number, default: 0, min: 0 },
  totalSpent: { type: Number, default: 0, min: 0 },
}, { _id: false });

const ProductStatsSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, default: 0, min: 0 },
  totalSpent: { type: Number, default: 0, min: 0 },
}, { _id: false });

const CustomerAnalyticsSchema = new Schema<ICustomerAnalytics>({
  userId: {
    type: String,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0,
  },
  averageOrderValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastOrderDate: Date,
  firstOrderDate: Date,
  favoriteCategories: [CategoryStatsSchema],
  favoriteProducts: [ProductStatsSchema],
  cartAbandonmentRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  returnRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  lifetimeValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  customerSegment: {
    type: String,
    enum: ['new', 'regular', 'vip', 'at-risk'],
    default: 'new',
    index: true,
  },
  lastActivityDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes
CustomerAnalyticsSchema.index({ customerSegment: 1, totalSpent: -1 });
CustomerAnalyticsSchema.index({ lastActivityDate: -1 });

export default mongoose.models.CustomerAnalytics || mongoose.model<ICustomerAnalytics>('CustomerAnalytics', CustomerAnalyticsSchema);

