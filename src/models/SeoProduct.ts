import mongoose, { Document, Schema } from 'mongoose';

export interface ISeoProduct extends Document {
  query: string;
  source: string; // e.g., Etsy, Buffalo Jackson
  title: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  rating?: number;
  reviews?: number;
  thumbnail?: string;
  productId?: string;
  productApiUrl?: string;
  link?: string;
  badges?: string[];
  extractedAt: Date;
}

const SeoProductSchema = new Schema<ISeoProduct>({
  query: { type: String, required: true, index: true },
  source: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number },
  originalPrice: { type: Number },
  currency: { type: String },
  rating: { type: Number },
  reviews: { type: Number },
  thumbnail: { type: String },
  productId: { type: String },
  productApiUrl: { type: String },
  link: { type: String },
  badges: [{ type: String }],
  extractedAt: { type: Date, default: Date.now }
}, { timestamps: true });

SeoProductSchema.index({ query: 1, title: 1, source: 1 });

export default mongoose.models.SeoProduct || mongoose.model<ISeoProduct>('SeoProduct', SeoProductSchema);

