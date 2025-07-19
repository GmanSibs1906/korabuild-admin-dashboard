'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  X, 
  Package, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  DollarSign, 
  FileText, 
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  Hash,
  Target
} from 'lucide-react';

interface OrderViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export function OrderViewModal({
  isOpen,
  onClose,
  order,
}: OrderViewModalProps) {
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format datetime
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format status for display
  const formatStatus = (status: string) => {
    if (!status) return 'Draft';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending_approval':
      case 'processing':
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
      case 'rejected':
      case 'returned':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'approved':
      case 'sent_to_supplier':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_transit':
      case 'partially_delivered':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Load order details (in case we need fresh data)
  useEffect(() => {
    if (isOpen && order) {
      setOrderDetails(order);
    }
  }, [isOpen, order]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-gray-600">No order details available</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="border-b bg-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="h-6 w-6 text-orange-600" />
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Order #{orderDetails.order_number}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Created on {formatDate(orderDetails.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className={getStatusColor(orderDetails.status)}>
                  {formatStatus(orderDetails.status)}
                </Badge>
                <Badge className={getPriorityColor(orderDetails.priority)}>
                  {orderDetails.priority || 'Normal'} Priority
                </Badge>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="items">Order Items ({orderDetails.order_items?.length || 0})</TabsTrigger>
                <TabsTrigger value="supplier">Supplier Info</TabsTrigger>
                <TabsTrigger value="delivery">Delivery & Timeline</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Order Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Hash className="h-5 w-5 mr-2 text-orange-600" />
                        Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Number:</span>
                        <span className="font-medium">{orderDetails.order_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge className={getStatusColor(orderDetails.status)}>
                          {formatStatus(orderDetails.status)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <Badge className={getPriorityColor(orderDetails.priority)}>
                          {orderDetails.priority}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span className="font-medium">{formatDate(orderDetails.order_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Required Date:</span>
                        <span className="font-medium">{formatDate(orderDetails.required_date)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-orange-600" />
                        Financial Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(orderDetails.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax Amount:</span>
                        <span className="font-medium">{formatCurrency(orderDetails.tax_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium">{formatCurrency(orderDetails.discount_amount)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-900 font-semibold">Total Amount:</span>
                        <span className="font-bold text-lg text-orange-600">
                          {formatCurrency(orderDetails.total_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Terms:</span>
                        <span className="font-medium">{orderDetails.payment_terms || 'Standard'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Building className="h-5 w-5 mr-2 text-orange-600" />
                        Project Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Project Name:</span>
                        <span className="font-medium">{orderDetails.projects?.project_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Client:</span>
                        <span className="font-medium">{orderDetails.projects?.client?.full_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Site Address:</span>
                        <span className="font-medium text-right">{orderDetails.projects?.project_address || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Project Status:</span>
                        <span className="font-medium">{orderDetails.projects?.status || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date:</span>
                        <span className="font-medium">{formatDate(orderDetails.projects?.start_date) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Completion:</span>
                        <span className="font-medium">{formatDate(orderDetails.projects?.expected_completion) || 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Notes */}
                {orderDetails.notes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-orange-600" />
                        Order Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{orderDetails.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Order Items Tab */}
              <TabsContent value="items" className="space-y-4 mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Package className="h-5 w-5 mr-2 text-orange-600" />
                      Order Items ({orderDetails.order_items?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orderDetails.order_items && orderDetails.order_items.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left p-3 font-semibold text-gray-900">Item</th>
                              <th className="text-right p-3 font-semibold text-gray-900">Qty Ordered</th>
                              <th className="text-right p-3 font-semibold text-gray-900">Qty Delivered</th>
                              <th className="text-right p-3 font-semibold text-gray-900">Unit Cost</th>
                              <th className="text-right p-3 font-semibold text-gray-900">Line Total</th>
                              <th className="text-center p-3 font-semibold text-gray-900">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderDetails.order_items.map((item: any, index: number) => (
                              <tr key={item.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-3">
                                  <div>
                                    <div className="font-medium text-gray-900">{item.item_description}</div>
                                    <div className="text-sm text-gray-500">
                                      Unit: {item.unit_of_measure || 'pieces'}
                                    </div>
                                    {item.specifications && (
                                      <div className="text-xs text-gray-400 mt-1">{item.specifications}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-right font-medium">
                                  {item.quantity_ordered?.toLocaleString() || 0}
                                </td>
                                <td className="p-3 text-right">
                                  {item.quantity_delivered?.toLocaleString() || 0}
                                </td>
                                <td className="p-3 text-right font-medium">
                                  {formatCurrency(item.unit_cost)}
                                </td>
                                <td className="p-3 text-right font-semibold">
                                  {formatCurrency((item.quantity_ordered || 0) * (item.unit_cost || 0))}
                                </td>
                                <td className="p-3 text-center">
                                  <Badge className={getStatusColor(item.delivery_status)}>
                                    {item.delivery_status || 'pending'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No order items found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Supplier Information Tab */}
              <TabsContent value="supplier" className="space-y-4 mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Building className="h-5 w-5 mr-2 text-orange-600" />
                      Supplier Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orderDetails.suppliers ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Supplier Details */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">Company Details</h3>
                          <div className="space-y-3">
                            <div>
                              <span className="text-gray-600">Company Name:</span>
                              <p className="font-medium">{orderDetails.suppliers.supplier_name}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Supplier Code:</span>
                              <p className="font-medium">{orderDetails.suppliers.supplier_code}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Specialty:</span>
                              <p className="font-medium">{orderDetails.suppliers.specialty || 'General'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Rating:</span>
                              <p className="font-medium">
                                {orderDetails.suppliers.rating ? 
                                  `${orderDetails.suppliers.rating.toFixed(1)}/5.0` : 'Not rated'}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <Badge className={getStatusColor(orderDetails.suppliers.status)}>
                                {orderDetails.suppliers.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <span className="text-gray-600">Contact Person:</span>
                                <p className="font-medium">{orderDetails.suppliers.contact_person || 'Not specified'}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <div>
                                <span className="text-gray-600">Email:</span>
                                <p className="font-medium">{orderDetails.suppliers.email || 'Not specified'}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <div>
                                <span className="text-gray-600">Phone:</span>
                                <p className="font-medium">{orderDetails.suppliers.phone || 'Not specified'}</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                              <div>
                                <span className="text-gray-600">Address:</span>
                                <p className="font-medium">
                                  {orderDetails.suppliers.address || 'Not specified'}
                                  {orderDetails.suppliers.city && (
                                    <><br />{orderDetails.suppliers.city}</>
                                  )}
                                  {orderDetails.suppliers.province && (
                                    <><br />{orderDetails.suppliers.province}</>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No supplier information available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Delivery & Timeline Tab */}
              <TabsContent value="delivery" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Delivery Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Truck className="h-5 w-5 mr-2 text-orange-600" />
                        Delivery Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-gray-600">Delivery Address:</span>
                        <p className="font-medium">{orderDetails.delivery_address || 'Use project site address'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Delivery Instructions:</span>
                        <p className="font-medium">{orderDetails.delivery_instructions || 'Standard delivery'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Special Requirements:</span>
                        <p className="font-medium">{orderDetails.special_requirements || 'None'}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div>
                          <span className="text-gray-600">Order Created:</span>
                          <p className="font-medium">{formatDateTime(orderDetails.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <div>
                          <span className="text-gray-600">Required Date:</span>
                          <p className="font-medium">{formatDate(orderDetails.required_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Target className="h-4 w-4 text-blue-600" />
                        <div>
                          <span className="text-gray-600">Expected Delivery:</span>
                          <p className="font-medium">{formatDate(orderDetails.expected_delivery_date) || 'TBD'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-gray-600">Last Updated:</span>
                          <p className="font-medium">{formatDateTime(orderDetails.updated_at)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <FileText className="h-4 w-4 mr-2" />
                Print Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 