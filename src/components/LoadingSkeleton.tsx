'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden">
      <div className="p-6 border-b-2 border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <Skeleton className="h-8 w-24 rounded-full" />
            <div className="text-right">
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OccasionCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-64 mb-3" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
        <Skeleton className="h-5 w-5" />
      </div>
      <div className="mt-4 flex justify-end">
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-6">
            <div className="flex items-center space-x-4">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-12 w-48 bg-white/20" />
          <Skeleton className="h-6 w-96 mt-2 bg-white/20" />
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-32 mx-auto mb-1" />
                  <Skeleton className="h-4 w-48 mx-auto mb-4" />
                  <Skeleton className="h-4 w-32 mx-auto mb-6" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <Skeleton className="h-10 w-full mt-6 rounded-lg" />
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <div className="space-y-6">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <Skeleton className="aspect-square w-full rounded-xl" />
            
            {/* Thumbnail Images */}
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            {/* Brand and Name */}
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-3/4 mb-4" />
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-5 rounded" />
                ))}
              </div>
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Price */}
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Description */}
            <div>
              <Skeleton className="h-6 w-32 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Size Selection */}
            <div>
              <Skeleton className="h-6 w-16 mb-3" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-12 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <Skeleton className="h-6 w-20 mb-3" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-16 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <Skeleton className="h-6 w-20 mb-3" />
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-32 mt-2" />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Skeleton className="flex-1 h-12 rounded-lg" />
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="mt-16">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Skeleton key={j} className="h-3 w-3 rounded" />
                      ))}
                    </div>
                    <Skeleton className="h-3 w-8 ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoriesSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Skeleton className="h-12 w-80 mx-auto mb-4 bg-white/20" />
          <Skeleton className="h-6 w-96 mx-auto bg-white/20" />
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                {/* Category Image */}
                <Skeleton className="h-48 w-full" />
                
                {/* Category Info */}
                <div className="p-6">
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-4" />
                  
                  {/* Featured Products */}
                  <div className="mb-4">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <div className="space-y-1">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="flex items-center justify-between">
                          <Skeleton className="h-3 w-24" />
                          <div className="flex items-center">
                            <Skeleton className="h-3 w-3 rounded mr-1" />
                            <Skeleton className="h-3 w-6" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* View Category Button */}
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-lg" />
                <Skeleton className="h-5 w-24 mx-auto mb-1" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-80 mx-auto mb-4" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function CategoryDetailSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Category Header */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-4">
            <Skeleton className="h-5 w-40 bg-white/20" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <Skeleton className="h-12 w-80 mb-4 bg-white/20" />
              <Skeleton className="h-6 w-full mb-2 bg-white/20" />
              <Skeleton className="h-6 w-3/4 mb-6 bg-white/20" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-32 rounded-full bg-white/20" />
                <div className="flex items-center">
                  <Skeleton className="h-5 w-5 rounded mr-1 bg-white/20" />
                  <Skeleton className="h-5 w-32 bg-white/20" />
                </div>
              </div>
            </div>
            <div className="relative">
              <Skeleton className="w-full h-80 rounded-lg bg-white/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="flex-1 relative">
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            {/* View Mode and Sort */}
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-24 rounded-lg" />
              <Skeleton className="h-12 w-32 rounded-lg" />
              <Skeleton className="h-12 w-24 rounded-lg" />
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-6">
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Loading State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-12">
            <div className="flex space-x-3">
              <Skeleton className="h-10 w-20 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-10 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Skeleton className="w-8 h-8 rounded" />
                <div className="ml-4">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <TableSkeleton rows={10} columns={6} />
      </div>
    </div>
  );
}

export default function LoadingSkeleton() {
  return <PageSkeleton />;
}
