"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminAuth, AdminUser } from '@/lib/auth/admin-auth';

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  login: (email: string, password: string) => Promise<AdminUser>;
  sendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (email: string, otp: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInitialSession();
  }, []);

  const checkInitialSession = async () => {
    try {
      console.log('🔄 Checking initial session...');
      const existingUser = await adminAuth.checkExistingSession();
      
      if (existingUser) {
        console.log('✅ Found existing session:', existingUser.email);
        setUser(existingUser);
      } else {
        console.log('❌ No existing session found');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error checking initial session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AdminUser> => {
    setLoading(true);
    try {
      console.log('🔐 Logging in with mobile app pattern:', email);
      const authenticatedUser = await adminAuth.signInWithEmail(email, password);
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Send OTP (same as mobile app)
  const sendOTP = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('📧 Sending OTP using mobile app pattern:', email);
      const result = await adminAuth.signInWithOTP(email);
      return result;
    } catch (error: any) {
      console.error('Send OTP failed:', error);
      throw error;
    }
  };

  // Verify OTP (same as mobile app)
  const verifyOTP = async (email: string, otp: string): Promise<AdminUser> => {
    setLoading(true);
    try {
      console.log('🔐 Verifying OTP using mobile app pattern:', email);
      const result = await adminAuth.verifyOTPForSignIn(email, otp);
      
      if (!result.success || !result.user) {
        throw new Error(result.error || 'OTP verification failed');
      }

      const adminUser = result.user as AdminUser;
      setUser(adminUser);
      return adminUser;
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await adminAuth.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async (): Promise<void> => {
    try {
      const existingUser = await adminAuth.checkExistingSession();
      setUser(existingUser);
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    return adminAuth.hasPermission(resource, action);
  };

  const value: AdminAuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    hasPermission,
    login,
    sendOTP,
    verifyOTP,
    logout,
    checkSession,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// Helper hooks for common auth checks
export function useRequireAuth() {
  const auth = useAdminAuth();
  
  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      // Redirect to login - this would be handled by the route protection
      console.warn('User not authenticated');
    }
  }, [auth.loading, auth.isAuthenticated]);
  
  return auth;
}

export function useRequireRole(requiredRoles: string | string[]) {
  const auth = useAdminAuth();
  const hasRequiredRole = auth.user?.admin_role === 'super_admin'; // Check admin role
  
  useEffect(() => {
    if (!auth.loading && auth.user && !hasRequiredRole) {
      console.warn('User does not have required role');
      // Handle unauthorized access
    }
  }, [auth.loading, auth.user, hasRequiredRole]);
  
  return { ...auth, hasRequiredRole };
}

export function useRequirePermission(
  resource: string,
  action: string
) {
  const auth = useAdminAuth();
  const hasRequiredPermission = auth.hasPermission(resource, action);
  
  useEffect(() => {
    if (!auth.loading && auth.user && !hasRequiredPermission) {
      console.warn(`User does not have permission: ${resource}.${action}`);
      // Handle unauthorized access
    }
  }, [auth.loading, auth.user, hasRequiredPermission, resource, action]);
  
  return { ...auth, hasRequiredPermission };
} 