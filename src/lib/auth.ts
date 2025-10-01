import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { PERMISSIONS, hasPermission, hasAnyPermission, hasAllPermissions } from './permissions';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

// Helper function to verify JWT token
export async function verifyToken(request: NextRequest): Promise<AuthUser> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // Dev bypass: allow admin access without token when explicitly enabled
    if (process.env.ALLOW_DEV_ADMIN === '1') {
      return {
        userId: 'dev-user',
        email: 'dev@local',
        role: 'SUPER_ADMIN',
        permissions: Object.values(PERMISSIONS as any)
      } as AuthUser;
    }
    throw new Error('No token provided');
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    // Dev bypass on invalid token
    if (process.env.ALLOW_DEV_ADMIN === '1') {
      return {
        userId: 'dev-user',
        email: 'dev@local',
        role: 'SUPER_ADMIN',
        permissions: Object.values(PERMISSIONS as any)
      } as AuthUser;
    }
    throw new Error('Invalid token');
  }
  
  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    permissions: decoded.permissions || []
  };
}

// Middleware to check if user has specific permission
export function requirePermission(permission: string) {
  return async (request: NextRequest): Promise<AuthUser> => {
    const user = await verifyToken(request);
    
    if (!hasPermission(user.permissions, permission)) {
      throw new Error(`Insufficient permissions. Required: ${permission}`);
    }
    
    return user;
  };
}

// Middleware to check if user has any of the required permissions
export function requireAnyPermission(permissions: string[]) {
  return async (request: NextRequest): Promise<AuthUser> => {
    const user = await verifyToken(request);
    
    if (!hasAnyPermission(user.permissions, permissions)) {
      throw new Error(`Insufficient permissions. Required one of: ${permissions.join(', ')}`);
    }
    
    return user;
  };
}

// Middleware to check if user has all required permissions
export function requireAllPermissions(permissions: string[]) {
  return async (request: NextRequest): Promise<AuthUser> => {
    const user = await verifyToken(request);
    
    if (!hasAllPermissions(user.permissions, permissions)) {
      throw new Error(`Insufficient permissions. Required all of: ${permissions.join(', ')}`);
    }
    
    return user;
  };
}

// Middleware to check if user is admin or has specific permission
export function requireAdminOrPermission(permission: string) {
  return async (request: NextRequest): Promise<AuthUser> => {
    const user = await verifyToken(request);
    
    const isAdmin = hasPermission(user.permissions, PERMISSIONS.SYSTEM_SETTINGS);
    const hasRequiredPermission = hasPermission(user.permissions, permission);
    
    if (!isAdmin && !hasRequiredPermission) {
      throw new Error(`Insufficient permissions. Required admin access or: ${permission}`);
    }
    
    return user;
  };
}

// Helper to check permissions in components
export function checkPermission(userPermissions: string[], requiredPermission: string): boolean {
  return hasPermission(userPermissions, requiredPermission);
}

export function checkAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return hasAnyPermission(userPermissions, requiredPermissions);
}

export function checkAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return hasAllPermissions(userPermissions, requiredPermissions);
}
