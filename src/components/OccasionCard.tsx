'use client';

import { useState } from 'react';
import { Calendar, Gift, Clock, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';

interface Occasion {
  id: string;
  name: string;
  description: string;
  date: Date | string;
  daysUntil: number;
  orderByDate: Date | string;
  urgency: 'today' | 'urgent' | 'medium' | 'low';
  isActive: boolean;
  image: string;
  link: string;
}

interface OccasionCardProps {
  occasion: Occasion;
  onDismiss?: (occasionId: string) => void;
  showDismiss?: boolean;
  variant?: 'banner' | 'card';
}

export default function OccasionCard({ 
  occasion, 
  onDismiss, 
  showDismiss = true, 
  variant = 'banner' 
}: OccasionCardProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    if (dismissed) return;
    
    setDismissed(true);
    onDismiss?.(occasion.id);
  };

  if (dismissed) return null;

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil === 0) return 'bg-red-500';
    if (daysUntil <= 3) return 'bg-orange-500';
    if (daysUntil <= 7) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getUrgencyText = (daysUntil: number) => {
    if (daysUntil === 0) return 'Today!';
    if (daysUntil === 1) return 'Tomorrow!';
    return `In ${daysUntil} days`;
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });
  };

  if (variant === 'card') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full ${getUrgencyColor(occasion.daysUntil)} flex items-center justify-center`}>
                <Gift className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {occasion.name}
                </h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(occasion.daysUntil)} text-white`}>
                  <Clock className="h-3 w-3 mr-1" />
                  {getUrgencyText(occasion.daysUntil)}
                </span>
              </div>
              <p className="text-gray-600 mb-3">
                {occasion.description}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Date: {formatDate(occasion.date)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Order by: {formatDate(occasion.orderByDate)}</span>
                </div>
              </div>
            </div>
          </div>
          {showDismiss && (
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  // Banner variant
  return (
    <div className={`${getUrgencyColor(occasion.daysUntil)} text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Gift className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold">
                  {occasion.name} Reminder
                </h3>
                <span className="inline-flex items-center px-2 py-1 text-gray-600 rounded-full text-xs font-medium bg-white bg-opacity-20">
                  <Clock className="h-3 w-3 mr-1" />
                  {getUrgencyText(occasion.daysUntil)}
                </span>
              </div>
              <p className="text-sm opacity-90 mt-1">
                {occasion.description}
                {occasion.daysUntil > 0 && (
                  <span className="ml-2">
                    Order by {formatDate(occasion.orderByDate)} to ensure delivery!
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/products"
              className="inline-flex items-center px-4 py-2 text-gray-600 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Shop Now
            </Link>
            {showDismiss && (
              <button
                onClick={handleDismiss}
                className="text-white hover:text-gray-200 transition-colors"
                title="Dismiss reminder"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
