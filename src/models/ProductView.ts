import mongoose, { Document, Schema } from 'mongoose';

export interface IProductView extends Document {
  productId: mongoose.Types.ObjectId;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  viewedAt: Date;
  createdAt: Date;
}

const ProductViewSchema = new Schema<IProductView>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
ProductViewSchema.index({ productId: 1, sessionId: 1 });
ProductViewSchema.index({ productId: 1, viewedAt: -1 });

export default mongoose.models.ProductView || mongoose.model<IProductView>('ProductView', ProductViewSchema);

