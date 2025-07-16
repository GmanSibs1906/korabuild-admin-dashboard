// Payment-related TypeScript interfaces for CRUD operations

export interface Payment {
  id: string;
  project_id: string;
  milestone_id?: string | null;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string;
  description: string;
  receipt_url?: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_category: 'milestone' | 'materials' | 'labor' | 'permits' | 'other';
  created_at: string;
  updated_at: string;
  
  // Related data from joins
  projects?: {
    id: string;
    project_name: string;
    client_id: string;
    users?: {
      id: string;
      full_name: string;
      email: string;
    };
  };
  
  project_milestones?: {
    id: string;
    milestone_name: string;
    phase_category: string;
  } | null;
}

export interface PaymentCreateData {
  project_id: string;
  milestone_id?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string;
  description: string;
  receipt_url?: string;
  payment_category?: 'milestone' | 'materials' | 'labor' | 'permits' | 'other';
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface PaymentUpdateData {
  project_id?: string;
  milestone_id?: string;
  amount?: number;
  payment_date?: string;
  payment_method?: string;
  reference?: string;
  description?: string;
  receipt_url?: string;
  payment_category?: 'milestone' | 'materials' | 'labor' | 'permits' | 'other';
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface PaymentFilters {
  project_id?: string;
  milestone_id?: string;
  status?: string;
  payment_category?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaymentPagination {
  current_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface PaymentSummary {
  total_amount: number;
  payment_count: number;
  status_counts: Record<string, number>;
  category_counts: Record<string, number>;
}

export interface PaymentResponse {
  success: boolean;
  data?: {
    payments: Payment[];
    pagination: PaymentPagination;
    summary: PaymentSummary;
    filters: PaymentFilters;
  };
  error?: string;
  details?: string;
}

export interface PaymentCRUDResponse {
  success: boolean;
  data?: {
    payment: Payment;
    message: string;
  };
  error?: string;
  details?: string;
}

export interface PaymentDeleteResponse {
  success: boolean;
  data?: {
    payment_id: string;
    deleted_payment: Partial<Payment>;
    message: string;
  };
  error?: string;
  details?: string;
}

// Form-related interfaces
export interface PaymentFormData {
  project_id: string;
  milestone_id?: string;
  amount: string; // String for form input, converted to number
  payment_date: string;
  payment_method: string;
  reference: string;
  description: string;
  receipt_url?: string;
  payment_category: 'milestone' | 'materials' | 'labor' | 'permits' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface PaymentFormErrors {
  project_id?: string;
  milestone_id?: string;
  amount?: string;
  payment_date?: string;
  payment_method?: string;
  reference?: string;
  description?: string;
  receipt_url?: string;
  payment_category?: string;
  status?: string;
  general?: string;
}

// Table and UI-related interfaces
export interface PaymentTableColumn {
  key: keyof Payment | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (payment: Payment) => React.ReactNode;
}

export interface PaymentTableProps {
  payments: Payment[];
  loading?: boolean;
  pagination: PaymentPagination;
  filters: PaymentFilters;
  onFiltersChange: (filters: Partial<PaymentFilters>) => void;
  onPaymentEdit: (payment: Payment) => void;
  onPaymentDelete: (payment: Payment) => void;
  onPaymentView: (payment: Payment) => void;
}

// Modal interfaces
export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface PaymentCreateModalProps extends PaymentModalProps {
  defaultProjectId?: string;
  defaultMilestoneId?: string;
}

export interface PaymentEditModalProps extends PaymentModalProps {
  payment: Payment;
}

export interface PaymentDeleteModalProps extends PaymentModalProps {
  payment: Payment;
}

export interface PaymentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
}

// Hook interfaces
export interface UsePaymentCRUDOptions {
  autoRefresh?: boolean;
  refetchInterval?: number;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export interface UsePaymentCRUDReturn {
  // Data
  payments: Payment[];
  pagination: PaymentPagination | null;
  summary: PaymentSummary | null;
  filters: PaymentFilters;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchPayments: (newFilters?: Partial<PaymentFilters>) => Promise<void>;
  createPayment: (data: PaymentCreateData) => Promise<Payment | null>;
  updatePayment: (id: string, data: PaymentUpdateData) => Promise<Payment | null>;
  deletePayment: (id: string) => Promise<boolean>;
  setFilters: (newFilters: Partial<PaymentFilters>) => void;
  resetFilters: () => void;
  refreshPayments: () => Promise<void>;
}

// Utility types
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentCategory = 'milestone' | 'materials' | 'labor' | 'permits' | 'other';
export type PaymentSortField = 'payment_date' | 'amount' | 'status' | 'payment_category' | 'created_at';
export type SortOrder = 'asc' | 'desc';

// Constants
export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800' },
  { value: 'refunded', label: 'Refunded', color: 'bg-gray-100 text-gray-800' }
];

export const PAYMENT_CATEGORIES: { value: PaymentCategory; label: string; icon: string }[] = [
  { value: 'milestone', label: 'Milestone Payment', icon: 'Target' },
  { value: 'materials', label: 'Materials', icon: 'Package' },
  { value: 'labor', label: 'Labor', icon: 'Users' },
  { value: 'permits', label: 'Permits & Licenses', icon: 'FileText' },
  { value: 'other', label: 'Other', icon: 'MoreHorizontal' }
];

export const PAYMENT_METHODS = [
  'EFT',
  'Cash',
  'Check',
  'Credit Card',
  'Debit Card',
  'Wire Transfer',
  'Bank Transfer',
  'Other'
];

export const DEFAULT_PAYMENT_FILTERS: PaymentFilters = {
  page: 1,
  limit: 50,
  sort_by: 'payment_date',
  sort_order: 'desc'
}; 