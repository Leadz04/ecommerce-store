import mongoose, { Document, Schema } from 'mongoose';

export interface IEtsyShop extends Document {
  shopId: string;
  shopName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  isActive: boolean;
  syncSettings: {
    autoSyncProducts: boolean;
    autoSyncOrders: boolean;
    autoSyncInventory: boolean;
    syncInterval: number; // minutes
  };
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EtsyShopSchema = new Schema<IEtsyShop>({
  shopId: { type: String, required: true, unique: true },
  shopName: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  syncSettings: {
    autoSyncProducts: { type: Boolean, default: true },
    autoSyncOrders: { type: Boolean, default: true },
    autoSyncInventory: { type: Boolean, default: true },
    syncInterval: { type: Number, default: 60 } // 60 minutes
  },
  lastSyncAt: { type: Date },
}, {
  timestamps: true
});

export default mongoose.models.EtsyShop || mongoose.model<IEtsyShop>('EtsyShop', EtsyShopSchema);
