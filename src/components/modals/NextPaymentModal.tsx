'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, Calendar, DollarSign, Trash2, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { NextPaymentData, ProjectMilestone } from '@/types/next-payment';

interface NextPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingPayment?: NextPaymentData | null;
  onPaymentUpdated: () => void;
}

export function NextPaymentModal({ 
  isOpen, 
  onClose, 
  projectId, 
  existingPayment, 
  onPaymentUpdated 
}: NextPaymentModalProps) {
  const [formData, setFormData] = useState<NextPaymentData>({
    milestone_id: '',
    payment_amount: 0,
    payment_sequence: 1,
    total_payments: 1,
    total_amount: 0,
    next_payment_date: '',
    last_payment_date: '',
    credit_terms: '30 days net',
    credit_status: 'active',
    notes: '',
  });
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch project milestones
  useEffect(() => {
    const fetchMilestones = async () => {
      if (!projectId || !isOpen) return;
      
      setLoadingMilestones(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/milestones`);
        const result = await response.json();
        
        if (result.success) {
          setMilestones(result.data || []);
        } else {
          console.error('❌ Failed to fetch milestones:', result.error);
        }
      } catch (error) {
        console.error('❌ Error fetching milestones:', error);
      } finally {
        setLoadingMilestones(false);
      }
    };

    fetchMilestones();
  }, [projectId, isOpen]);

  // Initialize form data when modal opens or existing payment changes
  useEffect(() => {
    if (isOpen) {
      if (existingPayment) {
        setFormData({
          id: existingPayment.id,
          milestone_id: existingPayment.milestone_id || '',
          payment_amount: existingPayment.payment_amount || 0,
          payment_sequence: existingPayment.payment_sequence || 1,
          total_payments: existingPayment.total_payments || 1,
          total_amount: existingPayment.total_amount || 0,
          next_payment_date: existingPayment.next_payment_date,
          last_payment_date: existingPayment.last_payment_date || '',
          credit_terms: existingPayment.credit_terms,
          credit_status: existingPayment.credit_status,
          notes: existingPayment.notes || '',
        });
      } else {
        // Reset form for new payment
        setFormData({
          milestone_id: '',
          payment_amount: 0,
          payment_sequence: 1,
          total_payments: 1,
          total_amount: 0,
          next_payment_date: '',
          last_payment_date: '',
          credit_terms: '30 days net',
          credit_status: 'active',
          notes: '',
        });
      }
      setError(null);
    }
  }, [isOpen, existingPayment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.milestone_id) {
      setError('Please select a milestone');
      return;
    }
    
    if (formData.payment_amount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }
    
    if ((formData.total_payments || 0) <= 0) {
      setError('Total payments must be greater than 0');
      return;
    }
    
    if ((formData.payment_sequence || 0) > (formData.total_payments || 0)) {
      setError('Payment sequence cannot be greater than total payments');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const action = existingPayment ? 'update' : 'create';
      console.log('💰 Submitting next payment:', { action, formData });

      const response = await fetch('/api/finances/next-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          projectId,
          paymentData: formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onPaymentUpdated();
        onClose();
      } else {
        setError(result.error || 'Failed to save next payment');
      }
    } catch (error) {
      console.error('❌ Error submitting next payment:', error);
      setError('Failed to save next payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingPayment?.id) return;
    
    if (!confirm('Are you sure you want to delete this payment schedule? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('💰 Deleting next payment:', existingPayment.id);

      const response = await fetch('/api/finances/next-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          paymentData: { id: existingPayment.id },
        }),
      });

      const result = await response.json();

      if (result.success) {
        onPaymentUpdated();
        onClose();
      } else {
        setError(result.error || 'Failed to delete next payment');
      }
    } catch (error) {
      console.error('❌ Error deleting next payment:', error);
      setError('Failed to delete next payment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof NextPaymentData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSelectedMilestone = () => {
    return milestones.find(m => m.id === formData.milestone_id);
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'delayed': return 'text-red-600';
      case 'on_hold': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Target className="h-4 w-4 text-blue-500" />;
      case 'delayed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'on_hold': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {existingPayment ? 'Edit Next Payment' : 'Add Next Payment'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {existingPayment ? 'Update payment schedule' : 'Set up milestone-based payment schedule'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Milestone Selection */}
          <div>
            <Label htmlFor="milestone_id" className="text-sm font-medium text-gray-700">
              Select Milestone *
            </Label>
            <Select 
              value={formData.milestone_id} 
              onValueChange={(value) => handleChange('milestone_id', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={loadingMilestones ? "Loading milestones..." : "Select a project milestone"} />
              </SelectTrigger>
              <SelectContent>
                {milestones.map((milestone) => (
                  <SelectItem key={milestone.id} value={milestone.id}>
                    <div className="flex items-center space-x-2">
                      {getMilestoneStatusIcon(milestone.status)}
                      <div>
                        <div className="font-medium">{milestone.milestone_name}</div>
                        <div className="text-xs text-gray-500">
                          {milestone.phase_category} • {milestone.status} • {milestone.progress_percentage}%
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.milestone_id && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2 text-sm">
                  {getMilestoneStatusIcon(getSelectedMilestone()?.status || '')}
                  <span className="font-medium">{getSelectedMilestone()?.milestone_name}</span>
                  <span className={`text-xs ${getMilestoneStatusColor(getSelectedMilestone()?.status || '')}`}>
                    {getSelectedMilestone()?.status}
                  </span>
                </div>
                {getSelectedMilestone()?.description && (
                  <p className="text-xs text-gray-600 mt-1">{getSelectedMilestone()?.description}</p>
                )}
              </div>
            )}
          </div>

          {/* Payment Sequence & Total */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_sequence" className="text-sm font-medium text-gray-700">
                Payment Sequence *
              </Label>
              <Input
                id="payment_sequence"
                type="number"
                min="1"
                required
                value={formData.payment_sequence}
                onChange={(e) => handleChange('payment_sequence', parseInt(e.target.value) || 1)}
                className="mt-1"
                placeholder="1"
              />
            </div>
            <div>
              <Label htmlFor="total_payments" className="text-sm font-medium text-gray-700">
                Total Payments *
              </Label>
              <Input
                id="total_payments"
                type="number"
                min="1"
                required
                value={formData.total_payments}
                onChange={(e) => handleChange('total_payments', parseInt(e.target.value) || 1)}
                className="mt-1"
                placeholder="1"
              />
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <Label htmlFor="payment_amount" className="text-sm font-medium text-gray-700">
              Payment Amount *
            </Label>
            <div className="mt-1 relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="payment_amount"
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.payment_amount}
                onChange={(e) => handleChange('payment_amount', parseFloat(e.target.value) || 0)}
                className="pl-10"
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Preview: {formatCurrency(formData.payment_amount)}
              </p>
              {(formData.total_payments || 0) > 1 && (
                <p className="text-xs text-gray-500">
                  Payment {formData.payment_sequence || 1} of {formData.total_payments || 1}
                </p>
              )}
            </div>
          </div>

          {/* Total Amount */}
          <div>
            <Label htmlFor="total_amount" className="text-sm font-medium text-gray-700">
              Total Amount (All Payments) *
            </Label>
            <div className="mt-1 relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="total_amount"
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.total_amount}
                onChange={(e) => handleChange('total_amount', parseFloat(e.target.value) || 0)}
                className="pl-10"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total: {formatCurrency(formData.total_amount || 0)}
            </p>
          </div>

          {/* Next Payment Date */}
          <div>
            <Label htmlFor="next_payment_date" className="text-sm font-medium text-gray-700">
              Next Payment Date *
            </Label>
            <div className="mt-1 relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="next_payment_date"
                type="date"
                required
                value={formData.next_payment_date}
                onChange={(e) => handleChange('next_payment_date', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Last Payment Date */}
          <div>
            <Label htmlFor="last_payment_date" className="text-sm font-medium text-gray-700">
              Last Payment Date
            </Label>
            <div className="mt-1 relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="last_payment_date"
                type="date"
                value={formData.last_payment_date}
                onChange={(e) => handleChange('last_payment_date', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Credit Terms */}
          <div>
            <Label htmlFor="credit_terms" className="text-sm font-medium text-gray-700">
              Payment Terms
            </Label>
            <Select 
              value={formData.credit_terms} 
              onValueChange={(value) => handleChange('credit_terms', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7 days net">7 days net</SelectItem>
                <SelectItem value="14 days net">14 days net</SelectItem>
                <SelectItem value="30 days net">30 days net</SelectItem>
                <SelectItem value="45 days net">45 days net</SelectItem>
                <SelectItem value="60 days net">60 days net</SelectItem>
                <SelectItem value="90 days net">90 days net</SelectItem>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="custom">Custom terms</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status */}
          <div>
            <Label htmlFor="credit_status" className="text-sm font-medium text-gray-700">
              Payment Status
            </Label>
            <Select 
              value={formData.credit_status} 
              onValueChange={(value) => handleChange('credit_status', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="mt-1"
              rows={3}
              placeholder="Additional payment notes or instructions..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {existingPayment && (
                <Button
                  type="button"
                  onClick={handleDelete}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={loading}
              >
                {loading ? 'Saving...' : existingPayment ? 'Update Payment' : 'Add Payment'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 