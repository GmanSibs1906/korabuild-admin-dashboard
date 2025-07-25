import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';

interface DeliveryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: any;
  onDeliveryUpdated: (delivery: any) => void;
}

interface DeliveryFormData {
  delivery_date: string;
  delivery_time: string;
  delivery_status: string;
  driver_name: string;
  driver_phone: string;
  vehicle_type: string;
  vehicle_registration: string;
  delivery_instructions: string;
  recipient_name: string;
  notes: string;
}

export function DeliveryEditModal({
  isOpen,
  onClose,
  delivery,
  onDeliveryUpdated,
}: DeliveryEditModalProps) {
  const [formData, setFormData] = useState<DeliveryFormData>({
    delivery_date: '',
    delivery_time: '',
    delivery_status: 'scheduled',
    driver_name: '',
    driver_phone: '',
    vehicle_type: '',
    vehicle_registration: '',
    delivery_instructions: '',
    recipient_name: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [deliveryAddress, setDeliveryAddress] = useState<string>(''); // Read-only from order

  // Pre-populate form with delivery data
  useEffect(() => {
    if (isOpen && delivery) {
      console.log('🚚 Loading delivery data for edit:', delivery);
      
      // Parse vehicle_info to extract vehicle type and registration
      const vehicleInfo = delivery.vehicle_info || '';
      const vehicleParts = vehicleInfo.split(' - ');
      const vehicleType = vehicleParts[0] || '';
      const vehicleRegistration = vehicleParts[1] || '';
      
      // Set delivery address from the related order (read-only)
      const orderDeliveryAddress = delivery.project_orders?.delivery_address || '';
      setDeliveryAddress(orderDeliveryAddress);
      
      setFormData({
        delivery_date: delivery.delivery_date || '',
        delivery_time: delivery.scheduled_time || '',
        delivery_status: delivery.delivery_status || 'scheduled',
        driver_name: delivery.driver_name || '',
        driver_phone: delivery.driver_phone || '',
        vehicle_type: vehicleType,
        vehicle_registration: vehicleRegistration,
        delivery_instructions: delivery.special_handling_notes || '',
        recipient_name: delivery.received_by_name || '',
        notes: delivery.notes || '',
      });
      
      console.log('🚚 Form populated with delivery data:', {
        deliveryAddress: orderDeliveryAddress,
        vehicleType,
        vehicleRegistration
      });
      setErrors({});
    }
  }, [isOpen, delivery]);

  const handleInputChange = (field: keyof DeliveryFormData, value: string | number | string[]) => {
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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Required fields
    if (!formData.delivery_date) newErrors.delivery_date = 'Delivery date is required';
    if (!formData.delivery_time) newErrors.delivery_time = 'Delivery time is required';
    if (!formData.driver_name) newErrors.driver_name = 'Driver name is required';
    if (!formData.driver_phone) newErrors.driver_phone = 'Driver phone is required';
    if (!formData.vehicle_type) newErrors.vehicle_type = 'Vehicle type is required';

    // Status-specific validations
    if (formData.delivery_status === 'completed') {
      if (!formData.recipient_name) newErrors.recipient_name = 'Recipient name is required for completed status';
    }

    // Validation rules
    if (formData.driver_phone && !/^\+?[\d\s-()]+$/.test(formData.driver_phone)) {
      newErrors.driver_phone = 'Invalid phone number format';
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

    try {
      // Map form data to database fields (excluding delivery_address which is in orders table)
      const deliveryData = {
        delivery_date: formData.delivery_date,
        scheduled_time: formData.delivery_time,
        delivery_status: formData.delivery_status,
        driver_name: formData.driver_name,
        driver_phone: formData.driver_phone,
        vehicle_info: `${formData.vehicle_type} - ${formData.vehicle_registration}`,
        received_by_name: formData.recipient_name,
        special_handling_notes: formData.delivery_instructions,
        notes: formData.notes,
      };

      console.log('🚚 Updating delivery:', delivery.id, 'with data:', deliveryData);

      const response = await fetch('/api/mobile-control/deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          deliveryId: delivery.id,
          deliveryData,
        }),
      });

      const result = await response.json();

      console.log('🚚 Delivery update result:', result);

      if (result.success) {
        console.log('✅ Delivery updated successfully:', result.data);
        onDeliveryUpdated(result.data);
        onClose();
      } else {
        throw new Error(result.error || 'Failed to update delivery');
      }
    } catch (error) {
      console.error('❌ Error updating delivery:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to update delivery' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (status: string) => {
    handleInputChange('delivery_status', status);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in_transit': 'bg-yellow-100 text-yellow-800',
      'arrived': 'bg-purple-100 text-purple-800',
      'unloading': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'failed': 'bg-red-100 text-red-800',
      'rescheduled': 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Delivery</h2>
              <p className="text-sm text-gray-600">
                Order: {delivery?.project_orders?.order_number || 'N/A'} | Delivery: {delivery?.delivery_number || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Delivery Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery_status" className='text-gray-900'>Delivery Status</Label>
                <Select 
                  value={formData.delivery_status} 
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">
                      <Badge className={getStatusColor('scheduled')}>Scheduled</Badge>
                    </SelectItem>
                    <SelectItem value="in_transit">
                      <Badge className={getStatusColor('in_transit')}>In Transit</Badge>
                    </SelectItem>
                    <SelectItem value="arrived">
                      <Badge className={getStatusColor('arrived')}>Arrived</Badge>
                    </SelectItem>
                    <SelectItem value="unloading">
                      <Badge className={getStatusColor('unloading')}>Unloading</Badge>
                    </SelectItem>
                    <SelectItem value="completed">
                      <Badge className={getStatusColor('completed')}>Completed</Badge>
                    </SelectItem>
                    <SelectItem value="failed">
                      <Badge className={getStatusColor('failed')}>Failed</Badge>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <Badge className={getStatusColor('cancelled')}>Cancelled</Badge>
                    </SelectItem>
                    <SelectItem value="rescheduled">
                      <Badge className={getStatusColor('rescheduled')}>Rescheduled</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Delivery Scheduling */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectValue />
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
                />
              </div>
            </div>
          </div>

          {/* Delivery Address (Read-only from Order) & Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery_address" className='text-gray-900'>Delivery Address (from Order)</Label>
                <Textarea
                  value={deliveryAddress}
                  readOnly
                  className="bg-gray-100 text-gray-700"
                  rows={3}
                  placeholder="Delivery address from the associated order"
                />
                <p className="text-xs text-gray-500 mt-1">This address is set on the order and cannot be changed here</p>
              </div>

              <div>
                <Label htmlFor="delivery_instructions" className='text-gray-900'>Special Handling Notes</Label>
                <Textarea
                  value={formData.delivery_instructions}
                  onChange={(e) => handleInputChange('delivery_instructions', e.target.value)}
                  rows={3}
                  placeholder="Special handling instructions for this delivery"
                  className='bg-white text-gray-900'
                />
              </div>
            </div>
          </div>

          {/* Delivery Confirmation */}
          {(formData.delivery_status === 'completed' || formData.delivery_status === 'arrived') && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Confirmation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipient_name" className='text-gray-900'>Recipient Name *</Label>
                  <Input
                    value={formData.recipient_name}
                    onChange={(e) => handleInputChange('recipient_name', e.target.value)}
                    className={errors.recipient_name ? 'border-red-500' : ''}
                    placeholder="Person who received the delivery"
                  />
                  {errors.recipient_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.recipient_name}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes" className='text-gray-900'>Additional Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about the delivery"
              rows={3}
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
              className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Delivery'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 