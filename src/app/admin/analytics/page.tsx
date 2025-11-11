'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Users, Package, AlertCircle, Star, Eye, Clock
} from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';

interface AnalyticsStat {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  createdAt: Date;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<AnalyticsStat[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [conversionRate, setConversionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Real-time updates
  const { connected, lastEvent } = useRealtime('admin', (event) => {
    if (event.type === 'order_created') {
      fetchAnalytics();
    } else if (event.type === 'inventory_update') {
      fetchTopProducts();
    }
  });
  
  useEffect(() => {
    fetchAnalytics();
    fetchRecentOrders();
    fetchTopProducts();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      if (response.ok) {
        const data = await response.json();
        
        setStats([
          {
            label: 'Total Revenue',
            value: `$${data.totalRevenue?.toLocaleString() || 0}`,
            change: data.revenueChange || 0,
            changeLabel: 'vs last month',
            icon: <DollarSign className="w-6 h-6" />,
            color: 'text-green-600'
          },
          {
            label: 'Total Orders',
            value: data.totalOrders || 0,
            change: data.ordersChange || 0,
            changeLabel: 'vs last month',
            icon: <ShoppingCart className="w-6 h-6" />,
            color: 'text-blue-600'
          },
          {
            label: 'Total Customers',
            value: data.totalCustomers || 0,
            change: data.customersChange || 0,
            changeLabel: 'vs last month',
            icon: <Users className="w-6 h-6" />,
            color: 'text-purple-600'
          },
          {
            label: 'Avg Order Value',
            value: `$${data.avgOrderValue?.toFixed(2) || 0}`,
            change: data.avgOrderChange || 0,
            changeLabel: 'vs last month',
            icon: <TrendingUp className="w-6 h-6" />,
            color: 'text-orange-600'
          }
        ]);
        
        setConversionRate(data.conversionRate || 0);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRecentOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders?limit=10&sort=createdAt:desc');
      if (response.ok) {
        const data = await response.json();
        setRecentOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent orders:', error);
    }
  };
  
  const fetchTopProducts = async () => {
    try {
      const response = await fetch('/api/admin/analytics/top-products');
      if (response.ok) {
        const data = await response.json();
        setTopProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch top products:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time insights into your store's performance
          </p>
        </div>
        
        {connected && (
          <Badge variant="success" className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live
          </Badge>
        )}
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </CardTitle>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="flex items-center mt-2 text-sm">
                  {stat.change >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={stat.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(stat.change)}%
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    {stat.changeLabel}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Conversion Rate & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
            <CardDescription>Percentage of visitors who make a purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 mb-4">
              {conversionRate.toFixed(2)}%
            </div>
            <Progress value={conversionRate} max={10} animate showLabel={false} />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Industry average: 2-3%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Package className="inline w-4 h-4 mr-2" />
              Process Orders
            </button>
            <button className="w-full text-left px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <AlertCircle className="inline w-4 h-4 mr-2" />
              Low Stock Alerts
            </button>
            <button className="w-full text-left px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Star className="inline w-4 h-4 mr-2" />
              Review Management
            </button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Store Health</CardTitle>
            <CardDescription>Overall performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Orders</span>
                <Badge variant="success">Healthy</Badge>
              </div>
              <Progress value={85} animate />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Inventory</span>
                <Badge variant="warning">Medium</Badge>
              </div>
              <Progress value={60} animate />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Satisfaction</span>
                <Badge variant="success">Excellent</Badge>
              </div>
              <Progress value={92} animate />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      #{order.orderNumber}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {order.customer}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">
                      ${order.total.toFixed(2)}
                    </div>
                    <Badge variant={
                      order.status === 'completed' ? 'success' :
                      order.status === 'processing' ? 'default' :
                      'secondary'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling items this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((product, index) => (
                <div key={product._id} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {product.salesCount} sales • ${product.revenue.toFixed(2)}
                    </div>
                  </div>
                  <Eye className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

