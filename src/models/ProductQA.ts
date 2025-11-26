import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswer extends Document {
  _id: string;
  questionId: string;
  userId?: string; // Optional for community answers
  userName: string;
  userEmail?: string;
  answer: string;
  helpfulCount: number;
  helpfulUsers: string[];
  isAdminAnswer: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestion extends Document {
  _id: string;
  productId: string;
  userId?: string; // Optional for guest questions
  userName: string;
  userEmail?: string;
  question: string;
  answers: IAnswer[];
  helpfulCount: number;
  helpfulUsers: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// Answer schema as a subdocument
const AnswerSchema = new Schema<IAnswer>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductQuestion',
      required: true,
    },
    userId: {
      type: String,
      ref: 'User',
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true,
      maxlength: [2000, 'Answer cannot be more than 2000 characters'],
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulUsers: [{
      type: String,
      ref: 'User',
    }],
    isAdminAnswer: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    _id: true, // Enable _id for subdocuments so we can reference them
  }
);

const QuestionSchema = new Schema<IQuestion>(
  {
    productId: {
      type: String,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    userId: {
      type: String,
      ref: 'User',
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
      trim: true,
      lowercase: true,
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      maxlength: [500, 'Question cannot be more than 500 characters'],
    },
    answers: [AnswerSchema],
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulUsers: [{
      type: String,
      ref: 'User',
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for filtering approved questions
QuestionSchema.index({ productId: 1, status: 1 });
QuestionSchema.index({ productId: 1, createdAt: -1 });

export const ProductAnswer = mongoose.models.ProductAnswer || mongoose.model<IAnswer>('ProductAnswer', AnswerSchema);
export default mongoose.models.ProductQuestion || mongoose.model<IQuestion>('ProductQuestion', QuestionSchema);

