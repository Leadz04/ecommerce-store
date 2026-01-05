'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Plus, Trash2, Check, X as XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { PERMISSIONS } from '@/lib/permissions';

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

interface RoleFormProps {
  role?: Role;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Group permissions by category for better organization
const PERMISSION_GROUPS = {
  'User Management': [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE_ROLES
  ],
  'Product Management': [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRODUCT_MANAGE_INVENTORY
  ],
  'Order Management': [
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_VIEW_ALL,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.ORDER_FULFILL
  ],
  'Category Management': [
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_UPDATE,
    PERMISSIONS.CATEGORY_DELETE
  ],
  'Analytics & Reports': [
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.DASHBOARD_VIEW
  ],
  'System Administration': [
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_LOGS
  ],
  'Content Management': [
    PERMISSIONS.CONTENT_MANAGE,
    PERMISSIONS.BANNER_MANAGE,
    PERMISSIONS.PAGE_MANAGE
  ],
  'Customer Support': [
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_RESPOND,
    PERMISSIONS.SUPPORT_RESOLVE
  ]
};

export default function RoleForm({ role, isOpen, onClose, onSuccess }: RoleFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        permissions: role.permissions || [],
        isActive: role.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: [],
        isActive: true
      });
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = role ? `/api/admin/roles/${role._id}` : '/api/admin/roles';
      const method = role ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save role');
      }

      toast.success(role ? 'Role updated successfully' : 'Role created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Role save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleSelectAll = (groupPermissions: string[]) => {
    const allSelected = groupPermissions.every(p => formData.permissions.includes(p));
    
    if (allSelected) {
      // Deselect all in group
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !groupPermissions.includes(p))
      }));
    } else {
      // Select all in group
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...groupPermissions])]
      }));
    }
  };

  const getPermissionLabel = (permission: string) => {
    const parts = permission.split(':');
    const action = parts[1]?.replace(/_/g, ' ').toUpperCase() || '';
    const resource = parts[0]?.replace(/_/g, ' ').toUpperCase() || '';
    return `${action} ${resource}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {role ? 'Edit Role' : 'Create New Role'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="h-4 w-4 inline mr-2" />
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter role name (e.g., MANAGER)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter role description"
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active Role
              </label>
            </div>

            {/* Permissions */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Permissions ({formData.permissions.length})
                </h3>
                <div className="text-sm text-gray-500">
                  Select permissions for this role
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(PERMISSION_GROUPS).map(([groupName, groupPermissions]) => {
                  const selectedCount = groupPermissions.filter(p => formData.permissions.includes(p)).length;
                  const allSelected = selectedCount === groupPermissions.length;
                  const someSelected = selectedCount > 0 && selectedCount < groupPermissions.length;

                  return (
                    <div key={groupName} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{groupName}</h4>
                        <button
                          type="button"
                          onClick={() => handleSelectAll(groupPermissions)}
                          className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                            allSelected
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : someSelected
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {allSelected ? (
                            <>
                              <Check className="h-4 w-4" />
                              <span>All Selected</span>
                            </>
                          ) : someSelected ? (
                            <>
                              <span>{selectedCount}/{groupPermissions.length}</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              <span>Select All</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {groupPermissions.map(permission => (
                          <label
                            key={permission}
                            className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission)}
                              onChange={() => handlePermissionToggle(permission)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">
                              {getPermissionLabel(permission)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.permissions.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (role ? 'Update Role' : 'Create Role')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
