'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { X, Building, User, Phone, Mail, MapPin, CreditCard, FileText } from 'lucide-react';

interface SupplierCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierCreated: (supplier: any) => void;
}

interface SupplierFormData {
  supplier_name: string;
  supplier_code: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  specialty: string;
  supplier_type: string;
  rating: number;
  status: string;
  payment_terms: string;
  credit_limit: string;
  tax_number: string;
  notes: string;
}

export function SupplierCreateModal({
  isOpen,
  onClose,
  onSupplierCreated,
}: SupplierCreateModalProps) {
  const [formData, setFormData] = useState<SupplierFormData>({
    supplier_name: '',
    supplier_code: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    specialty: '',
    supplier_type: 'material',
    rating: 0,
    status: 'active',
    payment_terms: '',
    credit_limit: '',
    tax_number: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.supplier_name.trim()) {
      newErrors.supplier_name = 'Supplier name is required';
    }

    if (!formData.supplier_code.trim()) {
      newErrors.supplier_code = 'Supplier code is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.credit_limit && isNaN(parseFloat(formData.credit_limit))) {
      newErrors.credit_limit = 'Credit limit must be a valid number';
    }

    if (formData.rating < 0 || formData.rating > 5) {
      newErrors.rating = 'Rating must be between 0 and 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSupplierCode = (name: string) => {
    const prefix = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${timestamp}`;
  };

  const handleSupplierNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      supplier_name: value,
      supplier_code: prev.supplier_code || generateSupplierCode(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const supplierData = {
        ...formData,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
        rating: parseFloat(formData.rating.toString()) || 0,
      };

      console.log('🏭 Creating supplier with data:', supplierData);

      const response = await fetch(`/api/mobile-control/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_supplier',
          supplierData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create supplier');
      }

      const result = await response.json();
      console.log('✅ Supplier created successfully:', result.data);
      
      onSupplierCreated(result.data);
      onClose();
      
      // Reset form
      setFormData({
        supplier_name: '',
        supplier_code: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        postal_code: '',
        specialty: '',
        supplier_type: 'material',
        rating: 0,
        status: 'active',
        payment_terms: '',
        credit_limit: '',
        tax_number: '',
        notes: '',
      });

    } catch (error) {
      console.error('❌ Error creating supplier:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create supplier' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="border-b bg-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg font-semibold text-gray-900">Create New Supplier</CardTitle>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-orange-600" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier_name">Supplier Name *</Label>
                    <Input
                      id="supplier_name"
                      value={formData.supplier_name}
                      onChange={(e) => handleSupplierNameChange(e.target.value)}
                      className={errors.supplier_name ? 'border-red-500' : ''}
                      placeholder="Enter supplier name"
                    />
                    {errors.supplier_name && <p className="text-sm text-red-500 mt-1">{errors.supplier_name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="supplier_code">Supplier Code *</Label>
                    <Input
                      id="supplier_code"
                      value={formData.supplier_code}
                      onChange={(e) => setFormData({...formData, supplier_code: e.target.value})}
                      className={errors.supplier_code ? 'border-red-500' : ''}
                      placeholder="Unique supplier code"
                    />
                    {errors.supplier_code && <p className="text-sm text-red-500 mt-1">{errors.supplier_code}</p>}
                  </div>

                  <div>
                    <Label htmlFor="specialty">Specialty</Label>
                    <Select value={formData.specialty} onValueChange={(value) => setFormData({...formData, specialty: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="construction_materials">Construction Materials</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="roofing">Roofing</SelectItem>
                        <SelectItem value="flooring">Flooring</SelectItem>
                        <SelectItem value="windows_doors">Windows & Doors</SelectItem>
                        <SelectItem value="insulation">Insulation</SelectItem>
                        <SelectItem value="concrete">Concrete</SelectItem>
                        <SelectItem value="steel">Steel</SelectItem>
                        <SelectItem value="timber">Timber</SelectItem>
                        <SelectItem value="tools_equipment">Tools & Equipment</SelectItem>
                        <SelectItem value="safety_equipment">Safety Equipment</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="supplier_type">Supplier Type</Label>
                    <Select value={formData.supplier_type} onValueChange={(value) => setFormData({...formData, supplier_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="material">Material Supplier</SelectItem>
                        <SelectItem value="service">Service Provider</SelectItem>
                        <SelectItem value="equipment">Equipment Rental</SelectItem>
                        <SelectItem value="subcontractor">Subcontractor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rating">Rating (0-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value) || 0})}
                      className={errors.rating ? 'border-red-500' : ''}
                      placeholder="0.0"
                    />
                    {errors.rating && <p className="text-sm text-red-500 mt-1">{errors.rating}</p>}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-orange-600" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                      placeholder="Primary contact name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={errors.email ? 'border-red-500' : ''}
                      placeholder="contact@supplier.com"
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Contact phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-orange-600" />
                  Address Information
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Street address"
                      rows={2}
                      className='bg-white text-gray-900'
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        placeholder="City"
                      />
                    </div>

                    <div>
                    <Label htmlFor="province">Province</Label>
                      <Input
                        id="province"
                        value={formData.province}
                        onChange={(e) => setFormData({...formData, province: e.target.value})}
                        placeholder="Province"
                      />
                      {/* <Label htmlFor="province">Province</Label>
                      <Select value={formData.province} onValueChange={(value) => setFormData({...formData, province: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eastern_cape">Eastern Cape</SelectItem>
                          <SelectItem value="free_state">Free State</SelectItem>
                          <SelectItem value="gauteng">Gauteng</SelectItem>
                          <SelectItem value="kwazulu_natal">KwaZulu-Natal</SelectItem>
                          <SelectItem value="limpopo">Limpopo</SelectItem>
                          <SelectItem value="mpumalanga">Mpumalanga</SelectItem>
                          <SelectItem value="northern_cape">Northern Cape</SelectItem>
                          <SelectItem value="north_west">North West</SelectItem>
                          <SelectItem value="western_cape">Western Cape</SelectItem>
                        </SelectContent>
                      </Select> */}
                    </div>

                    <div>
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                        placeholder="Postal code"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
                  Financial Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Select value={formData.payment_terms} onValueChange={(value) => setFormData({...formData, payment_terms: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
                        <SelectItem value="net_7">Net 7 days</SelectItem>
                        <SelectItem value="net_15">Net 15 days</SelectItem>
                        <SelectItem value="net_30">Net 30 days</SelectItem>
                        <SelectItem value="net_60">Net 60 days</SelectItem>
                        <SelectItem value="net_90">Net 90 days</SelectItem>
                        <SelectItem value="advance_payment">Advance Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="credit_limit">Credit Limit (R)</Label>
                    <Input
                      id="credit_limit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({...formData, credit_limit: e.target.value})}
                      className={errors.credit_limit ? 'border-red-500' : ''}
                      placeholder="0.00"
                    />
                    {errors.credit_limit && <p className="text-sm text-red-500 mt-1">{errors.credit_limit}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="tax_number">Tax Number</Label>
                    <Input
                      id="tax_number"
                      value={formData.tax_number}
                      onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                      placeholder="VAT or tax registration number"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600" />
                  Additional Information
                </h3>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes about the supplier"
                    rows={3}
                    className='bg-white text-gray-900'
                  />
                </div>
              </div>

              {/* Error Display */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Supplier'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 