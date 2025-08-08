// Admin Request System TypeScript Interfaces
// Based on existing database schema and mobile app implementation

export interface AdminRequest {
  id: string;
  project_id?: string;
  client_id?: string;
  request_type: string; // Dynamic from database: 'service_plan' | 'service_boq' | 'service_consultation' | 'material_foundation' etc.
  category: string; // 'service' | 'material' from mobile app categorization
  title: string;
  description: string;
  address?: string;
  plan_urls?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  submitted_date: string;
  response_date?: string;
  admin_response?: string;
  estimated_cost?: number;
  created_at: string;
  updated_at: string;
  
  // Additional fields from database
  subcategory?: string;
  project_address?: string;
  brief_description?: string;
  request_data?: any;
  contact_preference?: string;
  preferred_response_time?: string;
  admin_notes?: string;
  assigned_to_user_id?: string;
  resolved_at?: string;
  client_satisfaction_rating?: number;
  request_category?: string;
  
  // Populated relations for admin dashboard
  client?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  project?: {
    id: string;
    project_name: string;
    project_address: string;
    status: string;
  };
  assigned_admin?: {
    id: string;
    full_name: string;
    admin_role: string;
  };
}

// Enhanced request for mobile app categorization
export interface EnhancedRequest extends AdminRequest {
  // Mobile app categorization system
  mobile_category: 'service' | 'material';
  subcategory: string; // plan, boq, foundation, etc.
  brief_description: string;
  has_documents: boolean;
  document_urls?: string[];
  assigned_to?: string;
  admin_notes?: string;
  estimated_completion?: string;
  
  // Navigation helpers
  request_config?: RequestCategoryConfig;
}

export interface RequestCategoryConfig {
  icon: string;
  title: string;
  color: string;
  subcategories: Record<string, {
    title: string;
    icon: string;
  }>;
}

export interface RequestComment {
  id: string;
  request_id: string;
  admin_id: string;
  comment_text: string;
  is_internal: boolean;
  created_at: string;
  admin?: {
    id: string;
    full_name: string;
    admin_role: string;
  };
}

export interface RequestStatusHistory {
  id: string;
  request_id: string;
  previous_status: string;
  new_status: string;
  changed_by: string;
  change_reason?: string;
  created_at: string;
  admin?: {
    id: string;
    full_name: string;
    admin_role: string;
  };
}

export interface RequestFilters {
  status?: string;
  category?: string;
  priority?: string;
  project_id?: string;
  client_id?: string;
  assigned_to?: string;
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface RequestStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  byCategory: Record<string, number>; // Dynamic categories from database
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

export interface RequestNotification {
  id: string;
  type: 'new_request' | 'status_update' | 'urgent_request' | 'overdue_request';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  request_id: string;
  created_at: string;
  is_read: boolean;
  
  // Related data
  request?: AdminRequest;
  client?: {
    id: string;
    full_name: string;
  };
  project?: {
    id: string;
    project_name: string;
  };
}

// Request configuration for UI rendering
export const requestConfig: Record<string, RequestCategoryConfig> = {
  service: {
    icon: '🏗️',
    title: 'Service Requests',
    color: '#fe6700',
    subcategories: {
      plan: { title: 'Architectural Plans', icon: '📐' },
      boq: { title: 'Bill of Quantities', icon: '📊' },
      project_management: { title: 'Project Management', icon: '🎯' },
      consultation: { title: 'Consultation', icon: '💬' },
      inspection: { title: 'Inspection', icon: '🔍' },
      site_visit: { title: 'Site Visit', icon: '📍' }
    }
  },
  material: {
    icon: '🧱',
    title: 'Material Requests',
    color: '#28a745',
    subcategories: {
      foundation: { title: 'Foundation Materials', icon: '🏗️' },
      super_structure: { title: 'Super-Structure', icon: '🏢' },
      roofing: { title: 'Roofing Materials', icon: '🏠' },
      finishes: { title: 'Finishing Materials', icon: '✨' }
    }
  }
};

// Utility functions
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'submitted': return 'bg-blue-100 text-blue-800';
    case 'reviewing': return 'bg-yellow-100 text-yellow-800';
    case 'in_progress': return 'bg-purple-100 text-purple-800';
    case 'approved': return 'bg-green-100 text-green-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  return date.toLocaleDateString();
}; 