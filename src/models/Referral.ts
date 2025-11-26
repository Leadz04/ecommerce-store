import mongoose, { Document, Schema } from 'mongoose';

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId; // User who referred
  refereeId: mongoose.Types.ObjectId; // User who was referred
  referralCode: string; // The code used
  status: 'pending' | 'completed' | 'rewarded'; // Status of referral
  referrerRewardType: 'discount' | 'credit' | 'points'; // Type of reward for referrer
  referrerRewardValue: number; // Value of reward (percentage or amount)
  refereeRewardType: 'discount' | 'credit' | 'points'; // Type of reward for referee
  refereeRewardValue: number; // Value of reward (percentage or amount)
  referrerRewardGranted: boolean; // Whether referrer has received reward
  refereeRewardGranted: boolean; // Whether referee has received reward
  refereeFirstOrderId?: mongoose.Types.ObjectId; // First order made by referee
  refereeFirstOrderAmount?: number; // Amount of first order
  referrerRewardGrantedAt?: Date; // When referrer reward was granted
  refereeRewardGrantedAt?: Date; // When referee reward was granted
  expiresAt?: Date; // When referral expires (if applicable)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refereeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rewarded'],
      default: 'pending',
      index: true,
    },
    referrerRewardType: {
      type: String,
      enum: ['discount', 'credit', 'points'],
      default: 'discount',
    },
    referrerRewardValue: {
      type: Number,
      required: true,
      default: 20, // $20 off or 20% off
    },
    refereeRewardType: {
      type: String,
      enum: ['discount', 'credit', 'points'],
      default: 'discount',
    },
    refereeRewardValue: {
      type: Number,
      required: true,
      default: 20, // $20 off or 20% off
    },
    referrerRewardGranted: {
      type: Boolean,
      default: false,
    },
    refereeRewardGranted: {
      type: Boolean,
      default: false,
    },
    refereeFirstOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    refereeFirstOrderAmount: {
      type: Number,
    },
    referrerRewardGrantedAt: {
      type: Date,
    },
    refereeRewardGrantedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ refereeId: 1 });
ReferralSchema.index({ referralCode: 1 });
ReferralSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Referral ||
  mongoose.model<IReferral>('Referral', ReferralSchema);

