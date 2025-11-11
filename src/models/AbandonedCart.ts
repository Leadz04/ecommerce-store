import mongoose, { Schema, Document } from 'mongoose';

export type CartStatus = 'active' | 'abandoned' | 'recovered' | 'expired';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'clicked';

export interface ICartItem {
  productId: string;
  productName: string;
  productImage: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IReminder {
  type: '1hour' | '24hour' | '3day';
  scheduledFor: Date;
  sentAt?: Date;
  status: ReminderStatus;
  emailId?: string;
  clickedAt?: Date;
  discountCode?: string;
  discountAmount?: number;
}

export interface IAbandonedCart extends Document {
  userId?: string;
  sessionId: string;
  email?: string;
  customerName?: string;
  
  // Cart details
  items: ICartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
  
  // Status
  status: CartStatus;
  abandonedAt: Date;
  recoveredAt?: Date;
  expiresAt: Date;
  
  // Recovery attempts
  reminders: IReminder[];
  remindersSent: number;
  lastReminderSent?: Date;
  
  // Recovery tracking
  recoveryDiscountOffered?: number;
  recoveredOrderId?: string;
  recoveredAmount?: number;
  
  // User info
  ipAddress?: string;
  userAgent?: string;
  source?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const AbandonedCartSchema = new Schema<IAbandonedCart>({
  userId: {
    type: String,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },
  customerName: String,
  
  // Cart details
  items: [{
    productId: {
      type: String,
      required: true,
      ref: 'Product'
    },
    productName: String,
    productImage: String,
    variantId: String,
    variantName: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  itemCount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'abandoned', 'recovered', 'expired'],
    default: 'active'
  },
  abandonedAt: {
    type: Date,
    required: true,
    index: true
  },
  recoveredAt: Date,
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Recovery attempts
  reminders: [{
    type: {
      type: String,
      enum: ['1hour', '24hour', '3day']
    },
    scheduledFor: Date,
    sentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'clicked'],
      default: 'pending'
    },
    emailId: String,
    clickedAt: Date,
    discountCode: String,
    discountAmount: Number
  }],
  remindersSent: {
    type: Number,
    default: 0
  },
  lastReminderSent: Date,
  
  // Recovery tracking
  recoveryDiscountOffered: Number,
  recoveredOrderId: {
    type: String,
    ref: 'Order'
  },
  recoveredAmount: Number,
  
  // User info
  ipAddress: String,
  userAgent: String,
  source: String
}, {
  timestamps: true
});

// Indexes for efficient queries
AbandonedCartSchema.index({ status: 1, abandonedAt: 1 });
AbandonedCartSchema.index({ email: 1, status: 1 });
AbandonedCartSchema.index({ 'reminders.scheduledFor': 1, 'reminders.status': 1 });
AbandonedCartSchema.index({ expiresAt: 1 });

// Method to check if cart should be marked as abandoned
AbandonedCartSchema.methods.shouldMarkAbandoned = function(): boolean {
  if (this.status !== 'active') return false;
  
  const abandonThreshold = 30 * 60 * 1000; // 30 minutes
  const now = new Date();
  const timeSinceUpdate = now.getTime() - this.updatedAt.getTime();
  
  return timeSinceUpdate >= abandonThreshold;
};

// Method to schedule reminders
AbandonedCartSchema.methods.scheduleReminders = function(): void {
  const now = new Date();
  
  // 1 hour reminder
  this.reminders.push({
    type: '1hour',
    scheduledFor: new Date(now.getTime() + 60 * 60 * 1000),
    status: 'pending'
  });
  
  // 24 hour reminder with 5% discount
  this.reminders.push({
    type: '24hour',
    scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    status: 'pending',
    discountAmount: 5
  });
  
  // 3 day reminder with 10% discount
  this.reminders.push({
    type: '3day',
    scheduledFor: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    status: 'pending',
    discountAmount: 10
  });
};

// Method to mark as recovered
AbandonedCartSchema.methods.markRecovered = function(orderId: string, amount: number): void {
  this.status = 'recovered';
  this.recoveredAt = new Date();
  this.recoveredOrderId = orderId;
  this.recoveredAmount = amount;
};

// Static method to get recovery rate
AbandonedCartSchema.statics.getRecoveryRate = async function(startDate: Date, endDate: Date) {
  const total = await this.countDocuments({
    abandonedAt: { $gte: startDate, $lte: endDate },
    status: { $in: ['abandoned', 'recovered'] }
  });
  
  const recovered = await this.countDocuments({
    abandonedAt: { $gte: startDate, $lte: endDate },
    status: 'recovered'
  });
  
  return {
    total,
    recovered,
    rate: total > 0 ? (recovered / total) * 100 : 0
  };
};

export default mongoose.models.AbandonedCart || mongoose.model<IAbandonedCart>('AbandonedCart', AbandonedCartSchema);

