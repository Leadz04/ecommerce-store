import mongoose, { Document, Schema } from 'mongoose';

export interface IEtsyListing extends Document {
  etsyListingId: string;
  shopId: string;
  productId?: string; // Reference to our internal product
  title: string;
  description: string;
  price: number;
  currency: string;
  state: 'active' | 'inactive' | 'draft';
  tags: string[];
  materials: string[];
  categoryPath: string[];
  images: Array<{
    url: string;
    rank: number;
    listingImageId: string;
  }>;
  variations: Array<{
    propertyId: string;
    valueId: string;
    name: string;
    value: string;
  }>;
  inventory: {
    quantity: number;
    sku?: string;
  };
  seoTitle?: string;
  seoDescription?: string;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EtsyListingSchema = new Schema<IEtsyListing>({
  etsyListingId: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  state: { type: String, enum: ['active', 'inactive', 'draft'], default: 'draft' },
  tags: [{ type: String }],
  materials: [{ type: String }],
  categoryPath: [{ type: String }],
  images: [{
    url: { type: String, required: true },
    rank: { type: Number, required: true },
    listingImageId: { type: String, required: true }
  }],
  variations: [{
    propertyId: { type: String, required: true },
    valueId: { type: String, required: true },
    name: { type: String, required: true },
    value: { type: String, required: true }
  }],
  inventory: {
    quantity: { type: Number, default: 0 },
    sku: { type: String }
  },
  seoTitle: { type: String },
  seoDescription: { type: String },
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.models.EtsyListing || mongoose.model<IEtsyListing>('EtsyListing', EtsyListingSchema);
