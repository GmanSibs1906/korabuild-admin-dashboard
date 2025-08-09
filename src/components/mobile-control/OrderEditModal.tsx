'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Edit3, 
  Save, 
  DollarSign, 
  Package, 
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2
} from 'lucide-react';

interface OrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  suppliers: any[];
  onOrderUpdated: (order: any) => void;
}

export function OrderEditModal({ isOpen, onClose, order, suppliers, onOrderUpdated }: OrderEditModalProps) {
  const [formData, setFormData] = useState({
    supplier_id: '',
    order_date: '',
    expected_delivery_date: '',
    required_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'draft' as 'draft' | 'pending' | 'confirmed' | 'delivered' | 'cancelled',
    delivery_instructions: '',
    delivery_address: '',
    notes: ''
  });
  
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Populate form with existing order data
  useEffect(() => {
    if (order) {
      console.log('📦 OrderEditModal received order data:', {
        orderId: order.id,
        orderNumber: order.order_number,
        hasOrderItems: !!order.order_items,
        orderItemsCount: order.order_items?.length || 0,
        orderItemsRaw: order.order_items,
        totalAmount: order.total_amount,
        subtotal: order.subtotal
      });

      setFormData({
        supplier_id: order.supplier_id || '',
        order_date: order.order_date ? order.order_date.split('T')[0] : '',
        expected_delivery_date: order.expected_delivery_date ? order.expected_delivery_date.split('T')[0] : '',
        required_date: order.required_date ? order.required_date.split('T')[0] : '',
        priority: order.priority || 'medium',
        status: order.status || 'draft',
        delivery_instructions: order.delivery_instructions || '',
        delivery_address: order.delivery_address || '',
        notes: order.notes || ''
      });
      
      // Set order items with proper numeric conversions
      const items = order.order_items || [];
      console.log('📦 Processing order items:', items);
      
      const processedItems = items.map((item: any) => ({
        ...item,
        quantity_ordered: parseFloat(item.quantity_ordered) || 0,
        quantity_delivered: parseFloat(item.quantity_delivered) || 0,
        unit_cost: parseFloat(item.unit_cost) || 0,
        line_total: (parseFloat(item.quantity_ordered) || 0) * (parseFloat(item.unit_cost) || 0)
      }));
      
      console.log('📦 Processed order items:', processedItems);
      setOrderItems(processedItems);
      
      console.log('🔄 Order loaded for editing:', {
        orderId: order.id,
        orderNumber: order.order_number,
        itemsCount: processedItems.length,
        totalAmount: order.total_amount
      });
    }
  }, [order]);

  // Add new item
  const addOrderItem = () => {
    const newItem = {
      id: `temp_${Date.now()}`,
      line_number: orderItems.length + 1,
      item_description: '',
      quantity_ordered: 1,
      unit_of_measure: 'pieces',
      unit_cost: 0,
      line_total: 0,
      notes: '',
      isNew: true
    };
    
    console.log('➕ Adding new order item:', newItem);
    console.log('📦 Current order items before add:', orderItems);
    
    const updatedItems = [...orderItems, newItem];
    setOrderItems(updatedItems);
    
    console.log('📦 Order items after add:', updatedItems);
  };

  // Update order item
  const updateOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Calculate line total when quantity or unit cost changes
    if (field === 'quantity_ordered' || field === 'unit_cost') {
      const quantity = parseFloat(field === 'quantity_ordered' ? value : updatedItems[index].quantity_ordered) || 0;
      const unitCost = parseFloat(field === 'unit_cost' ? value : updatedItems[index].unit_cost) || 0;
      updatedItems[index].line_total = quantity * unitCost;
    }
    
    setOrderItems(updatedItems);
  };

  // Remove order item
  const removeOrderItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    // Update line numbers
    updatedItems.forEach((item, i) => {
      item.line_number = i + 1;
    });
    setOrderItems(updatedItems);
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.line_total || 0), 0);
    // No VAT/tax added as per project rules - prices are in USD without VAT
    const taxAmount = 0;
    const total = subtotal;
    
    return {
      subtotal,
      taxAmount,
      total
    };
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Please select a supplier';
    }
    
    if (!formData.order_date) {
      newErrors.order_date = 'Order date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Ensure all numeric values are properly parsed
      const processedItems = orderItems.map((item, index) => ({
        ...item,
        line_number: index + 1,
        quantity_ordered: parseFloat(item.quantity_ordered) || 0,
        quantity_delivered: parseFloat(item.quantity_delivered) || 0,
        unit_cost: parseFloat(item.unit_cost) || 0,
        line_total: (parseFloat(item.quantity_ordered) || 0) * (parseFloat(item.unit_cost) || 0)
      }));

      const { subtotal, taxAmount, total } = calculateTotals();
      
      const orderData = {
        ...formData,
        order_items: processedItems,
        subtotal,
        tax_amount: taxAmount,
        total_amount: total
      };

      console.log('🔄 Submitting order update:', { orderId: order.id, orderData });

      const response = await fetch('/api/mobile-control/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          orderId: order.id,
          orderData: orderData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Order updated successfully:', result.data);
        onOrderUpdated(result.data);
        onClose();
      } else {
        throw new Error(result.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('❌ Error updating order:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to update order'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Edit3 className="h-6 w-6 text-[#fe6700]" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Order</h2>
              <p className="text-sm text-gray-500">Order #{order.order_number}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Current Order Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Total Amount</Label>
                  <div className="text-lg font-bold text-[#fe6700]">
                    {formatCurrency(order.total_amount || 0)}
                  </div>
                </div>
                <div>
                  <Label>Current Status</Label>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status?.replace('_', ' ') || 'Draft'}
                  </Badge>
                </div>
                <div>
                  <Label>Items Count</Label>
                  <div className="text-lg font-semibold">
                    {order.order_items?.length || 0} items
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Order Information */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier Selection */}
                <div>
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => handleInputChange('supplier_id', value)}
                  >
                    <SelectTrigger className={errors.supplier_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{supplier.supplier_name}</span>
                            <Badge variant="secondary" className="ml-2">
                              {supplier.specialty}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.supplier_id && (
                    <p className="text-sm text-red-600 mt-1">{errors.supplier_id}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        <Badge className={getStatusColor('draft')}>Draft</Badge>
                      </SelectItem>
                      <SelectItem value="pending">
                        <Badge className={getStatusColor('pending')}>Pending</Badge>
                      </SelectItem>
                      <SelectItem value="confirmed">
                        <Badge className={getStatusColor('confirmed')}>Confirmed</Badge>
                      </SelectItem>
                      <SelectItem value="delivered">
                        <Badge className={getStatusColor('delivered')}>Delivered</Badge>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <Badge className={getStatusColor('cancelled')}>Cancelled</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <Badge className={getPriorityColor('low')}>Low</Badge>
                      </SelectItem>
                      <SelectItem value="medium">
                        <Badge className={getPriorityColor('medium')}>Medium</Badge>
                      </SelectItem>
                      <SelectItem value="high">
                        <Badge className={getPriorityColor('high')}>High</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Date */}
                <div>
                  <Label htmlFor="order_date">Order Date *</Label>
                  <Input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => handleInputChange('order_date', e.target.value)}
                    className={errors.order_date ? 'border-red-500' : ''}
                  />
                  {errors.order_date && (
                    <p className="text-sm text-red-600 mt-1">{errors.order_date}</p>
                  )}
                </div>

                {/* Expected Delivery Date */}
                <div>
                  <Label htmlFor="expected_delivery_date">Expected Delivery</Label>
                  <Input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => handleInputChange('expected_delivery_date', e.target.value)}
                  />
                </div>

                {/* Required Date */}
                <div>
                  <Label htmlFor="required_date">Required Date</Label>
                  <Input
                    type="date"
                    value={formData.required_date}
                    onChange={(e) => handleInputChange('required_date', e.target.value)}
                  />
                </div>

                {/* Delivery Address */}
                <div>
                  <Label htmlFor="delivery_address">Delivery Address</Label>
                  <Input
                    value={formData.delivery_address}
                    onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                    placeholder="Enter delivery address"
                  />
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <Label htmlFor="special_instructions">Special Instructions</Label>
                <Textarea
                  value={formData.delivery_instructions}
                  onChange={(e) => handleInputChange('delivery_instructions', e.target.value)}
                  placeholder="Any special instructions for this order"
                  rows={3}
                  className="bg-white"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional notes for this order"
                  rows={3}
                  className="bg-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Items Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Order Items</h3>
                <Button
                  type="button"
                  onClick={addOrderItem}
                  className="bg-[#fe6700] hover:bg-[#e55a00]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No items added yet. Click "Add Item" to start.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div key={item.id || index} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        {/* Item Description */}
                        <div className="md:col-span-2">
                          <Label>Item Description *</Label>
                          <Input
                            value={item.item_description}
                            onChange={(e) => updateOrderItem(index, 'item_description', e.target.value)}
                            placeholder="Enter item description"
                          />
                        </div>

                        {/* Quantity */}
                        <div>
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity_ordered}
                            onChange={(e) => updateOrderItem(index, 'quantity_ordered', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        {/* Unit of Measure */}
                        <div>
                          <Label>Unit</Label>
                          <Select
                            value={item.unit_of_measure}
                            onValueChange={(value) => updateOrderItem(index, 'unit_of_measure', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pieces">Pieces</SelectItem>
                              <SelectItem value="meters">Meters</SelectItem>
                              <SelectItem value="cubic meters">Cubic Meters</SelectItem>
                              <SelectItem value="square meters">Square Meters</SelectItem>
                              <SelectItem value="kilograms">Kilograms</SelectItem>
                              <SelectItem value="tons">Tons</SelectItem>
                              <SelectItem value="liters">Liters</SelectItem>
                              <SelectItem value="sets">Sets</SelectItem>
                              <SelectItem value="rolls">Rolls</SelectItem>
                              <SelectItem value="boxes">Boxes</SelectItem>
                              <SelectItem value="units">Units</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Unit Cost */}
                        <div>
                          <Label>Unit Cost (R) *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_cost}
                            onChange={(e) => updateOrderItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeOrderItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Line Total Display */}
                      <div className="mt-2 text-right">
                        <span className="text-sm text-gray-600">Line Total: </span>
                        <span className="font-medium">{formatCurrency(item.line_total || 0)}</span>
                      </div>

                      {/* Item Notes */}
                      <div className="mt-3">
                        <Label>Item Notes</Label>
                        <Input
                          value={item.notes || ''}
                          onChange={(e) => updateOrderItem(index, 'notes', e.target.value)}
                          placeholder="Additional notes for this item"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Totals */}
              {orderItems.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(calculateTotals().subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>{formatCurrency(calculateTotals().taxAmount)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(calculateTotals().total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#fe6700] hover:bg-[#e55a00]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Order
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 