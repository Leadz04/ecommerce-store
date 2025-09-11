export interface Product {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  tags: string[];
  specifications?: Record<string, string>;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  image?: string; // For easier access in order displays
  name?: string; // For easier access in order displays
  price?: number; // For easier access in order displays
}

export interface User {
  id: string;
  _id?: string; // For MongoDB compatibility
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  address?: Address;
  role: {
    _id: string;
    name: string;
    description: string;
  };
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface AuthUser {
  id: string;
  _id?: string; // For MongoDB compatibility
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  address?: Address;
  role: {
    _id: string;
    name: string;
    description: string;
  };
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  settings?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  };
}

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface Order {
  _id: string;
  id?: string; // For backward compatibility
  orderNumber?: string;
  userId: string;
  items: CartItem[];
  subtotal?: number;
  shipping?: number;
  tax?: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
}
