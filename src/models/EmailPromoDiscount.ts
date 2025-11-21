import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailPromoDiscount extends Document {
  token: string;
  email: string;
  productId: mongoose.Types.ObjectId;
  discountPercent: number;
  trackingId: mongoose.Types.ObjectId;
  emailSentAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired';
  usageCount: number;
  lastUsedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailPromoDiscountSchema = new Schema<IEmailPromoDiscount>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 95,
    },
    trackingId: {
      type: Schema.Types.ObjectId,
      ref: 'EmailTracking',
      required: true,
    },
    emailSentAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired'],
      default: 'active',
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

EmailPromoDiscountSchema.index({ token: 1 }, { unique: true });
EmailPromoDiscountSchema.index({ productId: 1, status: 1 });
EmailPromoDiscountSchema.index({ email: 1, productId: 1 });

export default mongoose.models.EmailPromoDiscount ||
  mongoose.model<IEmailPromoDiscount>('EmailPromoDiscount', EmailPromoDiscountSchema);

