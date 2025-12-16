import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { EtsyShop } from '@/models';

/**
 * Get the current authenticated user ID from the request
 * @throws Error if no valid token is provided
 */
export async function getCurrentUserId(request: NextRequest): Promise<string> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No authentication token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid or expired authentication token');
  }
}

/**
 * Get the current authenticated user ID from the request (optional - returns null if no token)
 */
export async function getCurrentUserIdOptional(request: NextRequest): Promise<string | null> {
  try {
    return await getCurrentUserId(request);
  } catch {
    return null;
  }
}

/**
 * Get and validate a shop for the current user
 * @param userId - Current user ID
 * @param shopId - Shop ID to retrieve (optional, gets first active shop if not provided)
 * @returns Shop document or null
 */
export async function getUserShop(userId: string, shopId?: string): Promise<any> {
  const query: any = { userId, isActive: true };
  if (shopId) {
    query.shopId = shopId;
  }
  
  const shop = shopId 
    ? await EtsyShop.findOne(query)
    : await EtsyShop.findOne(query).sort({ createdAt: -1 }); // Get most recently added shop
    
  return shop;
}
