'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Gift, Percent, Heart, ShoppingCart, Flame, 
  Package, Star, Copy, Check, Play, Trash2, Eye
} from 'lucide-react';

export default function ShopifyToolsPage() {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const apiCall = async (
    key: string,
    method: string,
    url: string,
    body?: any,
    successMessage?: string
  ) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined
      });
      
      const data = await response.json();
      setResponses(prev => ({ ...prev, [key]: { status: response.status, data } }));
      
      if (response.ok) {
        toast.success(successMessage || 'Success!');
      } else {
        toast.error(data.error || 'Request failed');
      }
    } catch (error: any) {
      setResponses(prev => ({ ...prev, [key]: { error: error.message } }));
      toast.error('Request failed: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const copyToClipboard = (key: string) => {
    const response = responses[key];
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(key);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const ResponseDisplay = ({ responseKey }: { responseKey: string }) => {
    const response = responses[responseKey];
    if (!response) return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-4 relative"
      >
        <div className="flex items-center justify-between mb-2">
          <Badge variant={response.status === 200 || response.status === 201 ? 'success' : 'destructive'}>
            {response.status ? `HTTP ${response.status}` : 'Error'}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(responseKey)}
          >
            {copied === responseKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-64 text-xs">
          {JSON.stringify(response, null, 2)}
        </pre>
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🛍️ Shopify Tools - API Testing
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test all Shopify-like features with interactive API calls
        </p>
      </div>

      <div className="grid gap-6">
        {/* Discounts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-6 h-6 text-blue-600" />
              Discount System
            </CardTitle>
            <CardDescription>Create, validate, and manage discount codes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => apiCall(
                  'discount-create',
                  'POST',
                  '/api/discounts',
                  {
                    code: 'TESTDISCOUNT20',
                    name: 'Test Discount 20%',
                    type: 'percentage',
                    value: 20,
                    minPurchaseAmount: 50,
                    status: 'active',
                    usageLimit: 100
                  },
                  'Discount created!'
                )}
                disabled={loading['discount-create']}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Create Discount
              </Button>

              <Button
                onClick={() => apiCall(
                  'discount-validate',
                  'GET',
                  '/api/discounts?code=TESTDISCOUNT20',
                  undefined,
                  'Discount validated!'
                )}
                disabled={loading['discount-validate']}
                variant="outline"
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Validate Code
              </Button>

              <Button
                onClick={() => apiCall(
                  'discount-apply',
                  'POST',
                  '/api/discounts/apply',
                  {
                    code: 'TESTDISCOUNT20',
                    orderTotal: 100,
                    items: [{ productId: 'test', price: 100, quantity: 1 }]
                  },
                  'Discount applied!'
                )}
                disabled={loading['discount-apply']}
                variant="outline"
                className="w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                Apply to Cart
              </Button>
            </div>

            <ResponseDisplay responseKey="discount-create" />
            <ResponseDisplay responseKey="discount-validate" />
            <ResponseDisplay responseKey="discount-apply" />
          </CardContent>
        </Card>

        {/* Gift Cards Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-6 h-6 text-purple-600" />
              Gift Card System
            </CardTitle>
            <CardDescription>Create gift cards and check balances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => apiCall(
                  'giftcard-create',
                  'POST',
                  '/api/gift-cards',
                  {
                    amount: 100,
                    currency: 'USD',
                    recipientEmail: 'test@example.com',
                    recipientName: 'Test User',
                    senderName: 'Admin',
                    message: 'Test gift card!'
                  },
                  'Gift card created!'
                )}
                disabled={loading['giftcard-create']}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Create Gift Card
              </Button>

              <Button
                onClick={() => {
                  const code = responses['giftcard-create']?.data?.giftCard?.code;
                  if (code) {
                    apiCall(
                      'giftcard-balance',
                      'GET',
                      `/api/gift-cards?code=${code}`,
                      undefined,
                      'Balance retrieved!'
                    );
                  } else {
                    toast.error('Create a gift card first!');
                  }
                }}
                disabled={loading['giftcard-balance']}
                variant="outline"
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Check Balance
              </Button>

              <Button
                onClick={() => {
                  const code = responses['giftcard-create']?.data?.giftCard?.code;
                  if (code) {
                    apiCall(
                      'giftcard-apply',
                      'POST',
                      '/api/gift-cards/apply',
                      {
                        code: code,
                        amount: 25,
                        orderId: 'test_order_123'
                      },
                      'Gift card applied!'
                    );
                  } else {
                    toast.error('Create a gift card first!');
                  }
                }}
                disabled={loading['giftcard-apply']}
                variant="outline"
                className="w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                Apply $25
              </Button>
            </div>

            <ResponseDisplay responseKey="giftcard-create" />
            <ResponseDisplay responseKey="giftcard-balance" />
            <ResponseDisplay responseKey="giftcard-apply" />
          </CardContent>
        </Card>

        {/* Loyalty Program Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-600" />
              Loyalty Program
            </CardTitle>
            <CardDescription>Manage customer loyalty points and rewards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                onClick={() => apiCall(
                  'loyalty-get',
                  'GET',
                  '/api/loyalty?userId=test_user_123',
                  undefined,
                  'Loyalty account loaded!'
                )}
                disabled={loading['loyalty-get']}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Get Account
              </Button>

              <Button
                onClick={() => apiCall(
                  'loyalty-purchase',
                  'POST',
                  '/api/loyalty',
                  {
                    userId: 'test_user_123',
                    action: 'purchase',
                    data: { amount: 100, orderId: 'test_order' }
                  },
                  'Points added for purchase!'
                )}
                disabled={loading['loyalty-purchase']}
                variant="outline"
                className="w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                Add Purchase Points
              </Button>

              <Button
                onClick={() => apiCall(
                  'loyalty-review',
                  'POST',
                  '/api/loyalty',
                  {
                    userId: 'test_user_123',
                    action: 'review',
                    data: { productId: 'test_product' }
                  },
                  'Points added for review!'
                )}
                disabled={loading['loyalty-review']}
                variant="outline"
                className="w-full"
              >
                <Star className="w-4 h-4 mr-2" />
                Add Review Points
              </Button>

              <Button
                onClick={() => apiCall(
                  'loyalty-redeem',
                  'POST',
                  '/api/loyalty',
                  {
                    userId: 'test_user_123',
                    action: 'redeem',
                    data: { points: 100, reason: 'Test redemption' }
                  },
                  'Points redeemed!'
                )}
                disabled={loading['loyalty-redeem']}
                variant="outline"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Redeem 100 Points
              </Button>
            </div>

            <ResponseDisplay responseKey="loyalty-get" />
            <ResponseDisplay responseKey="loyalty-purchase" />
            <ResponseDisplay responseKey="loyalty-review" />
            <ResponseDisplay responseKey="loyalty-redeem" />
          </CardContent>
        </Card>

        {/* Abandoned Carts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
              Abandoned Cart Recovery
            </CardTitle>
            <CardDescription>Track and recover abandoned shopping carts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => apiCall(
                  'cart-create',
                  'POST',
                  '/api/abandoned-carts',
                  {
                    sessionId: 'test_session_' + Date.now(),
                    email: 'customer@example.com',
                    customerName: 'Test Customer',
                    items: [
                      {
                        productId: 'prod_1',
                        productName: 'Test Product',
                        productImage: '/placeholder.jpg',
                        quantity: 2,
                        price: 50,
                        total: 100
                      }
                    ],
                    subtotal: 100,
                    total: 100,
                    itemCount: 2
                  },
                  'Cart tracked!'
                )}
                disabled={loading['cart-create']}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Track Cart
              </Button>

              <Button
                onClick={() => apiCall(
                  'cart-list',
                  'GET',
                  '/api/abandoned-carts?status=abandoned',
                  undefined,
                  'Carts loaded!'
                )}
                disabled={loading['cart-list']}
                variant="outline"
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                List Abandoned
              </Button>

              <Button
                onClick={() => apiCall(
                  'cart-process',
                  'POST',
                  '/api/abandoned-carts/process',
                  undefined,
                  'Carts processed!'
                )}
                disabled={loading['cart-process']}
                variant="outline"
                className="w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                Process Reminders
              </Button>
            </div>

            <ResponseDisplay responseKey="cart-create" />
            <ResponseDisplay responseKey="cart-list" />
            <ResponseDisplay responseKey="cart-process" />
          </CardContent>
        </Card>

        {/* Flash Sales Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-600" />
              Flash Sales
            </CardTitle>
            <CardDescription>Create and manage time-limited flash sales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => {
                  const now = new Date();
                  const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                  
                  apiCall(
                    'flashsale-create',
                    'POST',
                    '/api/flash-sales',
                    {
                      name: 'Test Flash Sale',
                      description: 'Limited time offer!',
                      startDate: now.toISOString(),
                      endDate: endDate.toISOString(),
                      products: [],
                      badgeText: 'FLASH SALE',
                      showCountdown: true,
                      highlightOnHomepage: true
                    },
                    'Flash sale created!'
                  );
                }}
                disabled={loading['flashsale-create']}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Create Flash Sale
              </Button>

              <Button
                onClick={() => apiCall(
                  'flashsale-list',
                  'GET',
                  '/api/flash-sales?status=active',
                  undefined,
                  'Flash sales loaded!'
                )}
                disabled={loading['flashsale-list']}
                variant="outline"
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                List Active
              </Button>

              <Button
                onClick={() => apiCall(
                  'flashsale-active',
                  'GET',
                  '/api/flash-sales/active',
                  undefined,
                  'Active sale loaded!'
                )}
                disabled={loading['flashsale-active']}
                variant="outline"
                className="w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                Get Active Sale
              </Button>
            </div>

            <ResponseDisplay responseKey="flashsale-create" />
            <ResponseDisplay responseKey="flashsale-list" />
            <ResponseDisplay responseKey="flashsale-active" />
          </CardContent>
        </Card>

        {/* Product Bundles Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-6 h-6 text-green-600" />
              Product Bundles
            </CardTitle>
            <CardDescription>Create product bundles with special pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => apiCall(
                  'bundle-create',
                  'POST',
                  '/api/bundles',
                  {
                    name: 'Test Bundle',
                    slug: 'test-bundle-' + Date.now(),
                    description: 'Amazing bundle deal',
                    products: [],
                    originalPrice: 150,
                    bundlePrice: 120,
                    featured: true
                  },
                  'Bundle created!'
                )}
                disabled={loading['bundle-create']}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Create Bundle
              </Button>

              <Button
                onClick={() => apiCall(
                  'bundle-list',
                  'GET',
                  '/api/bundles?featured=true',
                  undefined,
                  'Bundles loaded!'
                )}
                disabled={loading['bundle-list']}
                variant="outline"
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                List Featured
              </Button>
            </div>

            <ResponseDisplay responseKey="bundle-create" />
            <ResponseDisplay responseKey="bundle-list" />
          </CardContent>
        </Card>

        {/* Product Recommendations Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-600" />
              Product Recommendations
            </CardTitle>
            <CardDescription>AI-powered product recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => apiCall(
                  'recommendations-get',
                  'GET',
                  '/api/recommendations/test_product_123?type=related&limit=5',
                  undefined,
                  'Recommendations loaded!'
                )}
                disabled={loading['recommendations-get']}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Get Recommendations
              </Button>

              <Button
                onClick={() => apiCall(
                  'recommendations-track',
                  'POST',
                  '/api/recommendations/test_product_123',
                  {
                    type: 'related',
                    clickedProductId: 'test_product_456',
                    converted: true
                  },
                  'Click tracked!'
                )}
                disabled={loading['recommendations-track']}
                variant="outline"
                className="w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                Track Click
              </Button>
            </div>

            <ResponseDisplay responseKey="recommendations-get" />
            <ResponseDisplay responseKey="recommendations-track" />
          </CardContent>
        </Card>

        {/* Analytics Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Analytics
            </CardTitle>
            <CardDescription>View store analytics and metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => apiCall(
                  'analytics-overview',
                  'GET',
                  '/api/admin/analytics',
                  undefined,
                  'Analytics loaded!'
                )}
                disabled={loading['analytics-overview']}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Get Overview
              </Button>

              <Button
                onClick={() => apiCall(
                  'analytics-products',
                  'GET',
                  '/api/admin/analytics/top-products?period=month&limit=10',
                  undefined,
                  'Top products loaded!'
                )}
                disabled={loading['analytics-products']}
                variant="outline"
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Top Products
              </Button>
            </div>

            <ResponseDisplay responseKey="analytics-overview" />
            <ResponseDisplay responseKey="analytics-products" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Useful shortcuts and utilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => {
                setResponses({});
                toast.success('All responses cleared!');
              }}
              variant="outline"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Responses
            </Button>

            <Button
              onClick={() => {
                const allResponses = JSON.stringify(responses, null, 2);
                navigator.clipboard.writeText(allResponses);
                toast.success('All responses copied!');
              }}
              variant="outline"
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy All Responses
            </Button>

            <Button
              onClick={() => {
                window.open('/admin/analytics', '_blank');
              }}
              variant="outline"
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Analytics Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

