// Admin authentication types for KoraBuild Admin Dashboard
export type AdminRole = 'super_admin' | 'project_manager' | 'finance_admin' | 'support_admin';

export type UserRole = 'client' | 'admin' | 'contractor' | 'inspector';

export interface AdminPermissions {
  users: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    impersonate: boolean;
  };
  projects: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    create: boolean;
  };
  finances: {
    view: boolean;
    approve_payments: boolean;
    modify_budgets: boolean;
    generate_reports: boolean;
  };
  contractors: {
    view: boolean;
    approve: boolean;
    suspend: boolean;
    manage_assignments: boolean;
  };
  communications: {
    view_all: boolean;
    respond: boolean;
    broadcast: boolean;
    moderate: boolean;
  };
  quality: {
    view_inspections: boolean;
    schedule_inspections: boolean;
    approve_standards: boolean;
    generate_reports: boolean;
  };
  safety: {
    view_incidents: boolean;
    create_alerts: boolean;
    manage_compliance: boolean;
    access_records: boolean;
  };
  system: {
    view_logs: boolean;
    manage_settings: boolean;
    backup_restore: boolean;
    user_management: boolean;
  };
}

export interface LoginRecord {
  id: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  success: boolean;
  failure_reason?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  admin_role: AdminRole;
  permissions: AdminPermissions;
  profile_photo_url?: string;
  last_login?: string;
  login_history: LoginRecord[];
  mfa_enabled: boolean;
  is_active: boolean;
  department?: string;
  employee_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: AdminUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  session_id: string;
}

export interface AuthContext {
  user: AdminUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasPermission: (resource: keyof AdminPermissions, action: string) => boolean;
  hasRole: (role: AdminRole | AdminRole[]) => boolean;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  success: boolean;
  error_message?: string;
}

// Default permission sets for each admin role
export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  super_admin: {
    users: { view: true, edit: true, delete: true, impersonate: true },
    projects: { view: true, edit: true, delete: true, create: true },
    finances: { view: true, approve_payments: true, modify_budgets: true, generate_reports: true },
    contractors: { view: true, approve: true, suspend: true, manage_assignments: true },
    communications: { view_all: true, respond: true, broadcast: true, moderate: true },
    quality: { view_inspections: true, schedule_inspections: true, approve_standards: true, generate_reports: true },
    safety: { view_incidents: true, create_alerts: true, manage_compliance: true, access_records: true },
    system: { view_logs: true, manage_settings: true, backup_restore: true, user_management: true },
  },
  project_manager: {
    users: { view: true, edit: false, delete: false, impersonate: false },
    projects: { view: true, edit: true, delete: false, create: true },
    finances: { view: true, approve_payments: false, modify_budgets: true, generate_reports: true },
    contractors: { view: true, approve: true, suspend: false, manage_assignments: true },
    communications: { view_all: true, respond: true, broadcast: false, moderate: true },
    quality: { view_inspections: true, schedule_inspections: true, approve_standards: false, generate_reports: true },
    safety: { view_incidents: true, create_alerts: true, manage_compliance: true, access_records: true },
    system: { view_logs: false, manage_settings: false, backup_restore: false, user_management: false },
  },
  finance_admin: {
    users: { view: true, edit: false, delete: false, impersonate: false },
    projects: { view: true, edit: false, delete: false, create: false },
    finances: { view: true, approve_payments: true, modify_budgets: true, generate_reports: true },
    contractors: { view: true, approve: false, suspend: false, manage_assignments: false },
    communications: { view_all: false, respond: true, broadcast: false, moderate: false },
    quality: { view_inspections: false, schedule_inspections: false, approve_standards: false, generate_reports: false },
    safety: { view_incidents: false, create_alerts: false, manage_compliance: false, access_records: false },
    system: { view_logs: false, manage_settings: false, backup_restore: false, user_management: false },
  },
  support_admin: {
    users: { view: true, edit: true, delete: false, impersonate: true },
    projects: { view: true, edit: false, delete: false, create: false },
    finances: { view: false, approve_payments: false, modify_budgets: false, generate_reports: false },
    contractors: { view: true, approve: false, suspend: false, manage_assignments: false },
    communications: { view_all: true, respond: true, broadcast: true, moderate: true },
    quality: { view_inspections: false, schedule_inspections: false, approve_standards: false, generate_reports: false },
    safety: { view_incidents: true, create_alerts: false, manage_compliance: false, access_records: false },
    system: { view_logs: true, manage_settings: false, backup_restore: false, user_management: false },
  },
}; 