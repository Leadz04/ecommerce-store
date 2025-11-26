import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchaseAnalytics extends Document {
  _id: string;
  date: Date; // Date of the analytics snapshot
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
  uniqueCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  topCategories: Array<{
    category: string;
    orders: number;
    revenue: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    revenue: number;
  }>;
  conversionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductStatsSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, default: 0, min: 0 },
  revenue: { type: Number, default: 0, min: 0 },
}, { _id: false });

const CategoryStatsSchema = new Schema({
  category: { type: String, required: true },
  orders: { type: Number, default: 0, min: 0 },
  revenue: { type: Number, default: 0, min: 0 },
}, { _id: false });

const PaymentMethodStatsSchema = new Schema({
  method: { type: String, required: true },
  count: { type: Number, default: 0, min: 0 },
  revenue: { type: Number, default: 0, min: 0 },
}, { _id: false });

const PurchaseAnalyticsSchema = new Schema<IPurchaseAnalytics>({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0,
  },
  averageOrderValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalItemsSold: {
    type: Number,
    default: 0,
    min: 0,
  },
  uniqueCustomers: {
    type: Number,
    default: 0,
    min: 0,
  },
  newCustomers: {
    type: Number,
    default: 0,
    min: 0,
  },
  returningCustomers: {
    type: Number,
    default: 0,
    min: 0,
  },
  topProducts: [ProductStatsSchema],
  topCategories: [CategoryStatsSchema],
  paymentMethods: [PaymentMethodStatsSchema],
  conversionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
}, {
  timestamps: true,
});

// Indexes
PurchaseAnalyticsSchema.index({ date: -1 });
PurchaseAnalyticsSchema.index({ date: 1 }, { unique: true }); // One record per day

export default mongoose.models.PurchaseAnalytics || mongoose.model<IPurchaseAnalytics>('PurchaseAnalytics', PurchaseAnalyticsSchema);

