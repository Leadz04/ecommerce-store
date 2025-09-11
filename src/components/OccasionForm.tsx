'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Image, Link, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface Occasion {
  _id?: string;
  name: string;
  description: string;
  date: string;
  orderDaysBefore: number;
  image: string;
  link: string;
  isActive: boolean;
}

interface OccasionFormProps {
  occasion?: Occasion | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (occasion: Occasion) => void;
  isLoading?: boolean;
}

export default function OccasionForm({ 
  occasion, 
  isOpen, 
  onClose, 
  onSave, 
  isLoading = false 
}: OccasionFormProps) {
  const [formData, setFormData] = useState<Occasion>({
    name: '',
    description: '',
    date: '',
    orderDaysBefore: 3,
    image: '',
    link: '/products?category=gifts',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (occasion) {
      setFormData({
        _id: occasion._id,
        name: occasion.name,
        description: occasion.description,
        date: occasion.date ? new Date(occasion.date).toISOString().split('T')[0] : '',
        orderDaysBefore: occasion.orderDaysBefore,
        image: occasion.image,
        link: occasion.link,
        isActive: occasion.isActive
      });
    } else {
      setFormData({
        name: '',
        description: '',
        date: '',
        orderDaysBefore: 3,
        image: '',
        link: '/products?category=gifts',
        isActive: true
      });
    }
    setErrors({});
  }, [occasion, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'Date cannot be in the past';
      }
    }

    if (formData.orderDaysBefore < 1 || formData.orderDaysBefore > 30) {
      newErrors.orderDaysBefore = 'Order days before must be between 1 and 30';
    }

    if (!formData.image.trim()) {
      newErrors.image = 'Image URL is required';
    } else if (!isValidUrl(formData.image)) {
      newErrors.image = 'Please enter a valid image URL';
    }

    if (!formData.link.trim()) {
      newErrors.link = 'Link is required';
    } else if (!formData.link.startsWith('/')) {
      newErrors.link = 'Link must start with /';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    onSave(formData);
  };

  const handleChange = (field: keyof Occasion, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {occasion ? 'Edit Occasion' : 'Add New Occasion'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Occasion Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Valentine's Day"
              maxLength={100}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe the occasion and why it's special"
              maxLength={500}
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>{errors.description}</span>
              <span>{formData.description.length}/500</span>
            </div>
          </div>

          {/* Date and Order Days Before */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Occasion Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Order Days Before
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.orderDaysBefore}
                onChange={(e) => handleChange('orderDaysBefore', parseInt(e.target.value) || 3)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.orderDaysBefore ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.orderDaysBefore && (
                <p className="mt-1 text-sm text-red-600">{errors.orderDaysBefore}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                How many days before the occasion to recommend ordering
              </p>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Image className="inline h-4 w-4 mr-1" />
              Image URL *
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => handleChange('image', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.image ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://images.unsplash.com/photo-..."
            />
            {errors.image && (
              <p className="mt-1 text-sm text-red-600">{errors.image}</p>
            )}
            {formData.image && (
              <div className="mt-2">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Link className="inline h-4 w-4 mr-1" />
              Shop Link *
            </label>
            <input
              type="text"
              value={formData.link}
              onChange={(e) => handleChange('link', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.link ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="/products?category=gifts"
            />
            {errors.link && (
              <p className="mt-1 text-sm text-red-600">{errors.link}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Link to products page (must start with /)
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Status
              </label>
              <p className="text-xs text-gray-500">
                Only active occasions will be shown to customers
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('isActive', !formData.isActive)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                formData.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {formData.isActive ? (
                <ToggleRight className="h-5 w-5" />
              ) : (
                <ToggleLeft className="h-5 w-5" />
              )}
              <span>{formData.isActive ? 'Active' : 'Inactive'}</span>
            </button>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : (occasion ? 'Update Occasion' : 'Create Occasion')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
