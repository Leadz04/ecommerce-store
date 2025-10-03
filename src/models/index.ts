// Import all models to ensure they are registered with Mongoose
import User from './User';
import Role from './Role';
import Product from './Product';
import Order from './Order';
import OrderCounter from './OrderCounter';
import AuditLog from './AuditLog';
import ProductVersion from './ProductVersion';
import AnalyticsEvent from './AnalyticsEvent';
import SearchEvent from './SearchEvent';
import EtsyShop from './EtsyShop';
import EtsyListing from './EtsyListing';
import EtsyOrder from './EtsyOrder';
// Removed eRank-specific models (Keyword, Competitor, Trend, ShopHealth)
import SeoQuery from './SeoQuery';
import SeoKeyword from './SeoKeyword';
import SeoProduct from './SeoProduct';
import Blog from './Blog';
import KeywordResearch from './KeywordResearch';

// Export all models for easy importing
export { default as User } from './User';
export { default as Role } from './Role';
export { default as Product } from './Product';
export { default as Order } from './Order';
export { default as OrderCounter } from './OrderCounter';
export { default as Occasion } from './Occasion';
export { default as AuditLog } from './AuditLog';
export { default as ProductVersion } from './ProductVersion';
export { default as AnalyticsEvent } from './AnalyticsEvent';
export { default as SearchEvent } from './SearchEvent';
export { default as EtsyShop } from './EtsyShop';
export { default as EtsyListing } from './EtsyListing';
export { default as EtsyOrder } from './EtsyOrder';
// eRank-specific model exports removed
export { default as SeoQuery } from './SeoQuery';
export { default as SeoKeyword } from './SeoKeyword';
export { default as SeoProduct } from './SeoProduct';
export { default as Blog } from './Blog';
export { default as KeywordResearch } from './KeywordResearch';

// Export interfaces
export type { IUser } from './User';
export type { IRole } from './Role';
export type { IProduct } from './Product';
export type { IOrder } from './Order';
export type { IOrderCounter } from './OrderCounter';
export type { IOccasion } from './Occasion';
export type { IAuditLog } from './AuditLog';
export type { IProductVersion } from './ProductVersion';
export type { IEtsyShop } from './EtsyShop';
export type { IEtsyListing } from './EtsyListing';
export type { IEtsyOrder } from './EtsyOrder';
// eRank-specific interface exports removed
export type { ISeoQuery } from './SeoQuery';
export type { ISeoKeyword } from './SeoKeyword';
export type { ISeoProduct } from './SeoProduct';
export type { IKeywordResearch } from './KeywordResearch';
