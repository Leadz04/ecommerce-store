'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Shield, Settings, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: {
    _id: string;
    name: string;
    description: string;
  };
  isActive: boolean;
  address?: {
    firstName?: string;
    lastName?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  settings?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    theme: string;
    language: string;
  };
}

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface UserFormProps {
  user?: User;
  roles: Role[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserForm({ user, roles, isOpen, onClose, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    roleId: '',
    isActive: true,
    address: {
      firstName: '',
      lastName: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      phone: ''
    },
    settings: {
      emailNotifications: true,
      smsNotifications: false,
      theme: 'system',
      language: 'en'
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Don't pre-fill password
        phone: user.phone || '',
        roleId: user.role?._id || '',
        isActive: user.isActive ?? true,
        address: {
          firstName: user.address?.firstName || '',
          lastName: user.address?.lastName || '',
          address1: user.address?.address1 || '',
          address2: user.address?.address2 || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || 'United States',
          phone: user.address?.phone || ''
        },
        settings: {
          emailNotifications: user.settings?.emailNotifications ?? true,
          smsNotifications: user.settings?.smsNotifications ?? false,
          theme: user.settings?.theme || 'system',
          language: user.settings?.language || 'en'
        }
      });
    } else {
      // Reset form for new user
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        roleId: roles.find(r => r.name === 'CUSTOMER')?._id || '',
        isActive: true,
        address: {
          firstName: '',
          lastName: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States',
          phone: ''
        },
        settings: {
          emailNotifications: true,
          smsNotifications: false,
          theme: 'system',
          language: 'en'
        }
      });
    }
  }, [user, roles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = user ? `/api/admin/users/${user._id}` : '/api/admin/users';
      const method = user ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        // Don't send empty password for updates
        ...(user && !formData.password ? { password: undefined } : {})
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user');
      }

      toast.success(user ? 'User updated successfully' : 'User created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('User save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {user ? 'Edit User' : 'Create New User'}
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
                  <User className="h-4 w-4 inline mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300  text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300  text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300  text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="h-4 w-4 inline mr-2" />
                  Role *
                </label>
                <select
                  required
                  value={formData.roleId}
                  onChange={(e) => handleInputChange('roleId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300  text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a role</option>
                  {roles.map(role => (
                    <option key={role._id} value={role._id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              {!user && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300  text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500  text-gray-700 mb-2 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active User
                </label>
              </div>
            </div>

            {/* Address Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.address.firstName}
                  onChange={(e) => handleInputChange('address.firstName', e.target.value)}
                  className="px-3 py-2 border border-gray-300  text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="First Name"
                />
                <input
                  type="text"
                  value={formData.address.lastName}
                  onChange={(e) => handleInputChange('address.lastName', e.target.value)}
                  className="px-3 py-2 border border-gray-300  text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Last Name"
                />
                <input
                  type="text"
                  value={formData.address.address1}
                  onChange={(e) => handleInputChange('address.address1', e.target.value)}
                  className="px-3 py-2 border border-gray-300  text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Address Line 1"
                />
                <input
                  type="text"
                  value={formData.address.address2}
                  onChange={(e) => handleInputChange('address.address2', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg  text-gray-700 mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Address Line 2"
                />
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg  text-gray-700 mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg  text-gray-700 mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="State"
                />
                <input
                  type="text"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg  text-gray-700 mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ZIP Code"
                />
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg  text-gray-700 mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Country"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                User Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={formData.settings.emailNotifications}
                    onChange={(e) => handleInputChange('settings.emailNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500  text-gray-700 mb-2 border-gray-300 rounded"
                  />
                  <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
                    Email Notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="smsNotifications"
                    checked={formData.settings.smsNotifications}
                    onChange={(e) => handleInputChange('settings.smsNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500  text-gray-700 mb-2 border-gray-300 rounded"
                  />
                  <label htmlFor="smsNotifications" className="ml-2 block text-sm text-gray-700">
                    SMS Notifications
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={formData.settings.theme}
                    onChange={(e) => handleInputChange('settings.theme', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300  text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={formData.settings.language}
                    onChange={(e) => handleInputChange('settings.language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
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
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
