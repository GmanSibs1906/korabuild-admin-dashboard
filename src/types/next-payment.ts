// 💰 Next Payment Due Types for KoraBuild Admin Dashboard
// Enhanced Credit Account types for payment scheduling and management

export interface NextPaymentData {
  id?: string;
  project_id?: string;
  milestone_id?: string;
  milestone_name?: string;
  milestone_description?: string;
  payment_amount?: number; // Made optional for backward compatibility
  monthly_payment?: number; // Legacy field for backward compatibility
  payment_sequence?: number;
  total_payments?: number;
  total_amount?: number;
  next_payment_date: string;
  last_payment_date?: string;
  credit_terms: string;
  credit_status: string;
  notes?: string;
  is_overdue?: boolean;
  days_overdue?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectMilestone {
  id: string;
  milestone_name: string;
  description?: string;
  phase_category: string;
  planned_start?: string;
  planned_end?: string;
  status: string;
  progress_percentage: number;
  estimated_cost?: number;
  actual_cost?: number;
  order_index: number;
}

export interface NextPaymentFormData {
  milestone_id: string;
  payment_amount: number;
  payment_sequence: number;
  total_payments: number;
  total_amount: number;
  next_payment_date: string;
  last_payment_date?: string;
  credit_terms: string;
  credit_status: string;
  notes?: string;
}

export interface NextPaymentApiResponse {
  success: boolean;
  data?: NextPaymentData | null;
  error?: string;
  message?: string;
}

export interface NextPaymentApiRequest {
  action: 'create' | 'update' | 'delete';
  projectId?: string;
  paymentData: Partial<NextPaymentData>;
}

export type PaymentUrgency = 'overdue' | 'due_soon' | 'due_this_week' | 'upcoming' | 'no_date';

export interface PaymentAlert {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  urgency: PaymentUrgency;
  daysUntil?: number;
}

// Credit terms options
export const CREDIT_TERMS_OPTIONS = [
  { value: '7 days net', label: '7 days net' },
  { value: '14 days net', label: '14 days net' },
  { value: '30 days net', label: '30 days net' },
  { value: '45 days net', label: '45 days net' },
  { value: '60 days net', label: '60 days net' },
  { value: '90 days net', label: '90 days net' },
  { value: 'immediate', label: 'Immediate' },
  { value: 'custom', label: 'Custom terms' },
] as const;

export type CreditTermsOption = typeof CREDIT_TERMS_OPTIONS[number]['value'];

// Credit status options
export const CREDIT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'suspended', label: 'Suspended', color: 'red' },
  { value: 'closed', label: 'Closed', color: 'gray' },
] as const;

export type CreditStatusOption = typeof CREDIT_STATUS_OPTIONS[number]['value'];

// Helper type for payment calculations
export interface PaymentCalculation {
  daysUntil: number | null;
  urgency: PaymentUrgency;
  isOverdue: boolean;
  urgencyColor: string;
  urgencyText: string;
}

// Basic financial overview interface  
export interface BasicFinancialOverview {
  projectId?: string;
  financialHealthScore: number;
  financialHealthStatus: string;
  totalPayments: number;
  budgetVariance: number;
  creditUtilization: number;
  totalCreditUsed: number;
  totalCreditLimit: number;
}

// Extended type for financial overview with next payment
export interface FinancialOverviewWithPayment {
  overview: BasicFinancialOverview;
  nextPayment?: NextPaymentData | null;
  paymentCalculation?: PaymentCalculation;
} 