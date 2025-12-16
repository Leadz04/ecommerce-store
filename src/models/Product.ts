import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  _id: string;
  name: string;
  description: string;
  descriptionHtml?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  imageAltTexts?: string[];
  category?: string;
  department?: string;
  subCategory?: string;
  brand?: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount?: number;
  expectedReleaseDate?: Date; // For pre-orders
  tags: string[];
  specifications: Record<string, string>;
  faqs?: string[];
  generatedFAQs?: Array<{
    question: string;
    answer: string;
    source: 'gemini' | 'serpapi';
    generatedAt: Date;
    model?: string;
  }>;
  relatedSearches?: string[];
  peopleAlsoSearchFor?: Array<{
    text: string;
    link?: string;
    highlightedWords?: string[];
  }>;
  isActive: boolean;
  sourceUrl?: string;
  productType?: string;
  status?: 'draft' | 'published' | 'archived';
  publishAt?: Date | null;
  variants?: Array<{
    title?: string;
    sku?: string;
    price?: number;
    originalPrice?: number;
    available?: boolean;
    inventory?: number | null;
  }>;
  etsyExported?: boolean;
  etsyExportedAt?: Date | null;
  policyReview?: {
    lastRunAt?: Date | null;
    score?: number;
    complianceRate?: number;
    summary?: {
      totalViolations?: number;
      criticalIssues?: number;
      warnings?: number;
      recommendations?: number;
      isCompliant?: boolean;
    };
    aiReview?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  descriptionHtml: {
    type: String,
    required: false,
    maxlength: [20000, 'HTML description too long']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  image: {
    type: String,
    required: [true, 'Product image is required']
  },
  images: [{
    type: String
  }],
  imageAltTexts: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: false, // Relaxed from enum for scraped data support
  },
  department: {
    type: String,
    required: false,
    index: true
  },
  subCategory: {
    type: String,
    required: false,
  },
  brand: {
    type: String,
    required: false,
    trim: true,
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: [0, 'Review count cannot be negative']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockCount: {
    type: Number,
    required: false,
    default: 0,
    min: [0, 'Stock count cannot be negative']
  },
  expectedReleaseDate: {
    type: Date,
    required: false,
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  faqs: [{
    type: String,
    trim: true
  }],
  generatedFAQs: [{
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    source: { type: String, enum: ['gemini', 'serpapi'], required: true },
    generatedAt: { type: Date, default: Date.now },
    model: { type: String }
  }],
  relatedSearches: [{
    type: String,
    trim: true
  }],
  peopleAlsoSearchFor: [{
    text: { type: String, required: true },
    link: { type: String },
    highlightedWords: [{ type: String }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  etsyExported: {
    type: Boolean,
    default: false,
    index: true,
  },
  etsyExportedAt: {
    type: Date,
    default: null,
  },
  sourceUrl: {
    type: String,
    index: true,
    sparse: true,
  },
  productType: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  publishAt: {
    type: Date,
    default: null,
    index: true,
  },
  variants: [{
    title: { type: String },
    sku: { type: String },
    price: { type: Number, min: 0 },
    originalPrice: { type: Number, min: 0 },
    available: { type: Boolean },
    inventory: { type: Number, min: 0, required: false },
  }],
  policyReview: {
    lastRunAt: { type: Date, default: null },
    score: { type: Number },
    complianceRate: { type: Number },
    summary: {
      totalViolations: { type: Number },
      criticalIssues: { type: Number },
      warnings: { type: Number },
      recommendations: { type: Number },
      isCompliant: { type: Boolean },
    },
    aiReview: {
      type: Schema.Types.Mixed,
    },
  }
}, {
  timestamps: true
});

// Index for search functionality
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
