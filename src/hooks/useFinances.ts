'use client';

import { useState, useEffect } from 'react';

// Financial data interfaces
interface FinancialOverview {
  // Legacy properties
  totalPayments: number;
  totalBudget: number;
  totalActual: number;
  totalCreditLimit: number;
  totalCreditUsed: number;
  budgetVariance: number;
  creditUtilization: number;
  financialHealthScore: number;
  financialHealthStatus: 'excellent' | 'good' | 'fair' | 'poor';
  paymentStatusCounts: Record<string, number>;
  pendingApprovalsCount: number;
  overduePaymentsCount: number;
  recentPaymentsCount: number;
  
  // New comprehensive financial metrics
  totalExpected: number;
  totalReceived: number;
  totalOutstanding: number;
  totalExpenditure: number;
  totalAvailable: number;
  monthlyPayments: number; // Dynamic current month payments
  cashFlowHealth: string;
  collectionProgress: string;
  expenditureRate: string;
  totalVariance: number;
  variancePercentage: string;
  paymentStats: any;
  monthlyTrends: any[];
}

interface Payment {
  id: string;
  project_id: string;
  milestone_id?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string;
  description: string;
  receipt_url?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_category: 'milestone' | 'materials' | 'labor' | 'permits' | 'other';
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    project_name: string;
    client_id: string;
    contract_value: number;
    status: string;
  };
  milestone?: {
    id: string;
    milestone_name: string;
    phase_category: string;
  };
}

interface Budget {
  id: string;
  project_id?: string;
  milestone_id?: string;
  category_id?: string;
  budget_name: string;
  budgeted_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percentage: number;
  budget_period: 'monthly' | 'quarterly' | 'milestone' | 'project';
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'exceeded' | 'cancelled';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    project_name: string;
    client_id: string;
    contract_value: number;
  };
  milestone?: {
    id: string;
    milestone_name: string;
    phase_category: string;
  };
  category?: {
    id: string;
    category_name: string;
    category_code: string;
    color_hex: string;
    icon_name?: string;
  };
}

interface CreditAccount {
  id: string;
  project_id?: string;
  client_id?: string;
  credit_limit: number;
  used_credit: number;
  available_credit: number;
  interest_rate: number;
  credit_terms: string;
  credit_status: 'active' | 'suspended' | 'closed' | 'pending';
  monthly_payment: number;
  next_payment_date?: string;
  last_payment_date?: string;
  credit_score?: number;
  approval_date: string;
  expiry_date: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  milestone_id?: string;
  payment_amount: number;
  payment_sequence: number;
  total_payments: number;
  total_amount: number;
  project?: {
    id: string;
    project_name: string;
    client_id: string;
    contract_value: number;
  };
  client?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
}

interface PaymentCategory {
  id: string;
  category_name: string;
  category_code: string;
  description?: string;
  icon_name?: string;
  color_hex: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface Receipt {
  id: string;
  payment_id?: string;
  file_name: string;
  file_path: string;
  file_size_bytes?: number;
  file_type?: string;
  upload_date: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  ocr_data: any;
  thumbnail_url?: string;
  page_count: number;
  extracted_amount?: number;
  extracted_date?: string;
  extracted_vendor?: string;
  confidence_score?: number;
  manual_verification: boolean;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
  payment?: {
    id: string;
    amount: number;
    payment_date: string;
    description: string;
    project?: {
      id: string;
      project_name: string;
    };
  };
}

interface FinancialData {
  timestamp: string;
  type: string;
  overview: FinancialOverview;
  payments: Payment[];
  budgets: Budget[];
  creditAccounts: CreditAccount[];
  paymentCategories: PaymentCategory[];
  receipts: Receipt[];
  recentPayments: Payment[];
  pendingApprovals: Payment[];
  overduePayments: Payment[];
  projectFinancials: any[]; // Add missing property
  analytics: any; // Add missing property
  counts: {
    totalPayments: number;
    totalBudgets: number;
    totalCreditAccounts: number;
    totalCategories: number;
    totalReceipts: number;
  };
}

interface FinancialError {
  error: string;
  details?: any;
}

interface UseFinancesReturn {
  financialData: FinancialData | null;
  isLoading: boolean;
  error: FinancialError | null;
  refetch: () => Promise<void>;
  createPayment: (paymentData: any) => Promise<any>;
  approvePayment: (paymentId: string) => Promise<any>;
  createBudget: (budgetData: any) => Promise<any>;
  updateCreditAccount: (accountData: any) => Promise<any>;
}

export const useFinances = (options?: { 
  projectId?: string; 
  userId?: string; 
  type?: string;
  autoRefetch?: boolean;
  refetchInterval?: number;
}): UseFinancesReturn => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FinancialError | null>(null);

  const fetchFinancialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options?.projectId) params.append('projectId', options.projectId);
      if (options?.userId) params.append('userId', options.userId);
      if (options?.type) params.append('type', options.type);

      const response = await fetch(`/api/finances?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      if (apiResponse.error) {
        throw new Error(apiResponse.error);
      }

      // 🔧 FIX: Extract data from the new API response structure
      const data = apiResponse.data || apiResponse;

      setFinancialData(data);
      console.log('✅ Financial data loaded successfully:', {
        paymentsCount: data.payments?.length || 0,
        budgetsCount: data.budgets?.length || 0,
        creditAccountsCount: data.creditAccounts?.length || 0,
        totalValue: data.overview?.totalPayments || 0
      });

    } catch (err) {
      console.error('❌ Error fetching financial data:', err);
      setError({
        error: err instanceof Error ? err.message : 'Failed to fetch financial data',
        details: err
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createPayment = async (paymentData: any) => {
    try {
      const response = await fetch('/api/finances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_payment',
          data: paymentData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh data after creating payment
      await fetchFinancialData();
      
      return result;
    } catch (err) {
      console.error('❌ Error creating payment:', err);
      throw err;
    }
  };

  const approvePayment = async (paymentId: string) => {
    try {
      const response = await fetch('/api/finances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve_payment',
          data: { paymentId }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh data after approval
      await fetchFinancialData();
      
      return result;
    } catch (err) {
      console.error('❌ Error approving payment:', err);
      throw err;
    }
  };

  const createBudget = async (budgetData: any) => {
    try {
      const response = await fetch('/api/finances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_budget',
          data: budgetData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh data after creating budget
      await fetchFinancialData();
      
      return result;
    } catch (err) {
      console.error('❌ Error creating budget:', err);
      throw err;
    }
  };

  const updateCreditAccount = async (accountData: any) => {
    try {
      const response = await fetch('/api/finances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_credit_account',
          data: accountData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh data after updating account
      await fetchFinancialData();
      
      return result;
    } catch (err) {
      console.error('❌ Error updating credit account:', err);
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchFinancialData();
  }, []); // Empty dependency array to prevent infinite loops - options changes trigger separate useEffect

  // Auto-refetch if enabled - separate useEffect for options changes
  useEffect(() => {
    if (options?.autoRefetch && options?.refetchInterval) {
      const interval = setInterval(fetchFinancialData, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [options?.autoRefetch, options?.refetchInterval]);

  // Refetch when key options change
  useEffect(() => {
    fetchFinancialData();
  }, [options?.projectId, options?.userId, options?.type]);

  return {
    financialData,
    isLoading,
    error,
    refetch: fetchFinancialData,
    createPayment,
    approvePayment,
    createBudget,
    updateCreditAccount
  };
}; 