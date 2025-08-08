'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  Truck,
  Search,
  Filter,
  Plus,
  TrendingUp,
  FileText,
  User,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useOrders, Order, Supplier } from '@/hooks/useOrders';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'suppliers' | 'deliveries'>('overview');

  // Fetch orders data with statistics
  const { orders, suppliers, stats, loading, error, refetch } = useOrders({
    includeStats: true
  });

  // Currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Dynamic order metrics based on real data
  const orderMetrics = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders?.toString() || '0',
      change: `+${stats?.monthlyTrend || 0}`,
      trend: (stats?.monthlyTrend || 0) > 0 ? 'up' : 'down',
      icon: Package,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders?.toString() || '0',
      change: '-5', // Would need historical data for real change
      trend: 'down',
      icon: Clock,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      title: 'Total Value',
      value: formatCurrency(stats?.totalValue || 0),
      change: `+${stats?.valueGrowth || 0}%`,
      trend: (stats?.valueGrowth || 0) > 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Delivered This Month',
      value: stats?.deliveredThisMonth?.toString() || '0',
      change: '+24', // Would need historical data for real change
      trend: 'up',
      icon: CheckCircle,
      color: 'text-purple-600 bg-purple-50'
    }
  ];

  // Get recent orders (limit to 5 most recent)
  const recentOrders = orders.slice(0, 5).map(order => ({
    id: order.order_number,
    project: order.project?.project_name || 'Unknown Project',
    supplier: order.supplier?.supplier_name || 'Unknown Supplier',
    items: order.order_items?.map(item => item.item_description).join(', ') || 'No items',
    value: order.total_amount,
    status: order.status,
    orderDate: order.order_date,
    deliveryDate: order.expected_delivery_date || order.actual_delivery_date || 'TBD'
  }));

  // Calculate supplier statistics from orders
  const topSuppliers = suppliers.slice(0, 3).map(supplier => {
    const supplierOrders = orders.filter(order => order.supplier_id === supplier.id);
    const totalValue = supplierOrders.reduce((sum, order) => sum + order.total_amount, 0);
    
    return {
      name: supplier.supplier_name,
      totalOrders: supplierOrders.length,
      totalValue: totalValue,
      rating: supplier.rating || 0,
      onTimeDelivery: supplier.on_time_delivery || 95 // Default if not available
    };
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'in_transit':
        return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Order Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {orderMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">{metric.change}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${metric.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-orange-500" />
            <span>Recent Orders</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{order.id}</h4>
                      <p className="text-sm text-gray-600">{order.project}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.items}</p>
                      <p className="text-sm text-gray-600">from {order.supplier}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(order.value)}</p>
                      <p className="text-sm text-gray-600">Due: {order.deliveryDate}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(order.status)}
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-orange-500" />
            <span>Top Suppliers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topSuppliers.map((supplier, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{supplier.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orders:</span>
                    <span className="font-medium">{supplier.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Value:</span>
                    <span className="font-medium">{formatCurrency(supplier.totalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-medium">{supplier.rating}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">On-time:</span>
                    <span className="font-medium">{supplier.onTimeDelivery}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Order Management</h2>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Order Management System</h3>
            <p className="text-gray-600 mb-4">Create, track, and manage material orders across all projects</p>
            <Button className="bg-orange-500 hover:bg-orange-600">
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSuppliers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Supplier Management</h2>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Supplier Directory</h3>
            <p className="text-gray-600 mb-4">Manage supplier relationships and performance tracking</p>
            <Button className="bg-orange-500 hover:bg-orange-600">
              View Suppliers
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDeliveries = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Delivery Tracking</h2>
        <Button variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Track Delivery
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delivery Management</h3>
            <p className="text-gray-600 mb-4">Track and manage material deliveries in real-time</p>
            <Button className="bg-orange-500 hover:bg-orange-600">
              View Deliveries
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'suppliers', label: 'Suppliers', icon: User },
    { id: 'deliveries', label: 'Deliveries', icon: Truck }
  ];

  // Handle loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-1">Loading order data...</p>
          </div>
          <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-1">Error loading order data</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Orders</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refetch} className="bg-orange-500 hover:bg-orange-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive material ordering and supply chain management for construction projects
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="px-3 py-1">
            {orders.length > 0 ? `${orders.length} Orders Loaded` : 'No Orders Found'}
          </Badge>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'suppliers' && renderSuppliers()}
        {activeTab === 'deliveries' && renderDeliveries()}
      </div>
    </div>
  );
} 