// Mission-Critical Admin Notification System
export interface AdminNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  action_required: boolean;
  action_type?: NotificationActionType;
  
  // Context data
  entity_type: 'project' | 'user' | 'contractor' | 'payment' | 'document' | 'request' | 'system';
  entity_id?: string;
  project_id?: string;
  user_id?: string;
  
  // Status tracking
  is_read: boolean;
  is_dismissed: boolean;
  is_acknowledged: boolean;
  
  // Admin interaction
  assigned_to_admin?: string;
  read_at?: string;
  read_by_admin?: string;
  acknowledged_at?: string;
  dismissed_at?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  expires_at?: string;
  
  // Additional context
  metadata?: Record<string, any>;
}

export type NotificationType = 
  // Critical System Alerts
  | 'system_critical'
  | 'system_warning'
  | 'system_maintenance'
  
  // Financial Alerts
  | 'payment_overdue'
  | 'payment_failed'
  | 'budget_exceeded'
  | 'cash_flow_negative'
  | 'payment_approval_required'
  
  // Project Alerts
  | 'project_delayed'
  | 'milestone_overdue'
  | 'quality_issue'
  | 'safety_incident'
  | 'contractor_issue'
  
  // User Management
  | 'new_user_registration'
  | 'user_verification_required'
  | 'user_suspended'
  
  // Document Management
  | 'document_approval_required'
  | 'document_expired'
  | 'compliance_deadline'
  
  // Communication
  | 'urgent_request'
  | 'client_complaint'
  | 'escalated_issue';

export type NotificationCategory = 
  | 'financial'
  | 'operational'
  | 'compliance'
  | 'safety'
  | 'quality'
  | 'communication'
  | 'system';

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

export type NotificationActionType = 
  | 'approve_payment'
  | 'review_document'
  | 'verify_user'
  | 'respond_to_request'
  | 'acknowledge_alert'
  | 'assign_contractor'
  | 'schedule_maintenance'
  | 'contact_client'
  | 'investigate_issue';

// Database table schema
export interface NotificationTableRow {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  action_required: boolean;
  action_type?: NotificationActionType;
  
  entity_type: string;
  entity_id?: string;
  project_id?: string;
  user_id?: string;
  
  is_read: boolean;
  is_dismissed: boolean;
  is_acknowledged: boolean;
  
  assigned_to_admin?: string;
  read_at?: string;
  read_by_admin?: string;
  acknowledged_at?: string;
  dismissed_at?: string;
  
  created_at: string;
  updated_at: string;
  expires_at?: string;
  
  metadata?: any;
}

// Real-time notification stats for dashboard
export interface NotificationStats {
  total_unread: number;
  critical_unread: number;
  high_unread: number;
  action_required_count: number;
  overdue_actions: number;
  
  // By category
  financial_alerts: number;
  operational_alerts: number;
  compliance_alerts: number;
  safety_alerts: number;
  quality_alerts: number;
  communication_alerts: number;
  system_alerts: number;
}

// Notification creation data
export interface CreateNotificationData {
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  action_required?: boolean;
  action_type?: NotificationActionType;
  
  entity_type: string;
  entity_id?: string;
  project_id?: string;
  user_id?: string;
  
  expires_at?: string;
  metadata?: Record<string, any>;
} 