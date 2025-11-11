import mongoose, { Schema, Document } from 'mongoose';

export type FlashSaleStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';

export interface IFlashSaleProduct {
  productId: string;
  originalPrice: number;
  salePrice: number;
  discountPercentage: number;
  quantityLimit?: number;
  quantitySold: number;
}

export interface IFlashSale extends Document {
  name: string;
  description?: string;
  
  // Timing
  startDate: Date;
  endDate: Date;
  status: FlashSaleStatus;
  
  // Products
  products: IFlashSaleProduct[];
  
  // Limits
  globalQuantityLimit?: number;
  limitPerCustomer?: number;
  
  // Display
  bannerImage?: string;
  badgeText?: string;
  showCountdown: boolean;
  highlightOnHomepage: boolean;
  
  // Notifications
  notifySubscribers: boolean;
  notificationSent: boolean;
  notifiedAt?: Date;
  
  // Analytics
  viewCount: number;
  clickCount: number;
  orderCount: number;
  totalRevenue: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const FlashSaleSchema = new Schema<IFlashSale>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  
  // Timing
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'ended', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  
  // Products
  products: [{
    productId: {
      type: String,
      required: true,
      ref: 'Product'
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    salePrice: {
      type: Number,
      required: true,
      min: 0
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    quantityLimit: Number,
    quantitySold: {
      type: Number,
      default: 0
    }
  }],
  
  // Limits
  globalQuantityLimit: Number,
  limitPerCustomer: Number,
  
  // Display
  bannerImage: String,
  badgeText: {
    type: String,
    default: 'FLASH SALE'
  },
  showCountdown: {
    type: Boolean,
    default: true
  },
  highlightOnHomepage: {
    type: Boolean,
    default: true
  },
  
  // Notifications
  notifySubscribers: {
    type: Boolean,
    default: true
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notifiedAt: Date,
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  clickCount: {
    type: Number,
    default: 0
  },
  orderCount: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
FlashSaleSchema.index({ status: 1, startDate: 1, endDate: 1 });
FlashSaleSchema.index({ 'products.productId': 1 });

// Method to check if flash sale is currently active
FlashSaleSchema.methods.isActive = function(): boolean {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
};

// Method to get time remaining
FlashSaleSchema.methods.getTimeRemaining = function(): number {
  if (!this.isActive()) return 0;
  return Math.max(0, this.endDate.getTime() - Date.now());
};

// Method to check if product is available
FlashSaleSchema.methods.isProductAvailable = function(productId: string): boolean {
  const product = this.products.find(p => p.productId === productId);
  if (!product) return false;
  
  if (product.quantityLimit && product.quantitySold >= product.quantityLimit) {
    return false;
  }
  
  return this.isActive();
};

// Method to update status based on time
FlashSaleSchema.methods.updateStatus = function(): void {
  const now = new Date();
  
  if (this.status === 'cancelled') return;
  
  if (now < this.startDate) {
    this.status = 'scheduled';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'active';
  } else if (now > this.endDate) {
    this.status = 'ended';
  }
};

// Static method to get active flash sales
FlashSaleSchema.statics.getActive = async function() {
  const now = new Date();
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate('products.productId');
};

export default mongoose.models.FlashSale || mongoose.model<IFlashSale>('FlashSale', FlashSaleSchema);

