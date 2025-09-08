// Permission constants for the e-commerce system
export const PERMISSIONS = {
  // User Management
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage_roles',

  // Product Management
  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_MANAGE_INVENTORY: 'product:manage_inventory',

  // Order Management
  ORDER_VIEW: 'order:view',
  ORDER_VIEW_ALL: 'order:view_all',
  ORDER_UPDATE: 'order:update',
  ORDER_CANCEL: 'order:cancel',
  ORDER_FULFILL: 'order:fulfill',

  // Category Management
  CATEGORY_VIEW: 'category:view',
  CATEGORY_CREATE: 'category:create',
  CATEGORY_UPDATE: 'category:update',
  CATEGORY_DELETE: 'category:delete',

  // Analytics & Reports
  ANALYTICS_VIEW: 'analytics:view',
  REPORTS_GENERATE: 'reports:generate',
  DASHBOARD_VIEW: 'dashboard:view',

  // System Administration
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_LOGS: 'system:logs',

  // Content Management
  CONTENT_MANAGE: 'content:manage',
  BANNER_MANAGE: 'banner:manage',
  PAGE_MANAGE: 'page:manage',

  // Customer Support
  SUPPORT_VIEW: 'support:view',
  SUPPORT_RESPOND: 'support:respond',
  SUPPORT_RESOLVE: 'support:resolve'
} as const;

// Role definitions with their permissions
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE_ROLES,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRODUCT_MANAGE_INVENTORY,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_VIEW_ALL,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.ORDER_FULFILL,
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_UPDATE,
    PERMISSIONS.CATEGORY_DELETE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_LOGS,
    PERMISSIONS.CONTENT_MANAGE,
    PERMISSIONS.BANNER_MANAGE,
    PERMISSIONS.PAGE_MANAGE,
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_RESPOND,
    PERMISSIONS.SUPPORT_RESOLVE
  ],
  ADMIN: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_MANAGE_INVENTORY,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_VIEW_ALL,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_FULFILL,
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CONTENT_MANAGE,
    PERMISSIONS.BANNER_MANAGE,
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_RESPOND
  ],
  MANAGER: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_MANAGE_INVENTORY,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_VIEW_ALL,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_FULFILL,
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_RESPOND
  ],
  STAFF: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.SUPPORT_VIEW
  ],
  CUSTOMER: [
    PERMISSIONS.ORDER_VIEW // Can only view their own orders
  ]
} as const;

// Helper function to check if user has permission
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

// Helper function to check if user has any of the required permissions
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

// Helper function to check if user has all required permissions
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}
