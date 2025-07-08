'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { adminAuthService } from '@/lib/auth/admin-auth';
import { AdminUser, AuthSession, AuthContext, AdminRole, AdminPermissions } from '@/types/auth';

const AdminAuthContext = createContext<AuthContext | null>(null);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up session refresh interval
  useEffect(() => {
    if (!session) return;

    const refreshInterval = setInterval(async () => {
      await refreshSession();
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [session]);

  const initializeAuth = async () => {
    try {
      const currentSession = await adminAuthService.getCurrentSession();
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
      }
    } catch (error) {
      console.error('Initialize auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const authSession = await adminAuthService.signInWithPassword(email, password);
      setSession(authSession);
      setUser(authSession.user);

      // Log the successful login action
      await adminAuthService.logAdminAction(
        authSession.user.id,
        authSession.user.email,
        'login',
        'admin_session'
      );
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Log the logout action before clearing session
      if (user) {
        await adminAuthService.logAdminAction(
          user.id,
          user.email,
          'logout',
          'admin_session'
        );
      }

      await adminAuthService.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async (): Promise<void> => {
    try {
      const refreshedSession = await adminAuthService.refreshSession();
      if (refreshedSession) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);
      } else {
        // Session invalid, logout user
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Refresh session error:', error);
      // On refresh error, logout user
      setSession(null);
      setUser(null);
    }
  };

  const hasPermission = (
    resource: keyof AdminPermissions,
    action: string
  ): boolean => {
    if (!user) return false;
    return adminAuthService.hasPermission(user, resource, action);
  };

  const hasRole = (roles: AdminRole | AdminRole[]): boolean => {
    if (!user) return false;
    return adminAuthService.hasRole(user, roles);
  };

  const isAuthenticated = !!user && !!session;

  const contextValue: AuthContext = {
    user,
    session,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshSession,
    hasPermission,
    hasRole
  };

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AuthContext {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// Helper hooks for common auth checks
export function useRequireAuth() {
  const auth = useAdminAuth();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirect to login - this would be handled by the route protection
      console.warn('User not authenticated');
    }
  }, [auth.isLoading, auth.isAuthenticated]);
  
  return auth;
}

export function useRequireRole(requiredRoles: AdminRole | AdminRole[]) {
  const auth = useAdminAuth();
  const hasRequiredRole = auth.hasRole(requiredRoles);
  
  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && !hasRequiredRole) {
      console.warn('User does not have required role');
      // Handle unauthorized access
    }
  }, [auth.isLoading, auth.isAuthenticated, hasRequiredRole]);
  
  return { ...auth, hasRequiredRole };
}

export function useRequirePermission(
  resource: keyof AdminPermissions,
  action: string
) {
  const auth = useAdminAuth();
  const hasRequiredPermission = auth.hasPermission(resource, action);
  
  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && !hasRequiredPermission) {
      console.warn(`User does not have permission: ${resource}.${action}`);
      // Handle unauthorized access
    }
  }, [auth.isLoading, auth.isAuthenticated, hasRequiredPermission, resource, action]);
  
  return { ...auth, hasRequiredPermission };
} 