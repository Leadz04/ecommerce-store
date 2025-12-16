import mongoose, { Document, Schema } from 'mongoose';

export interface IEtsyOrder extends Document {
  userId: string; // User who owns this order's shop
  etsyOrderId: string;
  shopId: string; // Etsy shop ID
  orderId?: string; // Reference to our internal order
  receiptId: string;
  buyerUserId: string;
  buyerEmail: string;
  status: 'open' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  shippingStatus: 'pending' | 'shipped' | 'delivered';
  total: number;
  currency: string;
  shippingCost: number;
  taxCost: number;
  items: Array<{
    listingId: string;
    productId?: string;
    title: string;
    quantity: number;
    price: number;
    variations: Array<{
      property: string;
      value: string;
    }>;
  }>;
  shippingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  messageFromBuyer?: string;
  messageFromSeller?: string;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EtsyOrderSchema = new Schema<IEtsyOrder>({
  userId: { type: String, required: true, index: true }, // User who owns this order's shop
  etsyOrderId: { type: String, required: true },
  shopId: { type: String, required: true, index: true }, // Etsy shop ID
  orderId: { type: String, ref: 'Order' },
  receiptId: { type: String, required: true },
  buyerUserId: { type: String, required: true },
  buyerEmail: { type: String, required: true },
  status: { type: String, enum: ['open', 'completed', 'cancelled'], default: 'open' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  shippingStatus: { type: String, enum: ['pending', 'shipped', 'delivered'], default: 'pending' },
  total: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  shippingCost: { type: Number, default: 0 },
  taxCost: { type: Number, default: 0 },
  items: [{
    listingId: { type: String, required: true },
    productId: { type: String, ref: 'Product' },
    title: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    variations: [{
      property: { type: String, required: true },
      value: { type: String, required: true }
    }]
  }],
  shippingAddress: {
    name: { type: String, required: true },
    address1: { type: String, required: true },
    address2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String }
  },
  messageFromBuyer: { type: String },
  messageFromSeller: { type: String },
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound index for efficient queries by user and shop
EtsyOrderSchema.index({ userId: 1, shopId: 1 });
// Keep etsyOrderId unique globally
EtsyOrderSchema.index({ etsyOrderId: 1 }, { unique: true });

export default mongoose.models.EtsyOrder || mongoose.model<IEtsyOrder>('EtsyOrder', EtsyOrderSchema);
