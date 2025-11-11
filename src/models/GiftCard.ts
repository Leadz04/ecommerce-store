import mongoose, { Schema, Document } from 'mongoose';

export type GiftCardStatus = 'active' | 'redeemed' | 'expired' | 'cancelled';

export interface IGiftCard extends Document {
  code: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  
  // Sender & Recipient
  purchasedBy?: string; // User ID
  recipientEmail?: string;
  recipientName?: string;
  senderName?: string;
  message?: string;
  
  // Usage
  redeemedBy?: string; // User ID
  redeemedAt?: Date;
  transactions: Array<{
    orderId: string;
    amount: number;
    date: Date;
    balanceAfter: number;
  }>;
  
  // Status
  status: GiftCardStatus;
  isActive: boolean;
  
  // Constraints
  expiryDate?: Date;
  minPurchaseAmount?: number;
  
  // Email delivery
  emailSent: boolean;
  emailSentAt?: Date;
  scheduledSendDate?: Date;
  
  // Design
  template?: string;
  customImage?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const GiftCardSchema = new Schema<IGiftCard>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  initialBalance: {
    type: Number,
    required: true,
    min: 0
  },
  currentBalance: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  
  // Sender & Recipient
  purchasedBy: {
    type: String,
    ref: 'User'
  },
  recipientEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  recipientName: String,
  senderName: String,
  message: String,
  
  // Usage
  redeemedBy: {
    type: String,
    ref: 'User'
  },
  redeemedAt: Date,
  transactions: [{
    orderId: {
      type: String,
      ref: 'Order'
    },
    amount: Number,
    date: {
      type: Date,
      default: Date.now
    },
    balanceAfter: Number
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'redeemed', 'expired', 'cancelled'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Constraints
  expiryDate: Date,
  minPurchaseAmount: Number,
  
  // Email delivery
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  scheduledSendDate: Date,
  
  // Design
  template: {
    type: String,
    default: 'default'
  },
  customImage: String
}, {
  timestamps: true
});

// Indexes
GiftCardSchema.index({ code: 1, status: 1 });
GiftCardSchema.index({ recipientEmail: 1 });
GiftCardSchema.index({ purchasedBy: 1 });
GiftCardSchema.index({ expiryDate: 1 });

// Static method to generate unique code
GiftCardSchema.statics.generateUniqueCode = async function(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  let exists = true;
  
  while (exists) {
    code = '';
    for (let i = 0; i < 16; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // Format: XXXX-XXXX-XXXX-XXXX
    code = code.match(/.{1,4}/g)?.join('-') || code;
    
    exists = await this.exists({ code });
  }
  
  return code!;
};

// Method to check if gift card is valid
GiftCardSchema.methods.isValid = function(): boolean {
  if (!this.isActive || this.status !== 'active') return false;
  if (this.currentBalance <= 0) return false;
  if (this.expiryDate && new Date() > this.expiryDate) return false;
  
  return true;
};

// Method to apply gift card to order
GiftCardSchema.methods.apply = function(amount: number, orderId: string): number {
  if (!this.isValid()) return 0;
  
  const applicableAmount = Math.min(amount, this.currentBalance);
  
  this.currentBalance -= applicableAmount;
  this.transactions.push({
    orderId,
    amount: applicableAmount,
    date: new Date(),
    balanceAfter: this.currentBalance
  });
  
  if (this.currentBalance <= 0) {
    this.status = 'redeemed';
    this.redeemedAt = new Date();
  }
  
  return applicableAmount;
};

export default mongoose.models.GiftCard || mongoose.model<IGiftCard>('GiftCard', GiftCardSchema);

