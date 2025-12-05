import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  name?: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // Percentage (1-100) or fixed amount in dollars
  minimumPurchase?: number; // Minimum order amount required
  maxDiscountAmount?: number; // Maximum discount amount (for percentage discounts)
  productId?: mongoose.Types.ObjectId; // Optional: apply to specific product
  category?: string; // Optional: apply to specific category
  startDate: Date;
  endDate: Date;
  usageLimit?: number; // Total number of times this coupon can be used
  usageLimitPerUser?: number; // Number of times a single user can use this coupon
  usageCount: number; // Current usage count
  isActive: boolean;
  status: 'active' | 'expired' | 'disabled';
  usedBy: Array<{
    userId?: string; // Optional for guest users
    email?: string; // For tracking guest users
    usedAt: Date;
    orderId: string;
    discountAmount: number;
  }>;
  totalDiscountGiven: number; // Total amount of discounts given
  totalRevenue: number; // Total revenue from orders using this coupon
  createdAt: Date;
  updatedAt: Date;
}

const UsedBySchema = new Schema({
  userId: {
    type: String,
    required: false,
    index: true,
  },
  email: {
    type: String,
    required: false,
    lowercase: true,
    trim: true,
  },
  usedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  orderId: {
    type: String,
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumPurchase: {
      type: Number,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
      index: true,
    },
    category: {
      type: String,
      enum: ['Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'],
      required: false,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    usageLimit: {
      type: Number,
      min: 1,
    },
    usageLimitPerUser: {
      type: Number,
      min: 1,
      default: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'disabled'],
      default: 'active',
      index: true,
    },
    usedBy: [UsedBySchema],
    totalDiscountGiven: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
CouponSchema.index({ code: 1, status: 1 });
CouponSchema.index({ status: 1, startDate: 1, endDate: 1 });
CouponSchema.index({ isActive: 1, status: 1 });
CouponSchema.index({ productId: 1, status: 1 });
CouponSchema.index({ category: 1, status: 1 });

// Virtual to check if coupon is currently valid
CouponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return (
    this.isActive &&
    this.status === 'active' &&
    now >= this.startDate &&
    now <= this.endDate &&
    (!this.usageLimit || this.usageCount < this.usageLimit)
  );
});

// Method to update coupon stats after usage
CouponSchema.methods.recordUsage = function(userId: string | undefined, email: string | undefined, orderId: string, discountAmount: number, orderTotal: number) {
  this.usageCount += 1;
  this.totalDiscountGiven += discountAmount;
  this.totalRevenue += orderTotal;
  this.usedBy.push({
    userId,
    email,
    usedAt: new Date(),
    orderId,
    discountAmount,
  });
  
  // Update status if usage limit reached
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    this.status = 'disabled';
    this.isActive = false;
  }
  
  return this.save();
};

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
