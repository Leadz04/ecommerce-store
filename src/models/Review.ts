import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  _id: string;
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  rating: number; // 1-5
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  helpfulUsers: mongoose.Types.ObjectId[];
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  adminResponse?: {
    message: string;
    respondedBy: mongoose.Types.ObjectId;
    respondedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      trim: true,
      lowercase: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot be more than 2000 characters'],
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    images: [{
      type: String,
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminResponse: {
      message: {
        type: String,
        maxlength: [1000, 'Admin response cannot be more than 1000 characters'],
      },
      respondedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      respondedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for product and user to prevent duplicate reviews
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Index for filtering approved reviews
ReviewSchema.index({ productId: 1, status: 1 });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

