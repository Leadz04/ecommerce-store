import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IKnowledgeBaseArticle extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string; // URL-friendly identifier
  content: string; // Markdown or HTML content
  excerpt?: string; // Short summary
  category: 'getting_started' | 'orders' | 'shipping' | 'returns' | 'payments' | 'account' | 'troubleshooting' | 'other';
  tags: string[];
  authorId?: string; // Admin user ID who created/updated
  views: number; // View count
  helpfulCount: number; // Number of users who found it helpful
  helpfulUsers: string[]; // Array of userIds who found it helpful
  isPublished: boolean;
  isFeatured: boolean; // Featured articles appear prominently
  order: number; // Display order within category
  relatedArticles: Types.ObjectId[]; // Related article IDs
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeBaseArticleSchema = new Schema<IKnowledgeBaseArticle>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  category: {
    type: String,
    enum: ['getting_started', 'orders', 'shipping', 'returns', 'payments', 'account', 'troubleshooting', 'other'],
    required: true,
    default: 'other',
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 50,
  }],
  authorId: {
    type: String,
    ref: 'User',
    required: false,
  },
  views: {
    type: Number,
    default: 0,
    min: 0,
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
  isPublished: {
    type: Boolean,
    default: false,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  relatedArticles: [{
    type: Schema.Types.ObjectId,
    ref: 'KnowledgeBase',
  }],
}, {
  timestamps: true,
});

// Generate slug from title if not provided
KnowledgeBaseArticleSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Indexes for efficient queries
KnowledgeBaseArticleSchema.index({ category: 1, isPublished: 1, order: 1 });
KnowledgeBaseArticleSchema.index({ isFeatured: 1, isPublished: 1 });
KnowledgeBaseArticleSchema.index({ tags: 1, isPublished: 1 });
KnowledgeBaseArticleSchema.index({ title: 'text', content: 'text', excerpt: 'text' }); // Text search index

export default mongoose.models.KnowledgeBase || mongoose.model<IKnowledgeBaseArticle>('KnowledgeBase', KnowledgeBaseArticleSchema);

