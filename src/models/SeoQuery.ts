import mongoose, { Document, Schema } from 'mongoose';

export interface ISeoQuery extends Document {
  query: string;
  type: 'keywords' | 'products';
  resultsCount: number;
  metadata?: any;
  rawResponse?: any;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SeoQuerySchema = new Schema<ISeoQuery>({
  query: { type: String, required: true, index: true },
  type: { type: String, enum: ['keywords', 'products'], required: true },
  resultsCount: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed },
  rawResponse: { type: Schema.Types.Mixed },
  createdBy: { type: String }
}, { timestamps: true });

SeoQuerySchema.index({ query: 1, type: 1, createdAt: -1 });

export default mongoose.models.SeoQuery || mongoose.model<ISeoQuery>('SeoQuery', SeoQuerySchema);

