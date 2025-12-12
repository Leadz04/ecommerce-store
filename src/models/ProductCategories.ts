import mongoose, { Document, Schema } from 'mongoose';

export interface IProductCategories extends Document {
  categories: string[];
  subCategories: string[];
  productTypes: string[];
  types: string[];
  extractedAt: Date;
  totalProducts: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductCategoriesSchema = new Schema<IProductCategories>({
  categories: [{
    type: String,
    trim: true
  }],
  subCategories: [{
    type: String,
    trim: true
  }],
  productTypes: [{
    type: String,
    trim: true
  }],
  types: [{
    type: String,
    trim: true
  }],
  extractedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  totalProducts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for quick retrieval of latest extraction
ProductCategoriesSchema.index({ extractedAt: -1 });

export default mongoose.models.ProductCategories || mongoose.model<IProductCategories>('ProductCategories', ProductCategoriesSchema);

