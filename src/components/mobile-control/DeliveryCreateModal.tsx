import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';

interface DeliveryCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  availableOrders: any[];
  onDeliveryCreated: (delivery: any) => void;
}

interface DeliveryFormData {
  order_id: string;
  delivery_date: string;
  delivery_time: string;
  delivery_status: string;
  driver_name: string;
  driver_phone: string;
  vehicle_type: string;
  vehicle_registration: string;
  delivery_address: string;
  delivery_instructions: string;
  estimated_duration: number;
  special_requirements: string;
  priority: string;
  recipient_name: string;
  notes: string;
  delivery_items: DeliveryItemData[];
}

interface DeliveryItemData {
  order_item_id: string;
  item_description: string;
  quantity_ordered: number;
  quantity_to_deliver: number;
  unit_of_measure: string;
  notes?: string;
}

export function DeliveryCreateModal({
  isOpen,
  onClose,
  projectId,
  availableOrders,
  onDeliveryCreated,
}: DeliveryCreateModalProps) {
  const [formData, setFormData] = useState<DeliveryFormData>({
    order_id: '',
    delivery_date: '',
    delivery_time: '',
    delivery_status: 'scheduled',
    driver_name: '',
    driver_phone: '',
    vehicle_type: '',
    vehicle_registration: '',
    delivery_address: '',
    delivery_instructions: '',
    estimated_duration: 60,
    special_requirements: '',
    priority: 'medium',
    recipient_name: '',
    notes: '',
    delivery_items: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        order_id: '',
        delivery_date: '',
        delivery_time: '',
        delivery_status: 'scheduled',
        driver_name: '',
        driver_phone: '',
        vehicle_type: '',
        vehicle_registration: '',
        delivery_address: '',
        delivery_instructions: '',
        estimated_duration: 60,
        special_requirements: '',
        priority: 'medium',
        recipient_name: '',
        notes: '',
        delivery_items: [],
      });
      setErrors({});
      setSelectedOrder(null);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof DeliveryFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleOrderSelect = (orderId: string) => {
    const order = availableOrders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setFormData(prev => ({
        ...prev,
        order_id: orderId,
        delivery_address: order.delivery_address || '',
        delivery_items: order.order_items?.map((item: any) => ({
          order_item_id: item.id,
          item_description: item.item_description,
          quantity_ordered: item.quantity_ordered,
          quantity_to_deliver: item.quantity_ordered - (item.quantity_delivered || 0),
          unit_of_measure: item.unit_of_measure,
          notes: '',
        })) || [],
      }));
    }
  };

  const handleDeliveryItemChange = (index: number, field: keyof DeliveryItemData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      delivery_items: prev.delivery_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Required fields
    if (!formData.order_id) newErrors.order_id = 'Order selection is required';
    if (!formData.delivery_date) newErrors.delivery_date = 'Delivery date is required';
    if (!formData.delivery_time) newErrors.delivery_time = 'Delivery time is required';
    if (!formData.driver_name) newErrors.driver_name = 'Driver name is required';
    if (!formData.driver_phone) newErrors.driver_phone = 'Driver phone is required';
    if (!formData.vehicle_type) newErrors.vehicle_type = 'Vehicle type is required';
    if (!formData.delivery_address) newErrors.delivery_address = 'Delivery address is required';

    // Validate delivery items
    if (formData.delivery_items.length === 0) {
      newErrors.delivery_items = 'At least one item must be selected for delivery';
    } else {
      const hasItemsToDeliver = formData.delivery_items.some(item => item.quantity_to_deliver > 0);
      if (!hasItemsToDeliver) {
        newErrors.delivery_items = 'At least one item must have a quantity to deliver greater than 0';
      }
      
      // Validate individual items
      formData.delivery_items.forEach((item, index) => {
        if (item.quantity_to_deliver > item.quantity_ordered) {
          newErrors[`delivery_item_${index}`] = 'Quantity to deliver cannot exceed quantity ordered';
        }
        if (item.quantity_to_deliver < 0) {
          newErrors[`delivery_item_${index}`] = 'Quantity to deliver cannot be negative';
        }
      });
    }

    // Validate phone number format
    if (formData.driver_phone && !/^\+?[\d\s-()]+$/.test(formData.driver_phone)) {
      newErrors.driver_phone = 'Please enter a valid phone number';
    }

    // Validate estimated duration
    if (formData.estimated_duration < 15 || formData.estimated_duration > 480) {
      newErrors.estimated_duration = 'Duration must be between 15 and 480 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const deliveryData = {
        order_id: formData.order_id,
        delivery_date: formData.delivery_date,
        delivery_time: formData.delivery_time,
        delivery_status: formData.delivery_status,
        driver_name: formData.driver_name,
        driver_phone: formData.driver_phone,
        vehicle_type: formData.vehicle_type,
        vehicle_registration: formData.vehicle_registration,
        delivery_method: 'standard',
        delivery_address: formData.delivery_address,
        delivery_instructions: formData.delivery_instructions,
        estimated_duration: formData.estimated_duration,
        special_requirements: formData.special_requirements,
        priority: formData.priority,
        recipient_name: formData.recipient_name,
        notes: formData.notes,
        delivery_items: formData.delivery_items.filter(item => item.quantity_to_deliver > 0),
      };

      console.log('🚚 Creating delivery with data:', {
        action: 'create',
        projectId,
        deliveryData,
        itemsCount: deliveryData.delivery_items.length
      });

      const response = await fetch(`/api/mobile-control/deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',  // Add required action field
          projectId,         // Add required projectId field
          deliveryData       // Send deliveryData in the expected structure
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create delivery');
      }

      const result = await response.json();
      
      console.log('🚚 Delivery creation result:', result);
      
      if (result.success) {
        onDeliveryCreated(result.data);
        onClose();
      } else {
        throw new Error(result.error || 'Failed to create delivery');
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create delivery',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in_transit': 'bg-yellow-100 text-yellow-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'delayed': 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Schedule New Delivery</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order_id" className='text-gray-900'>Select Order *</Label>
                <Select 
                  value={formData.order_id} 
                  onValueChange={handleOrderSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an order for delivery" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        <div className="flex items-center space-x-2">
                          <span>{order.order_number}</span>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status?.replace('_', ' ') || 'Draft'}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            R{order.total_amount?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.order_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.order_id}</p>
                )}
              </div>

              {selectedOrder && (
                <div>
                  <Label className='text-gray-900'>Order Details</Label>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm font-medium text-orange-500">{selectedOrder.order_number}</p>
                    <p className="text-sm text-gray-600">
                      {selectedOrder.suppliers?.supplier_name || 'Unknown Supplier'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedOrder.order_items?.length || 0} items
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items to Deliver */}
          {selectedOrder && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Items to Deliver</h3>
              
              {formData.delivery_items.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        No Items Available for Delivery
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          The selected order does not have any items, or all items have already been delivered. 
                          Please select a different order that has available items.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* General delivery items error */}
                  {errors.delivery_items && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{errors.delivery_items}</p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {formData.delivery_items.map((item, index) => (
                      <div key={item.order_item_id} className="bg-white p-4 rounded-lg border">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium text-gray-900">Item Description</Label>
                            <p className="text-sm text-gray-700">{item.item_description}</p>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-gray-900">Ordered</Label>
                            <p className="text-sm text-gray-700">
                              {item.quantity_ordered} {item.unit_of_measure}
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor={`quantity_to_deliver_${index}`} className="text-sm font-medium text-gray-900">
                              Quantity to Deliver *
                            </Label>
                            <Input
                              id={`quantity_to_deliver_${index}`}
                              type="number"
                              min="0"
                              max={item.quantity_ordered}
                              step="0.01"
                              value={item.quantity_to_deliver}
                              onChange={(e) => handleDeliveryItemChange(index, 'quantity_to_deliver', parseFloat(e.target.value) || 0)}
                              className={`mt-1 ${errors[`delivery_item_${index}`] ? 'border-red-500' : ''}`}
                            />
                            {errors[`delivery_item_${index}`] && (
                              <p className="text-sm text-red-600 mt-1">{errors[`delivery_item_${index}`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor={`item_notes_${index}`} className="text-sm font-medium text-gray-900">
                              Notes
                            </Label>
                            <Input
                              id={`item_notes_${index}`}
                              value={item.notes || ''}
                              onChange={(e) => handleDeliveryItemChange(index, 'notes', e.target.value)}
                              placeholder="Item-specific notes"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Delivery Scheduling */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="delivery_date" className='text-gray-900'>Delivery Date *</Label>
                <Input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                  className={errors.delivery_date ? 'border-red-500' : ''}
                />
                {errors.delivery_date && (
                  <p className="text-sm text-red-600 mt-1">{errors.delivery_date}</p>
                )}
              </div>

              <div>
                <Label htmlFor="delivery_time" className='text-gray-900'>Delivery Time *</Label>
                <Input
                  type="time"
                  value={formData.delivery_time}
                  onChange={(e) => handleInputChange('delivery_time', e.target.value)}
                  className={errors.delivery_time ? 'border-red-500' : ''}
                />
                {errors.delivery_time && (
                  <p className="text-sm text-red-600 mt-1">{errors.delivery_time}</p>
                )}
              </div>

              <div>
                <Label htmlFor="estimated_duration" className='text-gray-900'>Estimated Duration (minutes)</Label>
                <Input
                  type="number"
                  min="15"
                  max="480"
                  value={formData.estimated_duration}
                  onChange={(e) => handleInputChange('estimated_duration', Number(e.target.value))}
                  className={errors.estimated_duration ? 'border-red-500' : ''}
                />
                {errors.estimated_duration && (
                  <p className="text-sm text-red-600 mt-1">{errors.estimated_duration}</p>
                )}
              </div>
            </div>
          </div>

          {/* Driver & Vehicle Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver & Vehicle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driver_name" className='text-gray-900'>Driver Name *</Label>
                <Input
                  value={formData.driver_name}
                  onChange={(e) => handleInputChange('driver_name', e.target.value)}
                  placeholder="Full name of the driver"
                  className={errors.driver_name ? 'border-red-500' : ''}
                />
                {errors.driver_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.driver_name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="driver_phone" className='text-gray-900'>Driver Phone *</Label>
                <Input
                  value={formData.driver_phone}
                  onChange={(e) => handleInputChange('driver_phone', e.target.value)}
                  placeholder="+263 XX XXX XXXX"
                  className={errors.driver_phone ? 'border-red-500' : ''}
                />
                {errors.driver_phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.driver_phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="vehicle_type" className='text-gray-900'>Vehicle Type *</Label>
                <Select 
                  value={formData.vehicle_type} 
                  onValueChange={(value) => handleInputChange('vehicle_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bakkie">Bakkie</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="flatbed">Flatbed</SelectItem>
                    <SelectItem value="crane_truck">Crane Truck</SelectItem>
                    <SelectItem value="tipper">Tipper</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="trailer">Trailer</SelectItem>
                  </SelectContent>
                </Select>
                {errors.vehicle_type && (
                  <p className="text-sm text-red-600 mt-1">{errors.vehicle_type}</p>
                )}
              </div>

              <div>
                <Label htmlFor="vehicle_registration" className='text-gray-900'>Vehicle Registration</Label>
                <Input
                  value={formData.vehicle_registration}
                  onChange={(e) => handleInputChange('vehicle_registration', e.target.value)}
                  placeholder="ABP 4335"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address & Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery_address" className='text-gray-900'>Delivery Address *</Label>
                <Textarea
                  value={formData.delivery_address}
                  onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                  placeholder="Complete delivery address"
                  className={errors.delivery_address ? 'border-red-500 bg-white text-gray-900' : 'bg-white text-gray-900'}
                  rows={3}
                />
                {errors.delivery_address && (
                  <p className="text-sm text-red-600 mt-1">{errors.delivery_address}</p>
                )}
              </div>

              <div>
                <Label htmlFor="delivery_instructions" className='text-gray-900'>Delivery Instructions</Label>
                <Textarea
                  value={formData.delivery_instructions}
                  onChange={(e) => handleInputChange('delivery_instructions', e.target.value)}
                  placeholder="Special instructions for delivery"
                  rows={3}
                  className='bg-white text-gray-900'
                />
              </div>

              <div>
                <Label htmlFor="recipient_name" className='text-gray-900'>Recipient Name</Label>
                <Input
                  value={formData.recipient_name}
                  onChange={(e) => handleInputChange('recipient_name', e.target.value)}
                  placeholder="Person receiving the delivery"
                />
              </div>

              <div>
                <Label htmlFor="priority" className='text-gray-900'>Priority</Label>
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
                    <SelectItem value="urgent">
                      <Badge className={getPriorityColor('urgent')}>Urgent</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <Label htmlFor="special_requirements" className='text-gray-900'>Special Requirements</Label>
            <Textarea
              value={formData.special_requirements}
              onChange={(e) => handleInputChange('special_requirements', e.target.value)}
              placeholder="Any special handling requirements, equipment needed, etc."
              rows={2}
              className='bg-white text-gray-900'
            />
          </div>

          <div>
            <Label htmlFor="notes" className='text-gray-900' >Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about the delivery"
              rows={2}
              className='bg-white text-gray-900'
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-fe6700 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Delivery'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 