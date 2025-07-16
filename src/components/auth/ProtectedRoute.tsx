'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from './AdminAuthProvider';
import { AdminRole, AdminPermissions } from '@/types/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: AdminRole[];
  requiredPermissions?: Array<{
    resource: keyof AdminPermissions;
    action: string;
  }>;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermissions,
  fallback,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const auth = useAdminAuth();
  const router = useRouter();

  // 🚨 DEVELOPMENT BYPASS - Remove in production  
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || window.location.hostname === 'localhost';
  
  if (isDevelopment) {
    console.log('🔧 Development mode: Bypassing authentication for testing');
    return <>{children}</>;
  }

  // Handle redirect in useEffect to avoid render-time state updates
  useEffect(() => {
    if (!auth.loading && !auth.user) {
      router.push(redirectTo);
    }
  }, [auth.loading, auth.user, router, redirectTo]);

  // Show loading state while checking authentication
  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Return null if not authenticated (redirect will happen in useEffect)
  if (!auth.user) {
    return null;
  }

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(auth.user.admin_role);
    if (!hasRequiredRole) {
      return (
        <AccessDenied
          message={`This page requires one of the following roles: ${requiredRoles.join(', ')}`}
          userRole={auth.user?.admin_role}
          fallback={fallback}
        />
      );
    }
  }

  // Check permission requirements
  if (requiredPermissions && requiredPermissions.length > 0) {
    const missingPermissions = requiredPermissions.filter(
      perm => !auth.hasPermission(perm.resource, perm.action)
    );

    if (missingPermissions.length > 0) {
      return (
        <AccessDenied
          message="You don't have the required permissions to access this page."
          permissions={missingPermissions}
          fallback={fallback}
        />
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

interface AccessDeniedProps {
  message: string;
  userRole?: AdminRole;
  permissions?: Array<{
    resource: keyof AdminPermissions;
    action: string;
  }>;
  fallback?: ReactNode;
}

function AccessDenied({ message, userRole, permissions, fallback }: AccessDeniedProps) {
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p className="font-medium">Access Denied</p>
              <p className="text-sm">{message}</p>
              {userRole && (
                <p className="text-xs text-red-600">
                  Current role: {userRole.replace('_', ' ').toUpperCase()}
                </p>
              )}
              {permissions && permissions.length > 0 && (
                <div className="text-xs text-red-600">
                  <p>Missing permissions:</p>
                  <ul className="list-disc list-inside mt-1">
                    {permissions.map((perm, index) => (
                      <li key={index}>
                        {perm.resource}.{perm.action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <button
            onClick={() => window.history.back()}
            className="text-sm text-orange-600 hover:text-orange-800 underline"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

// Convenience components for common protection patterns
export function SuperAdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function ProjectManagerRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'project_manager']}>
      {children}
    </ProtectedRoute>
  );
}

export function FinanceAdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'finance_admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function SupportAdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'support_admin']}>
      {children}
    </ProtectedRoute>
  );
}

// Permission-based protection components
export function UserManagementRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      requiredPermissions={[
        { resource: 'users', action: 'view' }
      ]}
    >
      {children}
    </ProtectedRoute>
  );
}

export function FinanceManagementRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      requiredPermissions={[
        { resource: 'finances', action: 'view' }
      ]}
    >
      {children}
    </ProtectedRoute>
  );
}

export function SystemManagementRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      requiredPermissions={[
        { resource: 'system', action: 'view_logs' }
      ]}
    >
      {children}
    </ProtectedRoute>
  );
} 