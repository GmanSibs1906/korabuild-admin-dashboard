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
  delivery_address: string;
  delivery_instructions: string;
  estimated_duration: number;
  actual_duration: number;
  special_requirements: string;
  priority: string;
  recipient_name: string;
  recipient_signature: string;
  delivery_confirmation_code: string;
  notes: string;
  completion_percentage: number;
  delivery_photos: string[];
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
    delivery_address: '',
    delivery_instructions: '',
    estimated_duration: 60,
    actual_duration: 0,
    special_requirements: '',
    priority: 'medium',
    recipient_name: '',
    recipient_signature: '',
    delivery_confirmation_code: '',
    notes: '',
    completion_percentage: 0,
    delivery_photos: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  // Pre-populate form with delivery data
  useEffect(() => {
    if (isOpen && delivery) {
      const scheduledDateTime = delivery.scheduled_datetime || '';
      const [date, time] = scheduledDateTime.split(' ');
      
      setFormData({
        delivery_date: date || '',
        delivery_time: time || '',
        delivery_status: delivery.delivery_status || 'scheduled',
        driver_name: delivery.driver_name || '',
        driver_phone: delivery.driver_phone || '',
        vehicle_type: delivery.vehicle_type || '',
        vehicle_registration: delivery.vehicle_registration || '',
        delivery_address: delivery.delivery_address || '',
        delivery_instructions: delivery.delivery_instructions || '',
        estimated_duration: delivery.estimated_duration || 60,
        actual_duration: delivery.actual_duration || 0,
        special_requirements: delivery.special_requirements || '',
        priority: delivery.priority || 'medium',
        recipient_name: delivery.recipient_name || '',
        recipient_signature: delivery.recipient_signature || '',
        delivery_confirmation_code: delivery.delivery_confirmation_code || '',
        notes: delivery.notes || '',
        completion_percentage: delivery.completion_percentage || 0,
        delivery_photos: delivery.delivery_photos || [],
      });
      setErrors({});
      setSelectedPhotos([]);
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

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const generateConfirmationCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    handleInputChange('delivery_confirmation_code', code);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Required fields
    if (!formData.delivery_date) newErrors.delivery_date = 'Delivery date is required';
    if (!formData.delivery_time) newErrors.delivery_time = 'Delivery time is required';
    if (!formData.driver_name) newErrors.driver_name = 'Driver name is required';
    if (!formData.driver_phone) newErrors.driver_phone = 'Driver phone is required';
    if (!formData.vehicle_type) newErrors.vehicle_type = 'Vehicle type is required';
    if (!formData.delivery_address) newErrors.delivery_address = 'Delivery address is required';

    // Status-specific validations
    if (formData.delivery_status === 'delivered') {
      if (!formData.recipient_name) newErrors.recipient_name = 'Recipient name is required for delivered status';
      if (formData.completion_percentage < 100) newErrors.completion_percentage = 'Completion must be 100% for delivered status';
    }

    // Validation rules
    if (formData.driver_phone && !/^\+?[\d\s-()]+$/.test(formData.driver_phone)) {
      newErrors.driver_phone = 'Invalid phone number format';
    }
    
    if (formData.estimated_duration < 15 || formData.estimated_duration > 480) {
      newErrors.estimated_duration = 'Duration must be between 15 and 480 minutes';
    }

    if (formData.completion_percentage < 0 || formData.completion_percentage > 100) {
      newErrors.completion_percentage = 'Completion percentage must be between 0 and 100';
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
      // Upload photos if any
      let photoUrls: string[] = [...formData.delivery_photos];
      
      if (selectedPhotos.length > 0) {
        const photoFormData = new FormData();
        selectedPhotos.forEach((file, index) => {
          photoFormData.append(`photos`, file);
        });
        photoFormData.append('deliveryId', delivery.id);
        
        const photoResponse = await fetch('/api/mobile-control/deliveries/photos', {
          method: 'POST',
          body: photoFormData,
        });
        
        if (photoResponse.ok) {
          const photoResult = await photoResponse.json();
          photoUrls = [...photoUrls, ...photoResult.photoUrls];
        }
      }

      const deliveryData = {
        ...formData,
        delivery_photos: photoUrls,
        scheduled_datetime: `${formData.delivery_date} ${formData.delivery_time}`,
        estimated_duration: Number(formData.estimated_duration),
        actual_duration: Number(formData.actual_duration),
        completion_percentage: Number(formData.completion_percentage),
      };

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
    
    // Auto-update completion percentage based on status
    if (status === 'delivered') {
      handleInputChange('completion_percentage', 100);
    } else if (status === 'in_transit') {
      handleInputChange('completion_percentage', 50);
    } else if (status === 'cancelled') {
      handleInputChange('completion_percentage', 0);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in_transit': 'bg-yellow-100 text-yellow-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'delayed': 'bg-orange-100 text-orange-800',
      'failed': 'bg-red-100 text-red-800',
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
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Delivery</h2>
              <p className="text-sm text-gray-600">
                Order: {delivery?.project_orders?.order_number || 'N/A'}
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
          {/* Delivery Status & Progress */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="delivery_status">Delivery Status</Label>
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
                    <SelectItem value="delivered">
                      <Badge className={getStatusColor('delivered')}>Delivered</Badge>
                    </SelectItem>
                    <SelectItem value="delayed">
                      <Badge className={getStatusColor('delayed')}>Delayed</Badge>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <Badge className={getStatusColor('cancelled')}>Cancelled</Badge>
                    </SelectItem>
                    <SelectItem value="failed">
                      <Badge className={getStatusColor('failed')}>Failed</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="completion_percentage">Completion (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.completion_percentage}
                  onChange={(e) => handleInputChange('completion_percentage', Number(e.target.value))}
                  className={errors.completion_percentage ? 'border-red-500' : ''}
                />
                {errors.completion_percentage && (
                  <p className="text-sm text-red-600 mt-1">{errors.completion_percentage}</p>
                )}
              </div>

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
                    <SelectItem value="urgent">
                      <Badge className={getPriorityColor('urgent')}>Urgent</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Delivery Scheduling */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="delivery_date">Delivery Date *</Label>
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
                <Label htmlFor="delivery_time">Delivery Time *</Label>
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
                <Label htmlFor="estimated_duration">Estimated Duration (minutes)</Label>
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
                <Label htmlFor="driver_name">Driver Name *</Label>
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
                <Label htmlFor="driver_phone">Driver Phone *</Label>
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
                <Label htmlFor="vehicle_type">Vehicle Type *</Label>
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
                <Label htmlFor="vehicle_registration">Vehicle Registration</Label>
                <Input
                  value={formData.vehicle_registration}
                  onChange={(e) => handleInputChange('vehicle_registration', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Delivery Address & Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery_address">Delivery Address *</Label>
                <Textarea
                  value={formData.delivery_address}
                  onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                  className={errors.delivery_address ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors.delivery_address && (
                  <p className="text-sm text-red-600 mt-1">{errors.delivery_address}</p>
                )}
              </div>

              <div>
                <Label htmlFor="delivery_instructions">Delivery Instructions</Label>
                <Textarea
                  value={formData.delivery_instructions}
                  onChange={(e) => handleInputChange('delivery_instructions', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Delivery Confirmation */}
          {formData.delivery_status === 'delivered' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Confirmation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipient_name">Recipient Name *</Label>
                  <Input
                    value={formData.recipient_name}
                    onChange={(e) => handleInputChange('recipient_name', e.target.value)}
                    className={errors.recipient_name ? 'border-red-500' : ''}
                  />
                  {errors.recipient_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.recipient_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="delivery_confirmation_code">Confirmation Code</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={formData.delivery_confirmation_code}
                      onChange={(e) => handleInputChange('delivery_confirmation_code', e.target.value)}
                      placeholder="Enter or generate code"
                    />
                    <Button
                      type="button"
                      onClick={generateConfirmationCode}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="actual_duration">Actual Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.actual_duration}
                    onChange={(e) => handleInputChange('actual_duration', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Photo Upload */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Photos</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="photos">Upload Photos</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="mt-1"
                />
              </div>

              {/* Existing Photos */}
              {formData.delivery_photos.length > 0 && (
                <div>
                  <Label>Current Photos</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {formData.delivery_photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Delivery photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Photos */}
              {selectedPhotos.length > 0 && (
                <div>
                  <Label>New Photos to Upload</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {selectedPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`New photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about the delivery"
              rows={3}
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
              {isSubmitting ? 'Updating...' : 'Update Delivery'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 