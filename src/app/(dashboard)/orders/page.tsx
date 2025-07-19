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
  User
} from 'lucide-react';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'suppliers' | 'deliveries'>('overview');

  const orderMetrics = [
    {
      title: 'Total Orders',
      value: '247',
      change: '+12',
      trend: 'up',
      icon: Package,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Pending Orders',
      value: '23',
      change: '-5',
      trend: 'down',
      icon: Clock,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      title: 'Total Value',
      value: '$2.4M',
      change: '+18%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Delivered This Month',
      value: '156',
      change: '+24',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-purple-600 bg-purple-50'
    }
  ];

  const recentOrders = [
    {
      id: 'ORD-001',
      project: 'Sandton Office Complex',
      supplier: 'BuildCorp Supplies',
      items: 'Concrete, Steel Beams',
      value: 45000,
      status: 'delivered',
      orderDate: '2024-01-10',
      deliveryDate: '2024-01-15'
    },
    {
      id: 'ORD-002',
      project: 'Cape Town Mall',
      supplier: 'Metro Materials',
      items: 'Electrical Cables, Switches',
      value: 12500,
      status: 'pending',
      orderDate: '2024-01-12',
      deliveryDate: '2024-01-18'
    },
    {
      id: 'ORD-003',
      project: 'Rosebank Apartments',
      supplier: 'Quality Hardware',
      items: 'Pipes, Fittings, Valves',
      value: 8750,
      status: 'in_transit',
      orderDate: '2024-01-08',
      deliveryDate: '2024-01-16'
    }
  ];

  const topSuppliers = [
    {
      name: 'BuildCorp Supplies',
      totalOrders: 45,
      totalValue: 890000,
      rating: 4.8,
      onTimeDelivery: 96
    },
    {
      name: 'Metro Materials',
      totalOrders: 32,
      totalValue: 650000,
      rating: 4.6,
      onTimeDelivery: 94
    },
    {
      name: 'Quality Hardware',
      totalOrders: 28,
      totalValue: 420000,
      rating: 4.7,
      onTimeDelivery: 98
    }
  ];

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
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
            Live Order Data
          </Badge>
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