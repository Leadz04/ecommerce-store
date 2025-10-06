import mongoose, { Schema, Connection, Model } from 'mongoose';
import connectScrapedDB from '@/lib/mongodb-scraped';

export interface IScrapedPage {
  _id?: string;
  url: string;
  title?: string;
  html?: string;
  meta?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IScrapedProduct {
  _id?: string;
  sourceUrl: string;
  title: string;
  description?: string;
  price?: number;
  images?: string[];
  specs?: Record<string, string>;
  raw?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

const ScrapedPageSchema = new Schema<IScrapedPage>({
  url: { type: String, required: true, index: true },
  title: { type: String },
  html: { type: String },
  meta: { type: Schema.Types.Mixed },
}, { timestamps: true });

const ScrapedProductSchema = new Schema<IScrapedProduct>({
  sourceUrl: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number },
  images: [{ type: String }],
  specs: { type: Map, of: String },
  raw: { type: Schema.Types.Mixed },
}, { timestamps: true });

let ScrapedPageModel: Model<IScrapedPage> | null = null;
let ScrapedProductModel: Model<IScrapedProduct> | null = null;

export async function getScrapedModels() {
  const conn: Connection = await connectScrapedDB();
  ScrapedPageModel = (conn.models.ScrapedPage as Model<IScrapedPage>) || conn.model<IScrapedPage>('ScrapedPage', ScrapedPageSchema);
  ScrapedProductModel = (conn.models.ScrapedProduct as Model<IScrapedProduct>) || conn.model<IScrapedProduct>('ScrapedProduct', ScrapedProductSchema);
  return { ScrapedPage: ScrapedPageModel, ScrapedProduct: ScrapedProductModel };
}


