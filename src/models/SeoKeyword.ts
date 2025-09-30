import mongoose, { Document, Schema } from 'mongoose';

export interface ISeoKeyword extends Document {
  query: string;
  keyword: string;
  searchVolume?: number;
  competition?: 'low' | 'medium' | 'high';
  difficulty?: number;
  source: 'serpapi';
  createdAt: Date;
}

const SeoKeywordSchema = new Schema<ISeoKeyword>({
  query: { type: String, required: true, index: true },
  keyword: { type: String, required: true },
  searchVolume: { type: Number },
  competition: { type: String, enum: ['low', 'medium', 'high'] },
  difficulty: { type: Number },
  source: { type: String, enum: ['serpapi'], required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

SeoKeywordSchema.index({ query: 1, keyword: 1 }, { unique: true });

export default mongoose.models.SeoKeyword || mongoose.model<ISeoKeyword>('SeoKeyword', SeoKeywordSchema);

