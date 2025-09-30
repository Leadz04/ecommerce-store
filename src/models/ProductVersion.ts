import mongoose, { Document, Schema } from 'mongoose';

export interface IProductVersion extends Document {
  productId?: string | null;
  action: 'created' | 'updated' | 'unchanged';
  externalId?: string | null;
  source: string; // e.g., wolveyes
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  diff?: Array<{ field: string; before: any; after: any }>;
  fetchedAt: Date;
  createdAt: Date;
}

const ProductVersionSchema = new Schema<IProductVersion>({
  productId: { type: String, index: true },
  action: { type: String, enum: ['created', 'updated', 'unchanged'], required: true, index: true },
  externalId: { type: String, index: true },
  source: { type: String, required: true, index: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  diff: [{ field: String, before: Schema.Types.Mixed, after: Schema.Types.Mixed }],
  fetchedAt: { type: Date, required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.models.ProductVersion || mongoose.model<IProductVersion>('ProductVersion', ProductVersionSchema);
