// Import all models to ensure they are registered with Mongoose
import User from './User';
import Role from './Role';
import Product from './Product';
import Order from './Order';
import OrderCounter from './OrderCounter';

// Export all models for easy importing
export { default as User } from './User';
export { default as Role } from './Role';
export { default as Product } from './Product';
export { default as Order } from './Order';
export { default as OrderCounter } from './OrderCounter';
export { default as Occasion } from './Occasion';

// Export interfaces
export type { IUser } from './User';
export type { IRole } from './Role';
export type { IProduct } from './Product';
export type { IOrder } from './Order';
export type { IOrderCounter } from './OrderCounter';
export type { IOccasion } from './Occasion';
