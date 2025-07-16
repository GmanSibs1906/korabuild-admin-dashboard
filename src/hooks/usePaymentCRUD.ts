import { useState, useCallback, useEffect } from 'react';
import { 
  Payment,
  PaymentCreateData,
  PaymentUpdateData,
  PaymentFilters,
  PaymentPagination,
  PaymentSummary,
  PaymentResponse,
  PaymentCRUDResponse,
  PaymentDeleteResponse,
  UsePaymentCRUDOptions,
  UsePaymentCRUDReturn,
  DEFAULT_PAYMENT_FILTERS
} from '@/types/payments';

export function usePaymentCRUD(options: UsePaymentCRUDOptions = {}): UsePaymentCRUDReturn {
  const {
    autoRefresh = false,
    refetchInterval = 30000, // 30 seconds
    onSuccess,
    onError
  } = options;

  // State management
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<PaymentPagination | null>(null);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [filters, setFiltersState] = useState<PaymentFilters>(DEFAULT_PAYMENT_FILTERS);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Build query parameters from filters
  const buildQueryParams = useCallback((queryFilters: PaymentFilters) => {
    const params = new URLSearchParams();
    
    Object.entries(queryFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    return params.toString();
  }, []);

  // Fetch payments
  const fetchPayments = useCallback(async (newFilters?: Partial<PaymentFilters>) => {
    try {
      setLoading(true);
      setError(null);
      
      const finalFilters = newFilters ? { ...filters, ...newFilters } : filters;
      const queryParams = buildQueryParams(finalFilters);
      
      console.log('🔄 Fetching payments with filters:', finalFilters);
      
      const response = await fetch(`/api/finances/payments?${queryParams}`);
      const result: PaymentResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      
      if (result.success && result.data) {
        setPayments(result.data.payments);
        setPagination(result.data.pagination);
        setSummary(result.data.summary);
        setFiltersState(finalFilters);
        
        console.log(`✅ Fetched ${result.data.payments.length} payments`);
      } else {
        throw new Error(result.error || 'Failed to fetch payments');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error fetching payments:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, buildQueryParams, onError]);

  // Create payment
  const createPayment = useCallback(async (data: PaymentCreateData): Promise<Payment | null> => {
    try {
      setCreating(true);
      setError(null);
      
      console.log('📝 Creating payment:', data);
      
      const response = await fetch('/api/finances/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result: PaymentCRUDResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      
      if (result.success && result.data) {
        const newPayment = result.data.payment;
        
        // Add to current payments list if it matches current filters
        setPayments(prev => [newPayment, ...prev]);
        
        // Update summary
        if (summary) {
          setSummary(prev => prev ? {
            ...prev,
            total_amount: prev.total_amount + newPayment.amount,
            payment_count: prev.payment_count + 1,
            status_counts: {
              ...prev.status_counts,
              [newPayment.status]: (prev.status_counts[newPayment.status] || 0) + 1
            },
            category_counts: {
              ...prev.category_counts,
              [newPayment.payment_category]: (prev.category_counts[newPayment.payment_category] || 0) + 1
            }
          } : null);
        }
        
        console.log('✅ Payment created successfully:', newPayment.id);
        onSuccess?.(result.data.message);
        
        return newPayment;
      } else {
        throw new Error(result.error || 'Failed to create payment');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error creating payment:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setCreating(false);
    }
  }, [summary, onSuccess, onError]);

  // Update payment
  const updatePayment = useCallback(async (id: string, data: PaymentUpdateData): Promise<Payment | null> => {
    try {
      setUpdating(true);
      setError(null);
      
      console.log('✏️ Updating payment:', id, data);
      
      const response = await fetch(`/api/finances/payments?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result: PaymentCRUDResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      
      if (result.success && result.data) {
        const updatedPayment = result.data.payment;
        
        // Update in current payments list
        setPayments(prev => 
          prev.map(payment => 
            payment.id === id ? updatedPayment : payment
          )
        );
        
        console.log('✅ Payment updated successfully:', updatedPayment.id);
        onSuccess?.(result.data.message);
        
        return updatedPayment;
      } else {
        throw new Error(result.error || 'Failed to update payment');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error updating payment:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setUpdating(false);
    }
  }, [onSuccess, onError]);

  // Delete payment
  const deletePayment = useCallback(async (id: string): Promise<boolean> => {
    try {
      setDeleting(true);
      setError(null);
      
      console.log('🗑️ Deleting payment:', id);
      
      const response = await fetch(`/api/finances/payments?id=${id}`, {
        method: 'DELETE',
      });
      
      const result: PaymentDeleteResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      
      if (result.success) {
        // Remove from current payments list
        setPayments(prev => prev.filter(payment => payment.id !== id));
        
        // Update summary
        if (summary && result.data?.deleted_payment) {
          const deletedPayment = result.data.deleted_payment;
          setSummary(prev => prev ? {
            ...prev,
            total_amount: prev.total_amount - (deletedPayment.amount || 0),
            payment_count: Math.max(0, prev.payment_count - 1),
            status_counts: {
              ...prev.status_counts,
              [deletedPayment.status || 'pending']: Math.max(0, (prev.status_counts[deletedPayment.status || 'pending'] || 0) - 1)
            },
            category_counts: {
              ...prev.category_counts,
              [deletedPayment.payment_category || 'other']: Math.max(0, (prev.category_counts[deletedPayment.payment_category || 'other'] || 0) - 1)
            }
          } : null);
        }
        
        console.log('✅ Payment deleted successfully:', id);
        onSuccess?.(result.data?.message || 'Payment deleted successfully');
        
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete payment');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error deleting payment:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setDeleting(false);
    }
  }, [summary, onSuccess, onError]);

  // Set filters
  const setFilters = useCallback((newFilters: Partial<PaymentFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFiltersState(updatedFilters);
    fetchPayments(updatedFilters);
  }, [filters, fetchPayments]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_PAYMENT_FILTERS);
    fetchPayments(DEFAULT_PAYMENT_FILTERS);
  }, [fetchPayments]);

  // Refresh payments
  const refreshPayments = useCallback(async () => {
    await fetchPayments();
  }, [fetchPayments]);

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh && refetchInterval > 0) {
      const interval = setInterval(() => {
        if (!loading && !creating && !updating && !deleting) {
          fetchPayments();
        }
      }, refetchInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetchInterval, loading, creating, updating, deleting, fetchPayments]);

  // Initial load effect
  useEffect(() => {
    fetchPayments();
  }, []); // Only run on mount

  return {
    // Data
    payments,
    pagination,
    summary,
    filters,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error state
    error,
    
    // Actions
    fetchPayments,
    createPayment,
    updatePayment,
    deletePayment,
    setFilters,
    resetFilters,
    refreshPayments,
  };
} 