import mongoose, { Schema, Document } from 'mongoose';

export type RewardTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface ILoyaltyAccount extends Document {
  userId: string;
  points: number;
  tier: RewardTier;
  lifetimePoints: number;
  lifetimeSpent: number;
  
  // Tier benefits
  discountPercentage: number;
  freeShipping: boolean;
  earlyAccess: boolean;
  birthdayBonus: number;
  
  // Transactions
  pointsHistory: Array<{
    points: number;
    type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'refunded';
    reason: string;
    orderId?: string;
    date: Date;
    expiresAt?: Date;
  }>;
  
  // Referrals
  referralCode: string;
  referredBy?: string;
  referrals: Array<{
    userId: string;
    email: string;
    pointsEarned: number;
    date: Date;
  }>;
  
  // Milestones
  nextTierPoints: number;
  memberSince: Date;
  lastActivityDate: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const LoyaltyAccountSchema = new Schema<ILoyaltyAccount>({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User',
    index: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  lifetimePoints: {
    type: Number,
    default: 0
  },
  lifetimeSpent: {
    type: Number,
    default: 0
  },
  
  // Tier benefits
  discountPercentage: {
    type: Number,
    default: 0
  },
  freeShipping: {
    type: Boolean,
    default: false
  },
  earlyAccess: {
    type: Boolean,
    default: false
  },
  birthdayBonus: {
    type: Number,
    default: 0
  },
  
  // Transactions
  pointsHistory: [{
    points: Number,
    type: {
      type: String,
      enum: ['earned', 'redeemed', 'expired', 'bonus', 'refunded']
    },
    reason: String,
    orderId: String,
    date: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  
  // Referrals
  referralCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  referredBy: {
    type: String,
    ref: 'User'
  },
  referrals: [{
    userId: {
      type: String,
      ref: 'User'
    },
    email: String,
    pointsEarned: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Milestones
  nextTierPoints: Number,
  memberSince: {
    type: Date,
    default: Date.now
  },
  lastActivityDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
LoyaltyAccountSchema.index({ userId: 1 });
LoyaltyAccountSchema.index({ referralCode: 1 });
LoyaltyAccountSchema.index({ tier: 1 });

// Tier thresholds and benefits
const TIER_CONFIG = {
  bronze: { minPoints: 0, discount: 0, freeShipping: false, earlyAccess: false, birthdayBonus: 50 },
  silver: { minPoints: 1000, discount: 5, freeShipping: false, earlyAccess: false, birthdayBonus: 100 },
  gold: { minPoints: 5000, discount: 10, freeShipping: true, earlyAccess: true, birthdayBonus: 200 },
  platinum: { minPoints: 15000, discount: 15, freeShipping: true, earlyAccess: true, birthdayBonus: 500 }
};

// Points earning rules
const POINTS_CONFIG = {
  perDollarSpent: 1,
  referralBonus: 500,
  refereeBonus: 250,
  reviewBonus: 50,
  socialShareBonus: 25,
  birthdayBonus: 100,
  signupBonus: 100
};

// Static method to generate unique referral code
LoyaltyAccountSchema.statics.generateReferralCode = async function(name: string): Promise<string> {
  const baseCode = name.substring(0, 6).toUpperCase().replace(/[^A-Z]/g, '') + Math.random().toString(36).substring(2, 6).toUpperCase();
  let code = baseCode;
  let counter = 1;
  
  while (await this.exists({ referralCode: code })) {
    code = baseCode + counter;
    counter++;
  }
  
  return code;
};

// Method to calculate and update tier
LoyaltyAccountSchema.methods.updateTier = function(): boolean {
  const oldTier = this.tier;
  
  if (this.lifetimePoints >= TIER_CONFIG.platinum.minPoints) {
    this.tier = 'platinum';
  } else if (this.lifetimePoints >= TIER_CONFIG.gold.minPoints) {
    this.tier = 'gold';
  } else if (this.lifetimePoints >= TIER_CONFIG.silver.minPoints) {
    this.tier = 'silver';
  } else {
    this.tier = 'bronze';
  }
  
  // Update benefits
  const tierConfig = TIER_CONFIG[this.tier];
  this.discountPercentage = tierConfig.discount;
  this.freeShipping = tierConfig.freeShipping;
  this.earlyAccess = tierConfig.earlyAccess;
  this.birthdayBonus = tierConfig.birthdayBonus;
  
  // Calculate next tier points
  const tiers: RewardTier[] = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = tiers.indexOf(this.tier);
  if (currentIndex < tiers.length - 1) {
    const nextTier = tiers[currentIndex + 1];
    this.nextTierPoints = TIER_CONFIG[nextTier].minPoints - this.lifetimePoints;
  } else {
    this.nextTierPoints = 0;
  }
  
  return oldTier !== this.tier;
};

// Method to add points
LoyaltyAccountSchema.methods.addPoints = function(
  points: number,
  reason: string,
  type: 'earned' | 'bonus' = 'earned',
  orderId?: string,
  expiresInDays?: number
): void {
  this.points += points;
  this.lifetimePoints += points;
  
  const expiresAt = expiresInDays 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;
  
  this.pointsHistory.push({
    points,
    type,
    reason,
    orderId,
    date: new Date(),
    expiresAt
  });
  
  this.lastActivityDate = new Date();
  this.updateTier();
};

// Method to redeem points
LoyaltyAccountSchema.methods.redeemPoints = function(points: number, reason: string, orderId?: string): boolean {
  if (this.points < points) return false;
  
  this.points -= points;
  this.pointsHistory.push({
    points: -points,
    type: 'redeemed',
    reason,
    orderId,
    date: new Date()
  });
  
  this.lastActivityDate = new Date();
  return true;
};

// Method to calculate points from purchase
LoyaltyAccountSchema.statics.calculatePurchasePoints = function(amount: number): number {
  return Math.floor(amount * POINTS_CONFIG.perDollarSpent);
};

// Method to convert points to discount
LoyaltyAccountSchema.statics.pointsToDiscount = function(points: number, conversionRate: number = 0.01): number {
  return points * conversionRate; // Default: 100 points = $1
};

export default mongoose.models.LoyaltyAccount || mongoose.model<ILoyaltyAccount>('LoyaltyAccount', LoyaltyAccountSchema);
export { POINTS_CONFIG, TIER_CONFIG };

