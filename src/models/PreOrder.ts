import mongoose, { Document, Schema } from 'mongoose';

export interface IPreOrder extends Document {
  _id: string;
  productId: string;
  productName: string;
  productImage: string;
  userId?: string; // Optional for guest pre-orders
  userEmail?: string; // Email for guest pre-orders
  quantity: number;
  price: number; // Price at time of pre-order
  expectedReleaseDate: Date;
  releaseDate?: Date; // Actual release date
  status: 'pending' | 'confirmed' | 'released' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentIntentId?: string;
  shippingAddress?: {
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
  orderId?: string; // Linked order when product is released
  notifiedAt?: Date; // When customer was notified of release
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

const PreOrderSchema = new Schema<IPreOrder>({
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
    trim: true,
    lowercase: true,
    index: true,
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
  expectedReleaseDate: {
    type: Date,
    required: true,
    index: true,
  },
  releaseDate: Date,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'released', 'cancelled'],
    default: 'pending',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
  paymentIntentId: String,
  shippingAddress: AddressSchema,
  orderId: {
    type: String,
    ref: 'Order',
  },
  notifiedAt: Date,
}, {
  timestamps: true,
});

// Indexes
PreOrderSchema.index({ userId: 1, status: 1 });
PreOrderSchema.index({ userEmail: 1, status: 1 });
PreOrderSchema.index({ status: 1, expectedReleaseDate: 1 });
PreOrderSchema.index({ productId: 1, status: 1 });

export default mongoose.models.PreOrder || mongoose.model<IPreOrder>('PreOrder', PreOrderSchema);

