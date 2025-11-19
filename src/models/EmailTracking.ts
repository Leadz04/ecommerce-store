import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailTracking extends Document {
  email: string;
  subscriberId?: string; // Reference to EmailSubscriber
  emailType: 'welcome' | 'return' | 'urgent' | 'promotional' | 'newsletter';
  emailSentAt: Date;
  
  // Open tracking
  opened: boolean;
  openedAt?: Date;
  openCount: number;
  lastOpenedAt?: Date;
  
  // Click tracking
  clicked: boolean;
  clickedAt?: Date;
  clickCount: number;
  lastClickedAt?: Date;
  clickedLinks?: Array<{
    url: string;
    clickedAt: Date;
    linkType: 'product' | 'category' | 'home' | 'checkout' | 'other';
    productId?: string;
  }>;
  
  // Visit tracking (from email)
  visited: boolean;
  visitedAt?: Date;
  visitCount: number;
  lastVisitedAt?: Date;
  visitedPages?: Array<{
    page: string;
    visitedAt: Date;
    pageType: 'home' | 'product' | 'category' | 'cart' | 'checkout' | 'other';
    productId?: string;
  }>;
  
  // Product views from email
  productViews?: Array<{
    productId: string;
    productName: string;
    viewedAt: Date;
    fromEmail: boolean; // Did they come from email?
  }>;
  
  // Conversion
  converted: boolean;
  convertedAt?: Date;
  orderId?: string;
  
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTrackingSchema = new Schema<IEmailTracking>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  subscriberId: {
    type: Schema.Types.ObjectId,
    ref: 'EmailSubscriber',
    index: true
  },
  emailType: {
    type: String,
    required: true,
    enum: ['welcome', 'return', 'urgent', 'promotional', 'newsletter'],
    index: true
  },
  emailSentAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Open tracking
  opened: {
    type: Boolean,
    default: false,
    index: true
  },
  openedAt: Date,
  openCount: {
    type: Number,
    default: 0
  },
  lastOpenedAt: Date,
  
  // Click tracking
  clicked: {
    type: Boolean,
    default: false,
    index: true
  },
  clickedAt: Date,
  clickCount: {
    type: Number,
    default: 0
  },
  lastClickedAt: Date,
  clickedLinks: [{
    url: String,
    clickedAt: Date,
    linkType: {
      type: String,
      enum: ['product', 'category', 'home', 'checkout', 'other']
    },
    productId: String
  }],
  
  // Visit tracking
  visited: {
    type: Boolean,
    default: false,
    index: true
  },
  visitedAt: Date,
  visitCount: {
    type: Number,
    default: 0
  },
  lastVisitedAt: Date,
  visitedPages: [{
    page: String,
    visitedAt: Date,
    pageType: {
      type: String,
      enum: ['home', 'product', 'category', 'cart', 'checkout', 'other']
    },
    productId: String
  }],
  
  // Product views
  productViews: [{
    productId: String,
    productName: String,
    viewedAt: Date,
    fromEmail: Boolean
  }],
  
  // Conversion
  converted: {
    type: Boolean,
    default: false,
    index: true
  },
  convertedAt: Date,
  orderId: String,
  
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for performance
EmailTrackingSchema.index({ email: 1, emailSentAt: -1 });
EmailTrackingSchema.index({ subscriberId: 1 });
EmailTrackingSchema.index({ opened: 1, openedAt: -1 });
EmailTrackingSchema.index({ clicked: 1, clickedAt: -1 });
EmailTrackingSchema.index({ visited: 1, visitedAt: -1 });
EmailTrackingSchema.index({ converted: 1, convertedAt: -1 });
EmailTrackingSchema.index({ emailType: 1, emailSentAt: -1 });

const EmailTracking = mongoose.models.EmailTracking || mongoose.model<IEmailTracking>('EmailTracking', EmailTrackingSchema);

export default EmailTracking;

