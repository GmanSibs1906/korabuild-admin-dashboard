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
  Plus, 
  Minus, 
  DollarSign, 
  Package, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Trash2,
  Calculator
} from 'lucide-react';

interface OrderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  suppliers: any[];
  onOrderCreated: (order: any) => void;
}

interface OrderFormData {
  supplier_id: string;
  order_date: string;
  expected_delivery_date: string;
  required_date: string;
  priority: 'low' | 'medium' | 'high';
  order_items: OrderItemFormData[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  special_instructions: string;
  delivery_address: string;
  notes: string;
}

interface OrderItemFormData {
  inventory_item_id: string;
  item_description: string;
  quantity_ordered: number;
  unit_cost: number;
  unit_of_measure: string; // Added required field
  line_total: number;
  notes: string;
}

export function OrderCreateModal({ isOpen, onClose, projectId, suppliers, onOrderCreated }: OrderCreateModalProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    required_date: '',
    priority: 'medium',
    order_items: [
      {
        inventory_item_id: '',
        item_description: '',
        quantity_ordered: 1,
        unit_cost: 0,
        unit_of_measure: 'EA', // Default unit of measure
        line_total: 0,
        notes: ''
      }
    ],
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    special_instructions: '',
    delivery_address: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  // Fetch inventory items on mount
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const response = await fetch(`/api/mobile-control/orders/inventory?projectId=${projectId}`);
        const result = await response.json();
        if (result.success) {
          setInventoryItems(result.data);
        }
      } catch (error) {
        console.error('Error fetching inventory items:', error);
      }
    };
    
    if (isOpen && projectId) {
      fetchInventoryItems();
    }
  }, [isOpen, projectId]);

  // Calculate totals whenever order items change
  useEffect(() => {
    const subtotal = formData.order_items.reduce((sum, item) => sum + item.line_total, 0);
    const tax_amount = 0; // No tax/VAT added as per USD pricing rules
    const total_amount = subtotal - formData.discount_amount;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount,
      total_amount
    }));
  }, [formData.order_items, formData.discount_amount]);

  const handleInputChange = (field: keyof OrderFormData, value: any) => {
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

  const handleOrderItemChange = (index: number, field: keyof OrderItemFormData, value: any) => {
    const updatedItems = [...formData.order_items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalculate line total if quantity or unit cost changes
    if (field === 'quantity_ordered' || field === 'unit_cost') {
      updatedItems[index].line_total = updatedItems[index].quantity_ordered * updatedItems[index].unit_cost;
    }
    
    setFormData(prev => ({
      ...prev,
      order_items: updatedItems
    }));
  };

  const addOrderItem = () => {
    setFormData(prev => ({
      ...prev,
      order_items: [
        ...prev.order_items,
        {
          inventory_item_id: '',
          item_description: '',
          quantity_ordered: 1,
          unit_cost: 0,
          unit_of_measure: 'EA', // Default unit of measure
          line_total: 0,
          notes: ''
        }
      ]
    }));
  };

  const removeOrderItem = (index: number) => {
    if (formData.order_items.length > 1) {
      const updatedItems = formData.order_items.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        order_items: updatedItems
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
    
    if (formData.order_items.length === 0) {
      newErrors.order_items = 'At least one order item is required';
    }
    
    formData.order_items.forEach((item, index) => {
      if (!item.item_description) {
        newErrors[`item_description_${index}`] = 'Item description is required';
      }
      if (item.quantity_ordered <= 0) {
        newErrors[`quantity_${index}`] = 'Quantity must be greater than 0';
      }
      if (!item.unit_of_measure) {
        newErrors[`unit_of_measure_${index}`] = 'Unit of measure is required';
      }
      if (item.unit_cost < 0) {
        newErrors[`unit_cost_${index}`] = 'Unit cost cannot be negative';
      }
    });
    
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
      // Calculate final totals before submission
      const subtotal = formData.order_items.reduce((sum, item) => sum + (item.line_total || 0), 0);
      const taxAmount = 0; // No tax/VAT added as per USD pricing rules
      const total = subtotal - formData.discount_amount;

      // Map special_instructions to delivery_instructions and exclude the original field
      const { special_instructions, ...restFormData } = formData;
      const finalOrderData = {
        ...restFormData,
        delivery_instructions: special_instructions, // Map special_instructions to delivery_instructions
        subtotal,
        tax_amount: taxAmount,
        total_amount: total
      };

      console.log('🎯 Creating order with data:', {
        action: 'create',
        projectId,
        orderData: finalOrderData,
        itemsCount: finalOrderData.order_items.length
      });

      const response = await fetch('/api/mobile-control/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',  // Add the required action field
          projectId,
          orderData: finalOrderData
        }),
      });
      
      const result = await response.json();
      
      console.log('🎯 Order creation result:', result);

      if (result.success) {
        onOrderCreated(result.data);
        onClose();
        
        // Reset form
        setFormData({
          supplier_id: '',
          order_date: new Date().toISOString().split('T')[0],
          expected_delivery_date: '',
          required_date: '',
          priority: 'medium',
          order_items: [],
          subtotal: 0,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: 0,
          special_instructions: '',
          delivery_address: '',
          notes: ''
        });
        setErrors({});
      } else {
        console.error('Failed to create order:', result.error);
        setErrors({ submit: result.error || 'Failed to create order' });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setErrors({ submit: 'Failed to create order. Please try again.' });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-[#fe6700]" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create New Order</h2>
              <p className="text-sm text-gray-500">Add a new material order for the project</p>
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
          {/* Basic Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Order Information</span>
              </CardTitle>
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

                {/* Priority */}
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value as 'low' | 'medium' | 'high')}
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
                  value={formData.special_instructions}
                  onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                  placeholder="Any special instructions for this order"
                  rows={3}
                  className='bg-white text-gray-900'
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Order Items</span>
                </div>
                <Button type="button" size="sm" onClick={addOrderItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.order_items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {formData.order_items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOrderItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                      {/* Item Description */}
                      <div className="md:col-span-2">
                        <Label htmlFor={`item_description_${index}`}>Description *</Label>
                        <Input
                          value={item.item_description}
                          onChange={(e) => handleOrderItemChange(index, 'item_description', e.target.value)}
                          placeholder="Item description"
                          className={errors[`item_description_${index}`] ? 'border-red-500' : ''}
                        />
                        {errors[`item_description_${index}`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`item_description_${index}`]}</p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div>
                        <Label htmlFor={`quantity_${index}`}>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity_ordered}
                          onChange={(e) => handleOrderItemChange(index, 'quantity_ordered', parseInt(e.target.value) || 0)}
                          className={errors[`quantity_${index}`] ? 'border-red-500' : ''}
                        />
                        {errors[`quantity_${index}`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`quantity_${index}`]}</p>
                        )}
                      </div>

                      {/* Unit of Measure */}
                      <div>
                        <Label htmlFor={`unit_of_measure_${index}`}>Unit *</Label>
                        <Select
                          value={item.unit_of_measure}
                          onValueChange={(value) => handleOrderItemChange(index, 'unit_of_measure', value)}
                        >
                          <option value="">Select unit</option>
                          <option value="EA">Each</option>
                          <option value="M">Meters</option>
                          <option value="KG">Kilograms</option>
                          <option value="L">Liters</option>
                          <option value="M2">Square Meters</option>
                          <option value="M3">Cubic Meters</option>
                          <option value="TON">Tons</option>
                          <option value="BAG">Bags</option>
                          <option value="BOX">Boxes</option>
                          <option value="ROLL">Rolls</option>
                        </Select>
                        {errors[`unit_of_measure_${index}`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`unit_of_measure_${index}`]}</p>
                        )}
                      </div>

                      {/* Unit Cost */}
                      <div>
                        <Label htmlFor={`unit_cost_${index}`}>Unit Cost *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_cost}
                          onChange={(e) => handleOrderItemChange(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                          className={errors[`unit_cost_${index}`] ? 'border-red-500' : ''}
                        />
                        {errors[`unit_cost_${index}`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`unit_cost_${index}`]}</p>
                        )}
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Line Total: <span className="font-semibold">{formatCurrency(item.line_total)}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.quantity_ordered} × {formatCurrency(item.unit_cost)}
                      </div>
                    </div>

                    {/* Item Notes */}
                    <div className="mt-3">
                      <Label htmlFor={`notes_${index}`}>Notes</Label>
                      <Input
                        value={item.notes}
                        onChange={(e) => handleOrderItemChange(index, 'notes', e.target.value)}
                        placeholder="Optional notes for this item"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Order Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(formData.subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <Label htmlFor="discount">Discount:</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_amount}
                    onChange={(e) => handleInputChange('discount_amount', parseFloat(e.target.value) || 0)}
                    className="w-32 text-right"
                  />
                </div>
                
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-[#fe6700]">{formatCurrency(formData.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes for this order"
                rows={3}
                className='bg-white text-gray-900'
              />
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
                  Creating Order...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 