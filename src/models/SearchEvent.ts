import mongoose, { Schema, Document } from 'mongoose';

export interface ISearchEvent extends Document {
  userId?: string;
  sessionId?: string;
  query: string;
  resultsCount: number;
  createdAt: Date;
}

const SearchEventSchema = new Schema<ISearchEvent>({
  userId: { type: String, index: true },
  sessionId: { type: String, index: true },
  query: { type: String, required: true, index: true },
  resultsCount: { type: Number, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

SearchEventSchema.index({ createdAt: -1 });

export default mongoose.models.SearchEvent || mongoose.model<ISearchEvent>('SearchEvent', SearchEventSchema);


