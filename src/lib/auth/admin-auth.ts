import { supabase, supabaseAdmin } from '@/lib/supabase/client';
import { 
  AdminUser, 
  AdminRole, 
  AuthSession, 
  LoginRecord, 
  AuditLogEntry, 
  ADMIN_ROLE_PERMISSIONS 
} from '@/types/auth';
import { User } from '@/types/database';

export class AdminAuthService {
  private static instance: AdminAuthService;
  
  public static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  /**
   * Authenticate admin user with email/password
   */
  async signInWithPassword(email: string, password: string): Promise<AuthSession> {
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        await this.logAuthAttempt(email, false, authError.message);
        throw new Error(authError.message);
      }

      if (!authData.user || !authData.session) {
        await this.logAuthAttempt(email, false, 'No user or session returned');
        throw new Error('Authentication failed');
      }

      // Get admin user details from database
      const adminUser = await this.getAdminUser(authData.user.id);
      
      if (!adminUser) {
        await this.logAuthAttempt(email, false, 'User not found in admin system');
        throw new Error('User not authorized for admin access');
      }

      if (!adminUser.is_active) {
        await this.logAuthAttempt(email, false, 'Admin account is inactive');
        throw new Error('Admin account is inactive');
      }

      // Update last login
      await this.updateLastLogin(adminUser.id);

      // Log successful login
      await this.logAuthAttempt(email, true);

      // Create session
      const session: AuthSession = {
        user: adminUser,
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at || 0,
        session_id: authData.session.access_token
      };

      return session;
    } catch (error) {
      console.error('Admin sign-in error:', error);
      throw error;
    }
  }

  /**
   * Sign out admin user
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Admin sign-out error:', error);
      throw error;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<AuthSession | null> {
    try {
      const { data: authData, error } = await supabase.auth.refreshSession();
      
      if (error || !authData.session || !authData.user) {
        return null;
      }

      const adminUser = await this.getAdminUser(authData.user.id);
      if (!adminUser || !adminUser.is_active) {
        return null;
      }

      return {
        user: adminUser,
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at || 0,
        session_id: authData.session.access_token
      };
    } catch (error) {
      console.error('Session refresh error:', error);
      return null;
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session || !session.user) {
        return null;
      }

      const adminUser = await this.getAdminUser(session.user.id);
      if (!adminUser || !adminUser.is_active) {
        return null;
      }

      return {
        user: adminUser,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at || 0,
        session_id: session.access_token
      };
    } catch (error) {
      console.error('Get current session error:', error);
      return null;
    }
  }

  /**
   * Get admin user from database with role and permissions
   */
  private async getAdminUser(userId: string): Promise<AdminUser | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('role', 'admin')
        .single();

      if (error || !user) {
        return null;
      }

      // Get admin metadata (admin_role, etc.) from user metadata or separate table
      // For now, we'll use super_admin as default, but this should come from user metadata
      const adminRole: AdminRole = (user as any).admin_role || 'project_manager';
      
      const adminUser: AdminUser = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        admin_role: adminRole,
        permissions: ADMIN_ROLE_PERMISSIONS[adminRole],
        profile_photo_url: user.profile_photo_url,
        last_login: undefined, // Will be fetched separately
        login_history: [], // Will be fetched separately
        mfa_enabled: false, // Will be implemented later
        is_active: true,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      return adminUser;
    } catch (error) {
      console.error('Get admin user error:', error);
      return null;
    }
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Update last login error:', error);
    }
  }

  /**
   * Log authentication attempt for audit purposes
   */
  private async logAuthAttempt(
    email: string, 
    success: boolean, 
    errorMessage?: string
  ): Promise<void> {
    try {
      // Get client IP and user agent (in a real app, these would come from headers)
      const ip_address = '127.0.0.1'; // Placeholder
      const user_agent = navigator.userAgent;

      const loginRecord: Omit<LoginRecord, 'id'> = {
        timestamp: new Date().toISOString(),
        ip_address,
        user_agent,
        success,
        failure_reason: errorMessage
      };

      // In a production app, you'd store this in an audit log table
      console.log('Auth attempt:', { email, ...loginRecord });
      
      // TODO: Store in audit_logs table
    } catch (error) {
      console.error('Log auth attempt error:', error);
    }
  }

  /**
   * Log admin action for audit trail
   */
  async logAdminAction(
    adminId: string,
    adminEmail: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    try {
      const auditEntry: Omit<AuditLogEntry, 'id'> = {
        admin_id: adminId,
        admin_email: adminEmail,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: '127.0.0.1', // Placeholder
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        success: true
      };

      // TODO: Store in audit_logs table
      console.log('Admin action logged:', auditEntry);
    } catch (error) {
      console.error('Log admin action error:', error);
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(
    user: AdminUser,
    resource: keyof typeof user.permissions,
    action: string
  ): boolean {
    const resourcePermissions = user.permissions[resource];
    if (!resourcePermissions || typeof resourcePermissions !== 'object') {
      return false;
    }
    return (resourcePermissions as any)[action] === true;
  }

  /**
   * Check if user has specific role(s)
   */
  hasRole(user: AdminUser, roles: AdminRole | AdminRole[]): boolean {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.admin_role);
  }
}

export const adminAuthService = AdminAuthService.getInstance(); 