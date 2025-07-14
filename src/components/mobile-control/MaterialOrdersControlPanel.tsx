'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { OrderCreateModal } from './OrderCreateModal';
import { OrderEditModal } from './OrderEditModal';
import { DeliveryCreateModal } from './DeliveryCreateModal';
import { DeliveryEditModal } from './DeliveryEditModal';
import { 
  Package, 
  Truck, 
  Users, 
  AlertTriangle, 
  Plus, 
  Edit, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Star,
  DollarSign,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Trash2,
  Eye,
  X
} from 'lucide-react';

interface MaterialOrdersControlPanelProps {
  projectId: string;
  onClose: () => void;
}

interface OrdersData {
  orders: {
    data: any[];
    stats: {
      totalOrders: number;
      pendingOrders: number;
      confirmedOrders: number;
      deliveredOrders: number;
      totalOrderValue: number;
      averageOrderValue: number;
    };
  };
  deliveries: {
    data: any[];
    stats: {
      totalDeliveries: number;
      pendingDeliveries: number;
      completedDeliveries: number;
      deliverySuccessRate: number;
    };
  };
  suppliers: {
    data: any[];
    stats: {
      totalSuppliers: number;
      activeSuppliers: number;
      averageRating: number;
    };
  };
  inventory: {
    alerts: {
      lowStockItems: number;
      criticalItems: number;
      items: any[];
    };
  };
  ordersCount: number;
  deliveriesCount: number;
  suppliersCount: number;
  inventoryAlertsCount: number;
}

export function MaterialOrdersControlPanel({ projectId, onClose }: MaterialOrdersControlPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDeliveryCreateModal, setShowDeliveryCreateModal] = useState(false);
  const [showDeliveryEditModal, setShowDeliveryEditModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  // Fetch orders data when component mounts or projectId changes
  useEffect(() => {
    if (projectId) {
      fetchOrdersData();
    }
  }, [projectId]);

  // Fetch orders data
  const fetchOrdersData = async () => {
    // Don't fetch if projectId is null or undefined
    if (!projectId) {
      console.log('📦 Skipping fetch - projectId is null or undefined');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 Fetching orders data for project:', projectId);
      
      const response = await fetch(`/api/mobile-control/orders?projectId=${projectId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders data');
      }

      const result = await response.json();
      
      // API now returns data directly, no success wrapper
      setOrdersData(result);
      console.log('📦 Orders data loaded successfully:', {
        ordersCount: result.ordersCount,
        deliveriesCount: result.deliveriesCount,
        suppliersCount: result.suppliersCount,
        inventoryAlertsCount: result.inventoryAlertsCount
      });
      
    } catch (error) {
      console.error('❌ Error fetching orders data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch orders data');
    } finally {
      setLoading(false);
    }
  };

  // Update orders data
  const updateOrdersData = async (updateType: string, data: any) => {
    try {
      setUpdating(true);
      setError(null);
      
      console.log('📦 Updating orders data:', { updateType, data });
      
      const response = await fetch('/api/mobile-control/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          updateType,
          data,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update orders data');
      }
      
      const result = await response.json();
      
      // API now returns data directly with success field
      if (result.success) {
        console.log('✅ Orders data updated successfully:', result.data);
        // Refresh data after update
        await fetchOrdersData();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update orders data');
      }
    } catch (error) {
      console.error('❌ Error updating orders data:', error);
      setError(error instanceof Error ? error.message : 'Failed to update orders data');
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateOrder = (newOrder: any) => {
    console.log('📦 New order created:', newOrder);
    
    // Add the new order to the current data
    if (ordersData) {
      setOrdersData(prev => prev ? {
        ...prev,
        orders: {
          ...prev.orders,
          data: [newOrder, ...prev.orders.data],
          stats: {
            ...prev.orders.stats,
            totalOrders: prev.orders.stats.totalOrders + 1,
            pendingOrders: prev.orders.stats.pendingOrders + 1,
            totalOrderValue: prev.orders.stats.totalOrderValue + (newOrder.total_amount || 0)
          }
        }
      } : null);
    }
    
    // Refresh data to get latest state
    fetchOrdersData();
  };

  const handleUpdateOrder = (updatedOrder: any) => {
    console.log('📦 Order updated:', updatedOrder);
    
    // Update the order in the current data
    if (ordersData) {
      setOrdersData(prev => prev ? {
        ...prev,
        orders: {
          ...prev.orders,
          data: prev.orders.data.map(order => 
            order.id === updatedOrder.id ? updatedOrder : order
          )
        }
      } : null);
    }
    
    // Refresh data to get latest state
    fetchOrdersData();
  };

  const handleEditOrder = async (order: any) => {
    console.log('🔧 Opening edit modal for order:', {
      orderId: order.id,
      orderNumber: order.order_number,
      hasOrderItems: !!order.order_items,
      orderItemsCount: order.order_items?.length || 0,
      orderItemsData: order.order_items,
      totalAmount: order.total_amount,
      subtotal: order.subtotal
    });
    
    try {
      // Fetch fresh order data with items from API to ensure we have complete data
      const response = await fetch(`/api/mobile-control/orders?projectId=${projectId}`);
      if (response.ok) {
        const ordersData = await response.json();
        
        // Find the specific order we want to edit
        const fullOrder = ordersData.orders.data.find((o: any) => o.id === order.id);
        
        if (fullOrder) {
          console.log('🔧 Using fresh order data for edit:', {
            orderId: fullOrder.id,
            orderNumber: fullOrder.order_number,
            hasOrderItems: !!fullOrder.order_items,
            orderItemsCount: fullOrder.order_items?.length || 0,
            orderItemsData: fullOrder.order_items,
            totalAmount: fullOrder.total_amount,
            subtotal: fullOrder.subtotal
          });
          
          setSelectedOrder(fullOrder);
        } else {
          console.log('🔧 Using original order data for edit (fresh data not found)');
          setSelectedOrder(order);
        }
      } else {
        console.log('🔧 Using original order data for edit (API call failed)');
        setSelectedOrder(order);
      }
    } catch (error) {
      console.error('🔧 Error fetching fresh order data:', error);
      setSelectedOrder(order);
    }
    
    setShowEditModal(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      setUpdating(true);
      
      const response = await fetch('/api/mobile-control/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          orderId: orderId
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('📦 Order deleted successfully');
        
        // Remove the order from current data
        if (ordersData) {
          setOrdersData(prev => prev ? {
            ...prev,
            orders: {
              ...prev.orders,
              data: prev.orders.data.filter(order => order.id !== orderId)
            }
          } : null);
        }
        
        // Refresh data
        fetchOrdersData();
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

  // Delivery handlers
  const handleCreateDelivery = (newDelivery: any) => {
    console.log('🚚 New delivery created:', newDelivery);
    
    // Add the new delivery to the current data
    if (ordersData) {
      setOrdersData(prev => prev ? {
        ...prev,
        deliveries: {
          ...prev.deliveries,
          data: [newDelivery, ...prev.deliveries.data],
          stats: {
            ...prev.deliveries.stats,
            totalDeliveries: prev.deliveries.stats.totalDeliveries + 1,
            pendingDeliveries: prev.deliveries.stats.pendingDeliveries + 1,
          }
        }
      } : null);
    }
    
    // Refresh data to get latest state
    fetchOrdersData();
  };

  const handleUpdateDelivery = (updatedDelivery: any) => {
    console.log('🚚 Delivery updated:', updatedDelivery);
    
    // Update the delivery in the current data
    if (ordersData) {
      setOrdersData(prev => prev ? {
        ...prev,
        deliveries: {
          ...prev.deliveries,
          data: prev.deliveries.data.map(delivery => 
            delivery.id === updatedDelivery.id ? updatedDelivery : delivery
          )
        }
      } : null);
    }
    
    // Refresh data to get latest state
    fetchOrdersData();
  };

  const handleEditDelivery = async (delivery: any) => {
    console.log('🚚 Opening edit modal for delivery:', {
      deliveryId: delivery.id,
      deliveryNumber: delivery.delivery_number
    });
    
    try {
      // Fetch fresh delivery data with complete order relations
      const response = await fetch(`/api/mobile-control/deliveries?deliveryId=${delivery.id}`);
      const result = await response.json();
      
      if (result.success) {
        console.log('🚚 Fresh delivery data fetched:', result.data);
        setSelectedDelivery(result.data);
        setShowDeliveryEditModal(true);
      } else {
        console.error('❌ Failed to fetch delivery data:', result.error);
        setError('Failed to fetch delivery data');
        // Fallback to existing data
        setSelectedDelivery(delivery);
        setShowDeliveryEditModal(true);
      }
    } catch (error) {
      console.error('❌ Error fetching delivery data:', error);
      setError('Failed to fetch delivery data');
      // Fallback to existing data
      setSelectedDelivery(delivery);
      setShowDeliveryEditModal(true);
    }
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
        
        // Remove the delivery from current data
        if (ordersData) {
          setOrdersData(prev => prev ? {
            ...prev,
            deliveries: {
              ...prev.deliveries,
              data: prev.deliveries.data.filter(delivery => delivery.id !== deliveryId)
            }
          } : null);
        }
        
        // Refresh data
        fetchOrdersData();
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

  const handleDeliveryStatusUpdate = async (deliveryId: string, status: string, notes?: string) => {
    try {
      setUpdating(true);
      
      const response = await fetch('/api/mobile-control/deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStatus',
          deliveryId,
          updates: { status, notes }
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('🚚 Delivery status updated successfully');
        // Refresh data
        fetchOrdersData();
      } else {
        throw new Error(result.error || 'Failed to update delivery status');
      }
    } catch (error) {
      console.error('❌ Error updating delivery status:', error);
      alert('Failed to update delivery status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status: string | undefined | null) => {
    if (!status) {
      return 'bg-gray-100 text-gray-800'; // Default for undefined/null status
    }
    
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'pending_approval':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading material orders data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchOrdersData} className="bg-[#fe6700] hover:bg-[#e55a00]">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!ordersData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">No material orders data found for this project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-[#fe6700]" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Material Orders Control</h2>
            <p className="text-gray-600">Manage orders, deliveries, and suppliers</p>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersData.orders.stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(ordersData.orders.stats.totalOrderValue)} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersData.deliveries.stats.pendingDeliveries}</div>
            <p className="text-xs text-muted-foreground">
              {ordersData.deliveries.stats.deliverySuccessRate.toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersData.suppliers.stats.activeSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              {ordersData.suppliers.stats.averageRating.toFixed(1)} avg rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{ordersData.inventory.alerts.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              {ordersData.inventory.alerts.criticalItems} critical items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile App Impact Alert */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-orange-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Mobile App Integration</span>
          </div>
          <p className="mt-2 text-sm text-orange-700">
            Changes made here will be reflected in the mobile app within 2 seconds. Users will see updated order status, delivery tracking, and material availability.
          </p>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Recent Orders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ordersData.orders.data.length > 0 ? (
                    ordersData.orders.data.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{order.order_number}</div>
                          <div className="text-sm text-gray-500">
                            {order.suppliers?.supplier_name || 'Unknown Supplier'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(order.total_amount)}</div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status?.replace('_', ' ') || 'Draft'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-8 w-8 mx-auto mb-2" />
                      <p>No recent orders</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Deliveries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Upcoming Deliveries</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ordersData.deliveries.data.length > 0 ? (
                    ordersData.deliveries.data.map((delivery: any) => (
                      <div key={delivery.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{delivery.delivery_number}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(delivery.delivery_date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(delivery.delivery_status)}>
                            {delivery.delivery_status?.replace('_', ' ') || 'Scheduled'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Truck className="h-8 w-8 mx-auto mb-2" />
                      <p>No upcoming deliveries</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Alerts */}
          {ordersData.inventory.alerts.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>Low Stock Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ordersData.inventory.alerts.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div>
                        <div className="font-medium">{item.item_name}</div>
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-orange-600">
                          {item.current_stock} {item.unit_of_measure}
                        </div>
                        <div className="text-sm text-gray-500">
                          Min: {item.min_stock_level} {item.unit_of_measure}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Material Orders</h3>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-[#fe6700] hover:bg-[#e55a00]"
            >
              <Plus className="h-4 w-4" />
              <span>New Order</span>
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {ordersData.orders.data.length > 0 ? (
                  ordersData.orders.data.map((order: any) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-lg">{order.order_number}</div>
                          <div className="text-sm text-gray-500">
                            {order.suppliers?.supplier_name || 'Unknown Supplier'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg">{formatCurrency(order.total_amount)}</div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status?.replace('_', ' ') || 'Draft'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium">Order Date:</span> {formatDate(order.order_date)}
                        </div>
                        <div>
                          <span className="font-medium">Expected Delivery:</span> {order.expected_delivery_date ? formatDate(order.expected_delivery_date) : 'TBD'}
                        </div>
                        <div>
                          <span className="font-medium">Priority:</span> 
                          <Badge className={`ml-2 ${order.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                                    order.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                                    'bg-green-100 text-green-800'}`}>
                            {order.priority || 'Medium'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {order.order_items?.length || 0} items
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditOrder(order)}
                            disabled={updating}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              // You can add a view details modal here
                              console.log('View order details:', order);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={updating}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2" />
                    <p className="mb-4">No orders found</p>
                    <Button 
                      onClick={() => setShowCreateModal(true)}
                      className="bg-[#fe6700] hover:bg-[#e55a00]"
                    >
                      Create First Order
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deliveries Tab */}
        <TabsContent value="deliveries" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Delivery Tracking</h3>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowDeliveryCreateModal(true)}
                className="flex items-center space-x-2 bg-[#fe6700] hover:bg-[#e55a00]"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Delivery</span>
              </Button>
              
              {/* NEW GREEN BUTTON */}
              {/* <Button 
                onClick={() => setShowDeliveryCreateModal(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4" />
                <span>NEW Schedule Delivery</span>
              </Button> */}
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {ordersData.deliveries.data.length > 0 ? (
                  ordersData.deliveries.data.map((delivery: any) => (
                    <div key={delivery.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-lg">{delivery.delivery_number || 'DEL-' + delivery.id.slice(-6)}</div>
                          <div className="text-sm text-gray-500">
                            Order: {delivery.project_orders?.order_number || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {delivery.driver_name || 'Driver TBD'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatDate(delivery.delivery_date)}</div>
                          <Badge className={getStatusColor(delivery.delivery_status)}>
                            {delivery.delivery_status?.replace('_', ' ') || 'Scheduled'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium">Vehicle:</span> {delivery.vehicle_type || 'TBD'}
                        </div>
                        <div>
                          <span className="font-medium">Contact:</span> {delivery.driver_phone || 'TBD'}
                        </div>
                        <div>
                          <span className="font-medium">Priority:</span> 
                          <Badge className={`ml-2 ${delivery.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                                    delivery.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                                    'bg-green-100 text-green-800'}`}>
                            {delivery.priority || 'Medium'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {delivery.delivery_instructions || 'Standard delivery'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditDelivery(delivery)}
                            disabled={updating}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              // You can add delivery tracking here
                              console.log('Track delivery:', delivery);
                            }}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            Track
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteDelivery(delivery.id)}
                            disabled={updating}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="h-8 w-8 mx-auto mb-2" />
                    <p className="mb-4">No deliveries scheduled</p>
                    <Button 
                      onClick={() => setShowDeliveryCreateModal(true)}
                      className="bg-[#fe6700] hover:bg-[#e55a00]"
                    >
                      Schedule First Delivery
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Supplier Management</h3>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Supplier</span>
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {ordersData.suppliers.data.length > 0 ? (
                  ordersData.suppliers.data.map((supplier: any) => (
                    <div key={supplier.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold">{supplier.supplier_name}</div>
                          <div className="text-sm text-gray-500">
                            {supplier.specialty || 'General Supplier'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold">{supplier.rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                          <Badge className={getStatusColor(supplier.status)}>
                            {supplier.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Contact:</span> {supplier.contact_person || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {supplier.phone || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {supplier.email || 'N/A'}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {supplier.total_orders || 0} orders completed
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            View History
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4" />
                    <p>No suppliers found</p>
                    <p className="text-sm">Add suppliers to start managing material orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Components */}
      <OrderCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        suppliers={ordersData?.suppliers?.data || []}
        onOrderCreated={handleCreateOrder}
      />

      <OrderEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        suppliers={ordersData?.suppliers?.data || []}
        onOrderUpdated={handleUpdateOrder}
      />

      {/* Delivery Modals */}
      <DeliveryCreateModal
        isOpen={showDeliveryCreateModal}
        onClose={() => {
          console.log('🚚 DeliveryCreateModal onClose called');
          setShowDeliveryCreateModal(false);
        }}
        projectId={projectId}
        availableOrders={ordersData?.orders?.data || []}
        onDeliveryCreated={handleCreateDelivery}
      />
      
      <DeliveryEditModal
        isOpen={showDeliveryEditModal}
        onClose={() => setShowDeliveryEditModal(false)}
        delivery={selectedDelivery}
        onDeliveryUpdated={handleUpdateDelivery}
      />

      {/* Loading Overlay */}
      {updating && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <LoadingSpinner />
            <span>Updating order...</span>
          </div>
        </div>
      )}
    </div>
  );
} 