import mongoose, { Document, Schema } from 'mongoose';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';
export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ISubscription extends Document {
  _id: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number; // Price per delivery
  frequency: SubscriptionFrequency;
  status: SubscriptionStatus;
  nextDeliveryDate: Date;
  lastDeliveryDate?: Date;
  startDate: Date;
  endDate?: Date;
  pauseUntil?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  deliveryCount: number;
  totalDeliveries?: number; // If null, unlimited
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  paymentMethod: string;
  paymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  address1: { type: String, required: true, trim: true },
  address2: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, default: 'United States' },
  phone: { type: String, trim: true },
}, { _id: false });

const SubscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: String,
    ref: 'User',
    required: true,
    index: true,
  },
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
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  frequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
    required: true,
    default: 'monthly',
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active',
    index: true,
  },
  nextDeliveryDate: {
    type: Date,
    required: true,
    index: true,
  },
  lastDeliveryDate: Date,
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: Date,
  pauseUntil: Date,
  cancelledAt: Date,
  cancellationReason: String,
  deliveryCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalDeliveries: {
    type: Number,
    min: 1,
  },
  shippingAddress: {
    type: AddressSchema,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentIntentId: String,
}, {
  timestamps: true,
});

// Indexes
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ status: 1, nextDeliveryDate: 1 });
SubscriptionSchema.index({ productId: 1 });

export default mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

