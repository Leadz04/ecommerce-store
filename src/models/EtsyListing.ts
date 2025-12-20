import mongoose, { Document, Schema } from 'mongoose';

export interface IEtsyListing extends Document {
  userId: string; // User who owns this listing's shop
  etsyListingId: string;
  shopId: string; // Etsy shop ID
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
  views?: number;
  numFavorers?: number;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EtsyListingSchema = new Schema<IEtsyListing>({
  userId: { type: String, required: true, index: true }, // User who owns this listing's shop
  etsyListingId: { type: String, required: true },
  shopId: { type: String, required: true, index: true }, // Etsy shop ID
  productId: { type: String, ref: 'Product' },
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
  views: { type: Number, default: 0 },
  numFavorers: { type: Number, default: 0 },
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound index for efficient queries by user and shop
EtsyListingSchema.index({ userId: 1, shopId: 1 });
// Keep etsyListingId unique globally (or make it unique per user+shop if needed)
EtsyListingSchema.index({ etsyListingId: 1 }, { unique: true });
// Index on productId for fast lookups of synced products
EtsyListingSchema.index({ productId: 1 });
// Compound index for productId + shopId lookups (most common query pattern)
EtsyListingSchema.index({ productId: 1, shopId: 1 });
// Index for filtering by state (active/inactive/draft)
EtsyListingSchema.index({ state: 1, productId: 1 });

export default mongoose.models.EtsyListing || mongoose.model<IEtsyListing>('EtsyListing', EtsyListingSchema);
