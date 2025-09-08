'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { checkPermission, checkAnyPermission, checkAllPermissions } from '@/lib/auth';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

export default function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  redirectTo
}: PermissionGuardProps) {
  const { user } = useAuthStore();

  if (!user || !user.permissions) {
    return <>{fallback}</>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = checkPermission(user.permissions, permission);
  } else if (permissions) {
    if (requireAll) {
      hasAccess = checkAllPermissions(user.permissions, permissions);
    } else {
      hasAccess = checkAnyPermission(user.permissions, permissions);
    }
  } else {
    // If no permission specified, allow access
    hasAccess = true;
  }

  if (!hasAccess) {
    if (redirectTo) {
      // In a real app, you might want to use router.push here
      window.location.href = redirectTo;
      return null;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard permission="system:settings" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function UserManagementOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard permission="user:view" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function ProductManagementOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard permission="product:view" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function OrderManagementOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard permission="order:view" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}
