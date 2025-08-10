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
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  MapPin
} from 'lucide-react';
import { useOrders, Order, Supplier, Delivery } from '@/hooks/useOrders';
import { OrderCreateModal } from '@/components/mobile-control/OrderCreateModal';
import { OrderEditModal } from '@/components/mobile-control/OrderEditModal';
import { OrderViewModal } from '@/components/mobile-control/OrderViewModal';
import { DeliveryCreateModal } from '@/components/mobile-control/DeliveryCreateModal';
import { DeliveryEditModal } from '@/components/mobile-control/DeliveryEditModal';
import { SupplierCreateModal } from '@/components/mobile-control/SupplierCreateModal';
import { SupplierEditModal } from '@/components/mobile-control/SupplierEditModal';
import { DeleteOrderModal } from '@/components/modals/DeleteOrderModal';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'suppliers' | 'deliveries'>('overview');
  
  // Modal states
  const [showOrderCreateModal, setShowOrderCreateModal] = useState(false);
  const [showOrderEditModal, setShowOrderEditModal] = useState(false);
  const [showOrderViewModal, setShowOrderViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [showDeliveryCreateModal, setShowDeliveryCreateModal] = useState(false);
  const [showDeliveryEditModal, setShowDeliveryEditModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  
  const [showSupplierCreateModal, setShowSupplierCreateModal] = useState(false);
  const [showSupplierEditModal, setShowSupplierEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  
  const [showDeleteOrderModal, setShowDeleteOrderModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  
  const [updating, setUpdating] = useState(false);

  // Fetch orders data with statistics
  const { orders, suppliers, deliveries, stats, loading, error, refetch } = useOrders({
    includeStats: true
  });

  console.log('🎯 [Orders Page] Hook data:', { 
    ordersCount: orders.length, 
    suppliersCount: suppliers.length, 
    deliveriesCount: deliveries.length,
    stats, 
    loading, 
    error 
  });

  // Currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // 📦 ORDER HANDLERS
  const handleCreateOrder = (newOrder: any) => {
    console.log('📦 New order created:', newOrder);
    refetch(); // Refresh data
    setShowOrderCreateModal(false);
  };

  const handleEditOrder = async (order: any) => {
    console.log('🔧 Opening edit modal for order:', order);
    
    try {
      // Get all projects to determine which project this order belongs to
      const ordersWithProject = orders.find(o => o.id === order.id);
      const projectId = ordersWithProject?.project_id || ordersWithProject?.project?.id;
      
      if (projectId) {
        // Fetch fresh order data from API
        const response = await fetch(`/api/mobile-control/orders?projectId=${projectId}`);
        if (response.ok) {
          const ordersData = await response.json();
          const fullOrder = ordersData.orders.data.find((o: any) => o.id === order.id);
          
          if (fullOrder) {
            setSelectedOrder(fullOrder);
          } else {
            setSelectedOrder(order);
          }
        } else {
          setSelectedOrder(order);
        }
      } else {
        setSelectedOrder(order);
      }
    } catch (error) {
      console.error('🔧 Error fetching fresh order data:', error);
      setSelectedOrder(order);
    }
    
    setShowOrderEditModal(true);
  };

  const handleUpdateOrder = (updatedOrder: any) => {
    console.log('📦 Order updated:', updatedOrder);
    refetch(); // Refresh data
    setShowOrderEditModal(false);
    setSelectedOrder(null);
  };

  const handleViewOrder = (order: any) => {
    console.log('📦 Opening view modal for order:', order.order_number);
    setSelectedOrder(order);
    setShowOrderViewModal(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    // Find the order to show in the delete modal
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setOrderToDelete(order);
      setShowDeleteOrderModal(true);
    }
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      setUpdating(true);
      
      // Get the project ID for this order
      const projectId = orderToDelete.project_id || orderToDelete.project?.id;
      
      if (!projectId) {
        throw new Error('Could not determine project ID for order');
      }
      
      const response = await fetch('/api/mobile-control/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          orderId: orderToDelete.id,
          projectId: projectId
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('📦 Order deleted successfully');
        refetch(); // Refresh data
        setShowDeleteOrderModal(false);
        setOrderToDelete(null);
      } else {
        throw new Error(result.error || 'Failed to delete order');
      }
    } catch (error) {
      console.error('❌ Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // 🚚 DELIVERY HANDLERS
  const handleCreateDelivery = (newDelivery: any) => {
    console.log('🚚 New delivery created:', newDelivery);
    refetch(); // Refresh data
    setShowDeliveryCreateModal(false);
  };

  const handleEditDelivery = (delivery: any) => {
    console.log('🚚 Opening edit modal for delivery:', delivery);
    setSelectedDelivery(delivery);
    setShowDeliveryEditModal(true);
  };

  const handleUpdateDelivery = (updatedDelivery: any) => {
    console.log('🚚 Delivery updated:', updatedDelivery);
    refetch(); // Refresh data
    setShowDeliveryEditModal(false);
    setSelectedDelivery(null);
  };

  const handleDeleteDelivery = async (deliveryId: string) => {
    if (!confirm('Are you sure you want to delete this delivery?')) {
      return;
    }

    try {
      setUpdating(true);
      
      const response = await fetch('/api/mobile-control/deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          deliveryId: deliveryId
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('🚚 Delivery deleted successfully');
        refetch(); // Refresh data
      } else {
        throw new Error(result.error || 'Failed to delete delivery');
      }
    } catch (error) {
      console.error('❌ Error deleting delivery:', error);
      alert('Failed to delete delivery. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleTrackDelivery = (delivery: any) => {
    console.log('🗺️ Track delivery:', delivery);
    // Add delivery tracking logic here
    alert(`Tracking delivery: ${delivery.delivery_number}`);
  };

  // 🏭 SUPPLIER HANDLERS
  const handleCreateSupplier = (newSupplier: any) => {
    console.log('🏭 New supplier created:', newSupplier);
    refetch(); // Refresh data
    setShowSupplierCreateModal(false);
  };

  const handleEditSupplier = (supplier: any) => {
    console.log('🏭 Opening edit modal for supplier:', supplier);
    setSelectedSupplier(supplier);
    setShowSupplierEditModal(true);
  };

  const handleUpdateSupplier = (updatedSupplier: any) => {
    console.log('🏭 Supplier updated:', updatedSupplier);
    refetch(); // Refresh data
    setShowSupplierEditModal(false);
    setSelectedSupplier(null);
  };

  const handleViewSupplierHistory = (supplier: any) => {
    console.log('📊 View supplier history:', supplier);
    // Add supplier history logic here
    alert(`Viewing history for: ${supplier.supplier_name}`);
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
    // {
    //   title: 'Total Value',
    //   value: formatCurrency(stats?.totalValue || 0),
    //   change: `+${stats?.valueGrowth || 0}%`,
    //   trend: (stats?.valueGrowth || 0) > 0 ? 'up' : 'down',
    //   icon: DollarSign,
    //   color: 'text-green-600 bg-green-50'
    // },
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
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
      case 'in_transit':
        return <Badge className="bg-purple-100 text-purple-800">In Transit</Badge>;
      case 'partially_delivered':
        return <Badge className="bg-orange-100 text-orange-800">Partially Delivered</Badge>;
      case 'sent_to_supplier':
        return <Badge className="bg-indigo-100 text-indigo-800">Sent to Supplier</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'returned':
        return <Badge className="bg-red-100 text-red-800">Returned</Badge>;
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
                    {/* <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">{metric.change}</span>
                    </div> */}
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
          {recentOrders.length > 0 ? (
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Find the original order object from the orders array
                        const originalOrder = orders.find(o => o.order_number === order.id);
                        if (originalOrder) {
                          handleViewOrder(originalOrder);
                        } else {
                          console.warn('Could not find original order for:', order.id);
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Orders</h3>
              <p className="text-gray-600 mb-4">
                {loading ? 'Loading orders...' : 'No orders have been placed yet. Create your first order to get started.'}
              </p>
              {/* {!loading && (
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              )} */}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Suppliers */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-orange-500" />
            <span>Top Suppliers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topSuppliers.length > 0 ? (
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
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Suppliers Found</h3>
              <p className="text-gray-600 mb-4">
                {loading ? 'Loading suppliers...' : 'No suppliers have been added yet. Add suppliers to start creating orders.'}
              </p>
              {!loading && (
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card> */}
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
          {/* <Button 
            onClick={() => setShowOrderCreateModal(true)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button> */}
        </div>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{order.order_number}</h4>
                        <p className="text-sm text-gray-600">{order.project?.project_name || 'Unknown Project'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.order_items?.map(item => item.item_description).join(', ') || 'No items'}
                        </p>
                        <p className="text-sm text-gray-600">
                          from {order.supplier?.supplier_name || 'Unknown Supplier'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(order.total_amount)}</p>
                        <p className="text-sm text-gray-600">
                          Due: {order.expected_delivery_date || order.actual_delivery_date || 'TBD'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(order.status)}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditOrder(order)}
                      disabled={updating}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                      disabled={updating}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600 mb-4">
                {loading ? 'Loading orders...' : 'No orders have been created yet. Create your first order to get started.'}
              </p>
              <Button 
                onClick={() => setShowOrderCreateModal(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSuppliers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Supplier Management</h2>
        <Button 
          onClick={() => setShowSupplierCreateModal(true)}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {suppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => {
            // Calculate supplier statistics from orders
            const supplierOrders = orders.filter(order => order.supplier_id === supplier.id);
            const totalOrders = supplierOrders.length;
            const totalValue = supplierOrders.reduce((sum, order) => sum + order.total_amount, 0);
            
            return (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{supplier.supplier_name}</h3>
                      <p className="text-sm text-gray-600">{supplier.specialty || 'General Supplier'}</p>
                      <p className="text-sm text-gray-500">{supplier.contact_person}</p>
                    </div>
                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                      {supplier.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Orders:</span>
                      <span className="font-medium">{totalOrders}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Value:</span>
                      <span className="font-medium">{formatCurrency(totalValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rating:</span>
                      <span className="font-medium">{supplier.rating || 0}/5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{supplier.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-xs">{supplier.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditSupplier(supplier)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {/* <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewSupplierHistory(supplier)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      History
                    </Button> */}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Suppliers Found</h3>
              <p className="text-gray-600 mb-4">
                {loading ? 'Loading suppliers...' : 'No suppliers have been added yet. Add suppliers to start creating orders.'}
              </p>
              <Button 
                onClick={() => setShowSupplierCreateModal(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderDeliveries = () => {
    const getDeliveryStatusBadge = (status: string) => {
      switch (status) {
        case 'completed':
          return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
        case 'in_transit':
          return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>;
        case 'pending':
          return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
        case 'failed':
          return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Delivery Tracking</h2>
          {/* <Button 
            onClick={() => setShowDeliveryCreateModal(true)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Delivery
          </Button> */}
        </div>

        {deliveries.length > 0 ? (
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <Card key={delivery.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-6">
                        <div>
                          <h4 className="font-medium text-gray-900">{delivery.delivery_number}</h4>
                          <p className="text-sm text-gray-600">
                            Order: {delivery.project_orders?.order_number || 'Unknown Order'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {delivery.driver_name || 'Unknown Driver'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {delivery.vehicle_info || 'No vehicle info'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {delivery.project_orders?.suppliers?.supplier_name || 'Unknown Supplier'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {delivery.delivery_method || 'Standard delivery'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(delivery.delivery_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {delivery.scheduled_time || 'No scheduled time'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {delivery.received_by_name || 'Not received'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {delivery.receiving_condition || 'No condition noted'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getDeliveryStatusBadge(delivery.delivery_status)}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditDelivery(delivery)}
                        disabled={updating}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTrackDelivery(delivery)}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Track
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteDelivery(delivery.id)}
                        disabled={updating}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  {delivery.special_handling_notes && (
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-800">
                        <strong>Special Handling:</strong> {delivery.special_handling_notes}
                      </p>
                    </div>
                  )}
                  
                  {delivery.notes && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Notes:</strong> {delivery.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Deliveries Found</h3>
                <p className="text-gray-600 mb-4">
                  {loading ? 'Loading deliveries...' : 'No deliveries have been scheduled yet. Create orders to start tracking deliveries.'}
                </p>
                {/* <Button 
                  onClick={() => setShowDeliveryCreateModal(true)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Delivery
                </Button> */}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

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
        {/* Debug Info */}
        {/* <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Debug Info</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>Orders Count: {orders.length}</p>
              <p>Suppliers Count: {suppliers.length}</p>
              <p>Deliveries Count: {deliveries.length}</p>
              <p>Stats: {stats ? JSON.stringify(stats, null, 2) : 'null'}</p>
              <p>Loading: {loading.toString()}</p>
              <p>Error: {error || 'none'}</p>
            </div>
            <Button onClick={refetch} size="sm" className="mt-2">
              Force Refresh Data
            </Button>
          </CardContent>
        </Card> */}

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

      {/* Modals */}
      {showOrderCreateModal && (
        <OrderCreateModal
          isOpen={showOrderCreateModal}
          onClose={() => setShowOrderCreateModal(false)}
          onOrderCreated={handleCreateOrder}
          projectId=""
          suppliers={suppliers}
        />
      )}

      {showOrderEditModal && selectedOrder && (
        <OrderEditModal
          isOpen={showOrderEditModal}
          onClose={() => {
            setShowOrderEditModal(false);
            setSelectedOrder(null);
          }}
          onOrderUpdated={handleUpdateOrder}
          order={selectedOrder}
          suppliers={suppliers}
        />
      )}

      {showOrderViewModal && selectedOrder && (
        <OrderViewModal
          isOpen={showOrderViewModal}
          onClose={() => {
            setShowOrderViewModal(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
        />
      )}

      {showDeliveryCreateModal && (
        <DeliveryCreateModal
          isOpen={showDeliveryCreateModal}
          onClose={() => setShowDeliveryCreateModal(false)}
          onDeliveryCreated={handleCreateDelivery}
          projectId=""
          availableOrders={orders}
        />
      )}

      {showDeliveryEditModal && selectedDelivery && (
        <DeliveryEditModal
          isOpen={showDeliveryEditModal}
          onClose={() => {
            setShowDeliveryEditModal(false);
            setSelectedDelivery(null);
          }}
          onDeliveryUpdated={handleUpdateDelivery}
          delivery={selectedDelivery}
        />
      )}

      {showSupplierCreateModal && (
        <SupplierCreateModal
          isOpen={showSupplierCreateModal}
          onClose={() => setShowSupplierCreateModal(false)}
          onSupplierCreated={handleCreateSupplier}
        />
      )}

      {showSupplierEditModal && selectedSupplier && (
        <SupplierEditModal
          isOpen={showSupplierEditModal}
          onClose={() => {
            setShowSupplierEditModal(false);
            setSelectedSupplier(null);
          }}
          onSupplierUpdated={handleUpdateSupplier}
          supplier={selectedSupplier}
        />
      )}

      {showDeleteOrderModal && orderToDelete && (
        <DeleteOrderModal
          isOpen={showDeleteOrderModal}
          onClose={() => {
            setShowDeleteOrderModal(false);
            setOrderToDelete(null);
          }}
          onConfirm={confirmDeleteOrder}
          order={orderToDelete}
          isDeleting={updating}
        />
      )}
    </div>
  );
} 