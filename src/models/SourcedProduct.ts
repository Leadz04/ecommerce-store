import mongoose, { Schema, Model, Connection, Document } from 'mongoose';
import connectScrapedDB from '@/lib/mongodb-scraped';

export interface ISourcedProduct extends Document {
  title: string;
  sourceUrl: string;
  categoryGroup: string; // e.g., 'Men:.../categories/Mens-Leather-Jackets'
  price?: number;
  description?: string;
  images: string[];
  specs?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const SourcedProductSchema = new Schema<ISourcedProduct>({
  title: { type: String, required: true, index: true },
  sourceUrl: { type: String, required: true, index: true },
  categoryGroup: { type: String, required: true, index: true },
  price: { type: Number },
  description: { type: String },
  images: [{ type: String }],
  specs: { type: Map, of: String },
}, { timestamps: true });

// Unique within category on normalized title
SourcedProductSchema.index({ categoryGroup: 1, title: 1 }, { unique: true });

let SourcedProductModel: Model<ISourcedProduct> | null = null;

export async function getSourcedProductModel() {
  const conn: Connection = await connectScrapedDB();
  SourcedProductModel = (conn.models.SourcedProduct as Model<ISourcedProduct>) || conn.model<ISourcedProduct>('SourcedProduct', SourcedProductSchema);
  return SourcedProductModel;
}


