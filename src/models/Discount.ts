import mongoose, { Schema, Document } from 'mongoose';

export type DiscountType = 'percentage' | 'fixed' | 'buy_x_get_y' | 'bulk' | 'shipping';
export type DiscountStatus = 'active' | 'scheduled' | 'expired' | 'disabled';

export interface IDiscount extends Document {
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number; // percentage (0-100) or fixed amount
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  
  // Buy X Get Y specific
  buyQuantity?: number;
  getQuantity?: number;
  buyProductIds?: string[];
  getProductIds?: string[];
  
  // Bulk pricing
  bulkTiers?: Array<{
    quantity: number;
    discountPercent: number;
  }>;
  
  // Conditions
  applicableProducts?: string[]; // Product IDs
  applicableCategories?: string[];
  excludedProducts?: string[];
  customerSegments?: string[];
  newCustomersOnly?: boolean;
  firstPurchaseOnly?: boolean;
  
  // Usage limits
  usageLimit?: number; // total uses
  usageLimitPerCustomer?: number;
  usageCount: number;
  
  // Time constraints
  startDate?: Date;
  endDate?: Date;
  
  // Status
  status: DiscountStatus;
  isActive: boolean;
  
  // Tracking
  totalRevenue: number;
  totalOrders: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const DiscountSchema = new Schema<IDiscount>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'buy_x_get_y', 'bulk', 'shipping'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchaseAmount: Number,
  maxDiscountAmount: Number,
  
  // Buy X Get Y
  buyQuantity: Number,
  getQuantity: Number,
  buyProductIds: [String],
  getProductIds: [String],
  
  // Bulk pricing
  bulkTiers: [{
    quantity: Number,
    discountPercent: Number
  }],
  
  // Conditions
  applicableProducts: [String],
  applicableCategories: [String],
  excludedProducts: [String],
  customerSegments: [String],
  newCustomersOnly: { type: Boolean, default: false },
  firstPurchaseOnly: { type: Boolean, default: false },
  
  // Usage limits
  usageLimit: Number,
  usageLimitPerCustomer: Number,
  usageCount: { type: Number, default: 0 },
  
  // Time constraints
  startDate: Date,
  endDate: Date,
  
  // Status
  status: {
    type: String,
    enum: ['active', 'scheduled', 'expired', 'disabled'],
    default: 'active'
  },
  isActive: { type: Boolean, default: true },
  
  // Tracking
  totalRevenue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Index for efficient queries
DiscountSchema.index({ code: 1, status: 1 });
DiscountSchema.index({ startDate: 1, endDate: 1 });
DiscountSchema.index({ isActive: 1, status: 1 });

// Method to check if discount is currently valid
DiscountSchema.methods.isCurrentlyValid = function(): boolean {
  if (!this.isActive || this.status === 'disabled') return false;
  
  const now = new Date();
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  
  if (this.usageLimit && this.usageCount >= this.usageLimit) return false;
  
  return true;
};

// Method to calculate discount amount
DiscountSchema.methods.calculateDiscount = function(orderTotal: number, quantity: number = 1): number {
  if (!this.isCurrentlyValid()) return 0;
  
  if (this.minPurchaseAmount && orderTotal < this.minPurchaseAmount) return 0;
  
  let discountAmount = 0;
  
  switch (this.type) {
    case 'percentage':
      discountAmount = (orderTotal * this.value) / 100;
      break;
    case 'fixed':
      discountAmount = this.value;
      break;
    case 'bulk':
      if (this.bulkTiers && this.bulkTiers.length > 0) {
        const applicableTier = this.bulkTiers
          .filter(tier => quantity >= tier.quantity)
          .sort((a, b) => b.quantity - a.quantity)[0];
        
        if (applicableTier) {
          discountAmount = (orderTotal * applicableTier.discountPercent) / 100;
        }
      }
      break;
  }
  
  // Apply max discount limit
  if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
    discountAmount = this.maxDiscountAmount;
  }
  
  return Math.min(discountAmount, orderTotal);
};

export default mongoose.models.Discount || mongoose.model<IDiscount>('Discount', DiscountSchema);

