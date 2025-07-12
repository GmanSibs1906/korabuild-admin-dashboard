import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email?: string;
  admin_role: 'super_admin' | 'project_manager' | 'finance_admin' | 'support_admin';
  full_name: string;
  profile_photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminPermissions {
  [resource: string]: {
    [action: string]: boolean;
  };
}

// OTP Verification Interface (same as mobile app)
interface OTPVerificationResult {
  success: boolean;
  user?: User | AdminUser;
  session?: any;
  error?: string;
}

class AdminAuthService {
  private currentUser: AdminUser | null = null;
  private permissions: AdminPermissions = {};

  // Use the same sign-in pattern as mobile app
  async signInWithEmail(email: string, password: string): Promise<AdminUser> {
    console.log('🔐 Using mobile app auth pattern for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Admin sign in error:', error);
      throw error;
    }

    if (!data.user || !data.user.id) {
      throw new Error('No user returned from authentication');
    }

    // Create admin user object using mobile app pattern
    const adminUser: AdminUser = {
      id: data.user.id,
      email: data.user.email,
      admin_role: 'super_admin', // All authenticated users are super admin in dashboard
      full_name: data.user.user_metadata?.full_name || data.user.email || 'Admin User',
      profile_photo_url: data.user.user_metadata?.profile_photo_url,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at
    };

    this.currentUser = adminUser;
    this.setupPermissions('super_admin');

    console.log('✅ Admin authenticated using mobile app pattern:', { 
      email: adminUser.email, 
      role: adminUser.admin_role,
      id: adminUser.id 
    });

    return adminUser;
  }

  // OTP Sign-in (passwordless) - Send OTP (same as mobile app)
  async signInWithOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📧 Sending 6-digit OTP code for admin sign-in to:', email);
      
      // Force OTP token (not magic link) by using signInWithOtp
      // The key is to NOT include emailRedirectTo which forces magic links
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Only allow existing users to sign in
          // NO emailRedirectTo = forces OTP tokens instead of magic links
        }
      });

      if (error) {
        console.error('❌ OTP sign-in error:', error.message);
        throw error;
      }

      console.log('✅ 6-digit OTP code sent successfully for admin sign-in to:', email);
      return {
        success: true,
        message: 'Check your email for a 6-digit verification code'
      };
    } catch (error: any) {
      console.error('❌ OTP sign-in failed:', error.message);
      throw this.handleAuthError(error);
    }
  }

  // Verify OTP for sign-in (same as mobile app)
  async verifyOTPForSignIn(email: string, otp: string): Promise<OTPVerificationResult> {
    try {
      console.log('🔐 Verifying OTP for admin sign-in:', email);
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email' // For sign-in OTP
      });

      if (error) {
        console.error('❌ OTP sign-in verification error:', error.message);
        return {
          success: false,
          error: this.handleAuthError(error).message
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'No user returned after OTP verification'
        };
      }

      console.log('✅ OTP sign-in verification successful');
      console.log('✅ User signed in:', data.user.email);

      // Create admin user object using mobile app pattern
      const adminUser: AdminUser = {
        id: data.user.id,
        email: data.user.email,
        admin_role: 'super_admin',
        full_name: data.user.user_metadata?.full_name || data.user.email || 'Admin User',
        profile_photo_url: data.user.user_metadata?.profile_photo_url,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at
      };

      this.currentUser = adminUser;
      this.setupPermissions('super_admin');

      console.log('✅ Admin OTP authentication successful:', adminUser.email);

      return {
        success: true,
        user: adminUser,
        session: data.session
      };
    } catch (error: any) {
      console.error('❌ OTP sign-in verification failed:', error.message);
      return {
        success: false,
        error: this.handleAuthError(error).message
      };
    }
  }

  // Use the same session check as mobile app
  async checkExistingSession(): Promise<AdminUser | null> {
    try {
      console.log('🔍 Checking existing session using mobile app pattern...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        console.log('✅ Found existing session');
        const user = session.user;
        const adminUser: AdminUser = {
          id: user.id,
          email: user.email,
          admin_role: 'super_admin',
          full_name: user.user_metadata?.full_name || user.email || 'Admin User',
          profile_photo_url: user.user_metadata?.profile_photo_url,
          created_at: user.created_at,
          updated_at: user.updated_at
        };
        
        this.currentUser = adminUser;
        this.setupPermissions('super_admin');
        return adminUser;
      }
      
      console.log('❌ No existing session found');
      return null;
    } catch (error) {
      console.error('Error checking session:', error);
      return null;
    }
  }

  private setupPermissions(role?: string) {
    // Grant all permissions for admin dashboard
    this.permissions = {
      users: {
        view: true,
        edit: true,
        delete: true,
        create: true
      },
      projects: {
        view: true,
        edit: true,
        delete: true,
        create: true
      },
      finances: {
        view: true,
        approve_payments: true
      },
      communications: {
        view_all: true,
        respond: true
      },
      contractors: {
        view: true,
        manage: true
      },
      quality: {
        view_inspections: true
      },
      safety: {
        view_incidents: true
      },
      system: {
        manage_settings: true
      }
    };
  }

  // Handle authentication errors (same as mobile app)
  private handleAuthError(error: any): Error {
    let message = 'Authentication error occurred';
    
    switch (error.message) {
      case 'Invalid login credentials':
        message = 'Invalid email or password';
        break;
      case 'User already registered':
        message = 'An account with this email already exists';
        break;
      case 'Password should be at least 6 characters':
        message = 'Password must be at least 6 characters long';
        break;
      case 'Invalid email':
        message = 'Invalid email address';
        break;
      case 'Email not confirmed':
        message = 'Please verify your email with the OTP sent to your inbox';
        break;
      case 'Invalid token':
        message = 'Invalid or expired OTP. Please request a new one.';
        break;
      case 'Token has expired':
        message = 'OTP has expired. Please request a new one.';
        break;
      default:
        message = error.message || 'Authentication failed';
    }

    return new Error(message);
  }

  hasPermission(resource: string, action: string): boolean {
    return this.permissions[resource]?.[action] || false;
  }

  getCurrentUser(): AdminUser | null {
    return this.currentUser;
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser = null;
    this.permissions = {};
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Initialize using mobile app pattern
  async initialize(): Promise<AdminUser | null> {
    try {
      console.log('🔐 Initializing admin auth using mobile app pattern...');
      
      // Check for existing session first (like mobile app does)
      const existingUser = await this.checkExistingSession();
      
      if (existingUser) {
        console.log('✅ Using existing session for admin dashboard');
        return existingUser;
      }

      // No existing session - user needs to login
      console.log('❌ No existing session - user needs to login');
      return null;
      
    } catch (error) {
      console.error('Failed to initialize admin auth:', error);
      return null;
    }
  }
}

export const adminAuth = new AdminAuthService(); 