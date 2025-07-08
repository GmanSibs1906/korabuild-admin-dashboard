"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, AdminRole, AdminPermissions } from '@/types/auth';

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (resource: keyof AdminPermissions, action: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

// Mock admin user for testing
const mockAdminUser: AdminUser = {
  id: '1',
  email: 'admin@korabuild.com',
  full_name: 'Admin User',
  phone: '+1234567890',
  role: 'admin',
  admin_role: 'super_admin',
  profile_photo_url: undefined,
  last_login: new Date().toISOString(),
  login_history: [],
  mfa_enabled: false,
  is_active: true,
  department: 'IT Administration',
  employee_id: 'ADM001',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  permissions: {
    users: {
      view: true,
      edit: true,
      delete: true,
      impersonate: true,
    },
    projects: {
      view: true,
      edit: true,
      delete: true,
      create: true,
    },
    finances: {
      view: true,
      approve_payments: true,
      modify_budgets: true,
      generate_reports: true,
    },
    communications: {
      view_all: true,
      respond: true,
      broadcast: true,
      moderate: true,
    },
    contractors: {
      view: true,
      approve: true,
      suspend: true,
      manage_assignments: true,
    },
    quality: {
      view_inspections: true,
      schedule_inspections: true,
      approve_standards: true,
      generate_reports: true,
    },
    safety: {
      view_incidents: true,
      create_alerts: true,
      manage_compliance: true,
      access_records: true,
    },
    system: {
      view_logs: true,
      manage_settings: true,
      backup_restore: true,
      user_management: true,
    },
  },
};

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock authentication - in real app, this would check Supabase session
    setUser(mockAdminUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Mock login - in real app, this would authenticate with Supabase
    setTimeout(() => {
      setUser(mockAdminUser);
      setIsLoading(false);
    }, 1000);
  };

  const logout = async () => {
    setUser(null);
  };

  const hasPermission = (resource: keyof AdminPermissions, action: string): boolean => {
    if (!user?.permissions) return false;
    const resourcePermissions = user.permissions[resource] as any;
    return resourcePermissions?.[action] === true;
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    hasPermission,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}

// Helper hooks for common auth checks
export function useRequireAuth() {
  const auth = useAdminAuth();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      // Redirect to login - this would be handled by the route protection
      console.warn('User not authenticated');
    }
  }, [auth.isLoading, auth.user]);
  
  return auth;
}

export function useRequireRole(requiredRoles: AdminRole | AdminRole[]) {
  const auth = useAdminAuth();
  const hasRequiredRole = auth.user?.role === 'admin'; // Mocking role check
  
  useEffect(() => {
    if (!auth.isLoading && auth.user && !hasRequiredRole) {
      console.warn('User does not have required role');
      // Handle unauthorized access
    }
  }, [auth.isLoading, auth.user, hasRequiredRole]);
  
  return { ...auth, hasRequiredRole };
}

export function useRequirePermission(
  resource: keyof AdminPermissions,
  action: string
) {
  const auth = useAdminAuth();
  const hasRequiredPermission = auth.hasPermission(resource, action);
  
  useEffect(() => {
    if (!auth.isLoading && auth.user && !hasRequiredPermission) {
      console.warn(`User does not have permission: ${resource}.${action}`);
      // Handle unauthorized access
    }
  }, [auth.isLoading, auth.user, hasRequiredPermission, resource, action]);
  
  return { ...auth, hasRequiredPermission };
} 