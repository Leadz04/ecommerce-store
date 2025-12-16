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
  maxUsageCount: number;
  usedBy: Array<{
    userId: mongoose.Types.ObjectId;
    usedAt: Date;
  }>;
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
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
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
    maxUsageCount: {
      type: Number,
      default: 1,
      min: 1,
      required: true,
    },
    usedBy: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      usedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
    }],
    lastUsedAt: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

EmailPromoDiscountSchema.index({ token: 1 });
EmailPromoDiscountSchema.index({ productId: 1, status: 1 });
EmailPromoDiscountSchema.index({ email: 1, productId: 1 });

export default mongoose.models.EmailPromoDiscount ||
  mongoose.model<IEmailPromoDiscount>('EmailPromoDiscount', EmailPromoDiscountSchema);

