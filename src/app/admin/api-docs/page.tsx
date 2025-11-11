'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  body?: any;
  response?: any;
  params?: string;
}

const apiEndpoints: Record<string, ApiEndpoint[]> = {
  'Discounts': [
    {
      method: 'POST',
      path: '/api/discounts',
      description: 'Create a new discount code',
      body: {
        code: 'SAVE20',
        name: '20% Off',
        type: 'percentage',
        value: 20,
        status: 'active'
      }
    },
    {
      method: 'GET',
      path: '/api/discounts',
      description: 'Validate discount code',
      params: '?code=SAVE20'
    },
    {
      method: 'POST',
      path: '/api/discounts/apply',
      description: 'Apply discount to cart',
      body: {
        code: 'SAVE20',
        orderTotal: 100,
        items: []
      }
    }
  ],
  'Gift Cards': [
    {
      method: 'POST',
      path: '/api/gift-cards',
      description: 'Create a gift card',
      body: {
        amount: 100,
        recipientEmail: 'user@example.com',
        message: 'Happy Birthday!'
      }
    },
    {
      method: 'GET',
      path: '/api/gift-cards',
      description: 'Check gift card balance',
      params: '?code=XXXX-XXXX-XXXX-XXXX'
    },
    {
      method: 'POST',
      path: '/api/gift-cards/apply',
      description: 'Apply gift card to order',
      body: {
        code: 'XXXX-XXXX-XXXX-XXXX',
        amount: 50,
        orderId: 'order_123'
      }
    }
  ],
  'Loyalty Program': [
    {
      method: 'GET',
      path: '/api/loyalty',
      description: 'Get user loyalty account',
      params: '?userId=user_123'
    },
    {
      method: 'POST',
      path: '/api/loyalty',
      description: 'Add points for purchase',
      body: {
        userId: 'user_123',
        action: 'purchase',
        data: { amount: 100, orderId: 'order_123' }
      }
    },
    {
      method: 'POST',
      path: '/api/loyalty',
      description: 'Redeem points',
      body: {
        userId: 'user_123',
        action: 'redeem',
        data: { points: 500, reason: 'Discount' }
      }
    }
  ],
  'Abandoned Carts': [
    {
      method: 'POST',
      path: '/api/abandoned-carts',
      description: 'Track abandoned cart',
      body: {
        sessionId: 'session_123',
        email: 'user@example.com',
        items: [],
        total: 100
      }
    },
    {
      method: 'GET',
      path: '/api/abandoned-carts',
      description: 'List abandoned carts',
      params: '?status=abandoned'
    },
    {
      method: 'POST',
      path: '/api/abandoned-carts/process',
      description: 'Process abandoned carts (cron)'
    }
  ],
  'Flash Sales': [
    {
      method: 'POST',
      path: '/api/flash-sales',
      description: 'Create flash sale',
      body: {
        name: 'Flash Sale',
        startDate: '2025-11-11T00:00:00Z',
        endDate: '2025-11-12T00:00:00Z',
        products: []
      }
    },
    {
      method: 'GET',
      path: '/api/flash-sales',
      description: 'List flash sales',
      params: '?status=active'
    },
    {
      method: 'GET',
      path: '/api/flash-sales/active',
      description: 'Get active flash sale'
    }
  ],
  'Product Bundles': [
    {
      method: 'POST',
      path: '/api/bundles',
      description: 'Create product bundle',
      body: {
        name: 'Bundle Name',
        products: [],
        originalPrice: 150,
        bundlePrice: 120
      }
    },
    {
      method: 'GET',
      path: '/api/bundles',
      description: 'List bundles',
      params: '?featured=true'
    }
  ],
  'Recommendations': [
    {
      method: 'GET',
      path: '/api/recommendations/:productId',
      description: 'Get product recommendations',
      params: '?type=related&limit=5'
    },
    {
      method: 'POST',
      path: '/api/recommendations/:productId',
      description: 'Track recommendation click',
      body: {
        type: 'related',
        clickedProductId: 'prod_123',
        converted: true
      }
    }
  ],
  'Analytics': [
    {
      method: 'GET',
      path: '/api/admin/analytics',
      description: 'Get analytics overview'
    },
    {
      method: 'GET',
      path: '/api/admin/analytics/top-products',
      description: 'Get top products',
      params: '?period=month&limit=10'
    }
  ]
};

export default function ApiDocsPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-600';
      case 'POST': return 'bg-green-600';
      case 'PUT': return 'bg-yellow-600';
      case 'DELETE': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📚 API Documentation
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete API reference for all Shopify-like features
        </p>
      </div>

      {/* Quick Links */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.keys(apiEndpoints).map(section => (
              <Button
                key={section}
                variant="outline"
                size="sm"
                onClick={() => toggleSection(section)}
              >
                {section}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <div className="space-y-4">
        {Object.entries(apiEndpoints).map(([section, endpoints]) => (
          <Card key={section}>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleSection(section)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expandedSections.has(section) ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <CardTitle>{section}</CardTitle>
                  <Badge variant="secondary">{endpoints.length} endpoints</Badge>
                </div>
              </div>
            </CardHeader>

            {expandedSections.has(section) && (
              <CardContent className="space-y-4 pt-4">
                {endpoints.map((endpoint, index) => {
                  const fullPath = endpoint.path + (endpoint.params || '');
                  const curlCommand = `curl -X ${endpoint.method} http://localhost:3000${fullPath}${
                    endpoint.body 
                      ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(endpoint.body, null, 2)}'`
                      : ''
                  }`;
                  const copyId = `${section}-${index}`;

                  return (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      {/* Endpoint Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={`${getMethodColor(endpoint.method)} text-white`}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded flex-1">
                          {fullPath}
                        </code>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {endpoint.description}
                      </p>

                      {/* Request Body */}
                      {endpoint.body && (
                        <div className="mb-3">
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Request Body:
                          </div>
                          <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-auto text-xs">
                            {JSON.stringify(endpoint.body, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* cURL Command */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            cURL Command:
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyCode(curlCommand, copyId)}
                          >
                            {copied === copyId ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-auto text-xs">
                          {curlCommand}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Base URL Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Base URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Development:</span>
              <code className="ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                http://localhost:3000
              </code>
            </div>
            <div>
              <span className="font-semibold">Production:</span>
              <code className="ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                https://your-domain.com
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

