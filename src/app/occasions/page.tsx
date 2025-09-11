'use client';

import { useState, useEffect } from 'react';
import { Calendar, Gift, Clock, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
// import { getActiveOccasions, Occasion } from '@/data/occasions';
import OccasionCard from '@/components/OccasionCard';
import { OccasionCardSkeleton } from '@/components/LoadingSkeleton';
import { useAuthStore } from '@/store/authStore';

interface Occasion {
  id: string;
  name: string;
  description: string;
  date: Date;
  daysUntil: number;
  orderByDate: Date;
  urgency: 'today' | 'urgent' | 'medium' | 'low';
  isActive: boolean;
  image: string;
  link: string;
}

export default function OccasionsPage() {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = !!(isAuthenticated && (user as any)?.permissions?.includes('system:settings'));

  useEffect(() => {
    const fetchOccasions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/occasions');
        if (!response.ok) {
          throw new Error('Failed to fetch occasions');
        }
        
        const data = await response.json();
        setOccasions(data.occasions || []);
      } catch (error) {
        console.error('Error fetching occasions:', error);
        setOccasions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOccasions();
  }, []);

  // Note: Dismissals only affect the header banner, not this list

  const handleResetHidden = () => {
    try {
      localStorage.removeItem('dismissedOccasions');
      // Reload to allow the header banner to reappear if applicable
      window.location.reload();
    } catch (_) {
      // no-op
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Upcoming Gift-Giving Occasions
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Don't miss out on these special occasions! Order early to ensure your gifts arrive on time.
            </p>
            {isAdmin && (
              <div className="mt-4">
                <button
                  onClick={handleResetHidden}
                  className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Reset hidden reminders
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <OccasionCardSkeleton key={i} />
            ))}
          </div>
        ) : occasions.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No upcoming occasions
            </h3>
            <p className="text-gray-600 mb-6">
              There are no gift-giving occasions coming up in the next 30 days.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats - Admin only */}
            {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Occasions</p>
                    <p className="text-2xl font-semibold text-gray-900">{occasions.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Within 7 Days</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {occasions.filter(o => o.daysUntil <= 7).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Gift className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Reminders</p>
                    <p className="text-2xl font-semibold text-gray-900">{occasions.length}</p>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Occasions List */}
            <div className="space-y-4">
              {occasions.map((occasion) => (
                <OccasionCard
                  key={occasion.id}
                  occasion={occasion}
                  showDismiss={false}
                  variant="card"
                />
              ))}
            </div>

            {/* Call to Action */}
            <div className="bg-blue-50 rounded-lg p-6 mt-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to start shopping?
                </h3>
                <p className="text-gray-600 mb-4">
                  Browse our curated collection of gifts perfect for any occasion.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Shop All Products
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
