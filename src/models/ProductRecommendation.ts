import mongoose, { Schema, Document } from 'mongoose';

export type RecommendationType = 'related' | 'frequently_bought' | 'similar' | 'upsell' | 'cross_sell';

export interface IProductRecommendation extends Document {
  productId: string;
  type: RecommendationType;
  recommendedProducts: Array<{
    productId: string;
    score: number; // 0-100, higher = more relevant
    reason?: string;
  }>;
  
  // Auto-generation metadata
  generatedBy: 'manual' | 'ai' | 'algorithm';
  lastUpdated: Date;
  
  // Performance tracking
  viewCount: number;
  clickCount: number;
  conversionCount: number;
  clickThroughRate: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const ProductRecommendationSchema = new Schema<IProductRecommendation>({
  productId: {
    type: String,
    required: true,
    ref: 'Product',
    index: true
  },
  type: {
    type: String,
    enum: ['related', 'frequently_bought', 'similar', 'upsell', 'cross_sell'],
    required: true
  },
  recommendedProducts: [{
    productId: {
      type: String,
      required: true,
      ref: 'Product'
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    reason: String
  }],
  
  generatedBy: {
    type: String,
    enum: ['manual', 'ai', 'algorithm'],
    default: 'algorithm'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Performance tracking
  viewCount: {
    type: Number,
    default: 0
  },
  clickCount: {
    type: Number,
    default: 0
  },
  conversionCount: {
    type: Number,
    default: 0
  },
  clickThroughRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes
ProductRecommendationSchema.index({ productId: 1, type: 1 }, { unique: true });

// Method to update click-through rate
ProductRecommendationSchema.methods.updateCTR = function(): void {
  this.clickThroughRate = this.viewCount > 0 
    ? (this.clickCount / this.viewCount) * 100 
    : 0;
};

// Static method to generate recommendations based on purchase history
ProductRecommendationSchema.statics.generateFrequentlyBought = async function(
  productId: string,
  limit: number = 5
) {
  // This would analyze order history to find products frequently bought together
  // Implementation would query Order collection and use aggregation pipeline
  // Placeholder implementation
  return [];
};

// Static method to generate similar products
ProductRecommendationSchema.statics.generateSimilar = async function(
  productId: string,
  limit: number = 5
) {
  // This would analyze product attributes (category, tags, price range) to find similar products
  // Placeholder implementation
  return [];
};

export default mongoose.models.ProductRecommendation || mongoose.model<IProductRecommendation>('ProductRecommendation', ProductRecommendationSchema);

