import { useState, useCallback } from 'react';

// TypeScript interfaces
export interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  profilePhotoUrl?: string;
  joinDate: string;
  lastActivity: string;
}

export interface UserQuickStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  planningProjects: number;
  // AUTHORITATIVE financial data (matches mobile app)
  totalCashReceived: number;
  totalAmountUsed: number;
  totalAmountRemaining: number;
  totalContractValue: number;
  totalMessages: number;
  unreadNotifications: number;
  engagementScore: number;
  lastActivity: string;
  // Legacy field for backward compatibility
  totalSpent: number;
}

export interface UserProject {
  id: string;
  project_name: string;
  project_address: string;
  contract_value: number;
  start_date: string;
  expected_completion: string;
  actual_completion?: string;
  current_phase: string;
  progress_percentage: number;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_email?: string;
}

export interface ProjectFinancial {
  project_id: string;
  cash_received: number;
  amount_used: number;
  amount_remaining: number;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  status: string;
  progress_percentage: number;
}

export interface UserPayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  description: string;
  status: string;
  projects?: { project_name: string };
}

export interface UserDocument {
  id: string;
  document_name: string;
  document_type: string;
  approval_status: string;
  created_at: string;
  projects?: { project_name: string };
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  projects?: { project_name: string };
}

export interface UserActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  projectName?: string;
  timestamp: string;
  category: string;
  icon: string;
  color: string;
  metadata?: any;
}

export interface UserActivityTimeline {
  date: string;
  activities: UserActivity[];
}

export interface UserProfile {
  userInfo: UserInfo;
  quickStats: UserQuickStats;
  projects: UserProject[];
  payments: UserPayment[];
  allPayments: UserPayment[];
  documents: UserDocument[];
  notifications: UserNotification[];
  contractorReviews: any[];
  approvalRequests: any[];
  certifications: any[];
  projectFinancials: ProjectFinancial[];
  projectMilestones: ProjectMilestone[];
  conversations: any[];
}

export interface UserActivityResponse {
  timeline: UserActivityTimeline[];
  totalActivities: number;
  hasMore: boolean;
}

interface UseUserProfileReturn {
  // Data
  userProfile: UserProfile | null;
  userActivity: UserActivityResponse | null;
  
  // Loading states
  profileLoading: boolean;
  activityLoading: boolean;
  
  // Error states
  profileError: string | null;
  activityError: string | null;
  
  // Functions
  fetchUserProfile: (userId: string) => Promise<void>;
  fetchUserActivity: (userId: string, limit?: number, offset?: number) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  clearUserProfile: () => void;
}

export function useUserProfile(): UseUserProfileReturn {
  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // User activity state
  const [userActivity, setUserActivity] = useState<UserActivityResponse | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  
  // Store current user ID for refresh functionality
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch user profile
  const fetchUserProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    setProfileError(null);
    setCurrentUserId(userId);

    try {
      console.log('🔍 useUserProfile - Fetching user profile for:', userId);
      
      const response = await fetch(`/api/users/${userId}/profile`);
      console.log('🔍 useUserProfile - API response status:', response.status);
      console.log('🔍 useUserProfile - API response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 useUserProfile - API error response:', errorText);
        throw new Error(`Failed to fetch user profile: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 useUserProfile - API response data:', data);
      console.log('🔍 useUserProfile - User info:', data.userInfo);
      setUserProfile(data);
      
      console.log('✅ useUserProfile - User profile loaded successfully');
    } catch (error) {
      console.error('❌ useUserProfile - Error fetching user profile:', error);
      setProfileError(error instanceof Error ? error.message : 'Failed to fetch user profile');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Fetch user activity
  const fetchUserActivity = useCallback(async (
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ) => {
    setActivityLoading(true);
    setActivityError(null);

    try {
      console.log('🔍 Fetching user activity for:', userId);
      
      const response = await fetch(
        `/api/users/${userId}/activity?limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user activity: ${response.status}`);
      }

      const data = await response.json();
      
      if (offset === 0) {
        // New data, replace existing
        setUserActivity(data);
      } else {
        // Append to existing data (pagination)
        setUserActivity(prev => prev ? {
          ...data,
          timeline: [...prev.timeline, ...data.timeline]
        } : data);
      }
      
      console.log('✅ User activity loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching user activity:', error);
      setActivityError(error instanceof Error ? error.message : 'Failed to fetch user activity');
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // Refresh user profile
  const refreshUserProfile = useCallback(async () => {
    if (currentUserId) {
      await fetchUserProfile(currentUserId);
    }
  }, [currentUserId, fetchUserProfile]);

  // Clear user profile data
  const clearUserProfile = useCallback(() => {
    setUserProfile(null);
    setUserActivity(null);
    setCurrentUserId(null);
    setProfileError(null);
    setActivityError(null);
  }, []);

  return {
    // Data
    userProfile,
    userActivity,
    
    // Loading states
    profileLoading,
    activityLoading,
    
    // Error states
    profileError,
    activityError,
    
    // Functions
    fetchUserProfile,
    fetchUserActivity,
    refreshUserProfile,
    clearUserProfile
  };
} 