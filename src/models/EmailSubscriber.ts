import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailSubscriber extends Document {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string; // 'csv', 'website', 'manual', etc.
  isActive: boolean;
  lastVisited?: Date;
  visitCount: number;
  lastEmailSent?: Date;
  emailSentCount: number;
  converted: boolean; // Has made a purchase
  conversionDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const EmailSubscriberSchema = new Schema<IEmailSubscriber>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    default: 'csv',
    enum: ['csv', 'website', 'manual', 'import', 'api']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastVisited: {
    type: Date,
    index: true
  },
  visitCount: {
    type: Number,
    default: 0
  },
  lastEmailSent: {
    type: Date,
    index: true
  },
  emailSentCount: {
    type: Number,
    default: 0
  },
  converted: {
    type: Boolean,
    default: false,
    index: true
  },
  conversionDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for performance
EmailSubscriberSchema.index({ email: 1 });
EmailSubscriberSchema.index({ isActive: 1, converted: 1 });
EmailSubscriberSchema.index({ lastVisited: 1 });
EmailSubscriberSchema.index({ lastEmailSent: 1 });

const EmailSubscriber = mongoose.models.EmailSubscriber || mongoose.model<IEmailSubscriber>('EmailSubscriber', EmailSubscriberSchema);

export default EmailSubscriber;

