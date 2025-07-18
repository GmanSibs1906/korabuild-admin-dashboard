'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ContractorNotification {
  id: string;
  type: 'new_assignment' | 'status_change' | 'review_pending' | 'document_required';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  contractor_id: string;
  contractor_name: string;
  created_at: string;
  is_read: boolean;
}

export interface ContractorStats {
  totalContractors: number;
  activeContractors: number;
  pendingApproval: number;
  newAssignments: number;
  overdueReviews: number;
  documentsRequired: number;
  unreadNotifications: number;
  verifiedContractors: number;
  averageRating: number;
}

export interface ProjectStats {
  totalContractors: number;
  onSiteContractors: number;
  totalContractValue: number;
  averageProgress: number;
}

export interface ProjectContractor {
  id: string;
  contract_status: string;
  on_site_status: string;
  contract_value: number;
  work_completion_percentage: number;
  start_date: string;
  planned_end_date?: string;
  project_manager_notes?: string;
  contractor?: {
    id: string;
    contractor_name: string;
    company_name: string;
    email: string;
    phone: string;
    trade_specialization: string;
    overall_rating?: number;
    status: string;
    created_by_user?: {
      full_name: string;
      email: string;
    };
    verification_status: string;
    contractor_source: string;
    physical_address?: string;
    postal_address?: string;
    license_number?: string;
    license_type?: string;
    tax_number?: string;
    website_url?: string;
    insurance_provider?: string;
    insurance_policy_number?: string;
    years_in_business?: number;
    number_of_employees?: number;
    hourly_rate?: number;
    daily_rate?: number;
    minimum_project_value?: number;
    payment_terms?: string;
    travel_radius_km?: number;
    notes?: string;
  };
}

export interface UseContractorsResult {
  stats: ContractorStats;
  projectStats: ProjectStats;
  notifications: ContractorNotification[];
  projectContractors: ProjectContractor[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  fetchProjectContractors: (projectId: string) => Promise<void>;
  addContractor: (contractorData: any) => Promise<void>;
  updateContractor: (contractorId: string, contractorData: any) => Promise<void>;
  assignContractorToProject: (assignmentData: any) => Promise<void>;
  updateProjectAssignment: (assignmentId: string, assignmentData: any) => Promise<void>;
}

export function useContractors(): UseContractorsResult {
  const [stats, setStats] = useState<ContractorStats>({
    totalContractors: 0,
    activeContractors: 0,
    pendingApproval: 0,
    newAssignments: 0,
    overdueReviews: 0,
    documentsRequired: 0,
    unreadNotifications: 0,
    verifiedContractors: 0,
    averageRating: 0,
  });

  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalContractors: 0,
    onSiteContractors: 0,
    totalContractValue: 0,
    averageProgress: 0,
  });
  
  const [notifications, setNotifications] = useState<ContractorNotification[]>([]);
  const [projectContractors, setProjectContractors] = useState<ProjectContractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContractorsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch contractors data
      const response = await fetch('/api/contractors');
      const result = await response.json();

      if (result.success) {
        // The API returns contractors in result.data.contractors, not result.data directly
        const contractors = result.data?.contractors || [];
        
        // Calculate stats
        const totalContractors = contractors.length;
        const activeContractors = contractors.filter((c: any) => c.status === 'active').length;
        const pendingApproval = contractors.filter((c: any) => c.status === 'pending_approval').length;
        const verifiedContractors = contractors.filter((c: any) => c.verification_status === 'verified').length;
        
        // Calculate average rating
        const contractorsWithRating = contractors.filter((c: any) => c.overall_rating > 0);
        const averageRating = contractorsWithRating.length > 0 
          ? contractorsWithRating.reduce((sum: number, c: any) => sum + c.overall_rating, 0) / contractorsWithRating.length
          : 0;
        
        // Generate notifications (in real app, these would come from database)
        const contractorNotifications: ContractorNotification[] = [];
        
        // New assignments notifications
        contractors.filter((c: any) => c.status === 'pending_approval').forEach((contractor: any) => {
          contractorNotifications.push({
            id: `new-${contractor.id}`,
            type: 'new_assignment',
            title: 'New Contractor Pending Approval',
            message: `${contractor.contractor_name} is awaiting approval`,
            priority: 'normal',
            contractor_id: contractor.id,
            contractor_name: contractor.contractor_name,
            created_at: contractor.created_at,
            is_read: false,
          });
        });

        // Documents required notifications
        contractors.filter((c: any) => !c.license_number || !c.insurance_policy_number).forEach((contractor: any) => {
          contractorNotifications.push({
            id: `doc-${contractor.id}`,
            type: 'document_required',
            title: 'Documents Required',
            message: `${contractor.contractor_name} is missing required documents`,
            priority: 'high',
            contractor_id: contractor.id,
            contractor_name: contractor.contractor_name,
            created_at: contractor.created_at,
            is_read: false,
          });
        });

        setStats({
          totalContractors,
          activeContractors,
          pendingApproval,
          verifiedContractors,
          averageRating,
          newAssignments: contractorNotifications.filter(n => n.type === 'new_assignment').length,
          overdueReviews: 0, // Would calculate from review data
          documentsRequired: contractorNotifications.filter(n => n.type === 'document_required').length,
          unreadNotifications: contractorNotifications.filter(n => !n.is_read).length,
        });

        setNotifications(contractorNotifications);
      } else {
        setError(result.error || 'Failed to fetch contractors data');
      }
    } catch (err) {
      setError('Network error loading contractors data');
      console.error('Error fetching contractors data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjectContractors = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/contractors?projectId=${projectId}`);
      const result = await response.json();

      if (result.success) {
        const contractors = result.data.projectContractors || [];
        setProjectContractors(contractors);

        // Calculate project stats
        const totalContractors = contractors.length;
        const onSiteContractors = contractors.filter((c: any) => c.on_site_status === 'on_site').length;
        const totalContractValue = contractors.reduce((sum: number, c: any) => sum + (c.contract_value || 0), 0);
        const averageProgress = totalContractors > 0 
          ? contractors.reduce((sum: number, c: any) => sum + (c.work_completion_percentage || 0), 0) / totalContractors
          : 0;

        setProjectStats({
          totalContractors,
          onSiteContractors,
          totalContractValue,
          averageProgress: Math.round(averageProgress),
        });
      } else {
        setError(result.error || 'Failed to fetch project contractors');
      }
    } catch (err) {
      setError('Network error loading project contractors');
      console.error('Error fetching project contractors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addContractor = useCallback(async (contractorData: any) => {
    try {
      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add_contractor',
          data: contractorData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add contractor');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to add contractor');
      }

      // Refresh data after adding
      await fetchContractorsData();
    } catch (err) {
      console.error('Error adding contractor:', err);
      throw err;
    }
  }, [fetchContractorsData]);

  const updateContractor = useCallback(async (contractorId: string, contractorData: any) => {
    try {
      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_contractor',
          data: {
            contractor_id: contractorId,
            updates: contractorData,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update contractor');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update contractor');
      }
    } catch (err) {
      console.error('Error updating contractor:', err);
      throw err;
    }
  }, []);

  const assignContractorToProject = useCallback(async (assignmentData: any) => {
    try {
      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'assign_to_project',
          data: assignmentData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign contractor');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to assign contractor');
      }
    } catch (err) {
      console.error('Error assigning contractor:', err);
      throw err;
    }
  }, []);

  const updateProjectAssignment = useCallback(async (assignmentId: string, assignmentData: any) => {
    try {
      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_project_assignment',
          data: {
            assignment_id: assignmentId,
            updates: assignmentData,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update assignment');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update assignment');
      }
    } catch (err) {
      console.error('Error updating assignment:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchContractorsData();
  }, [fetchContractorsData]);

  return {
    stats,
    projectStats,
    notifications,
    projectContractors,
    loading,
    error,
    refreshData: fetchContractorsData,
    fetchProjectContractors,
    addContractor,
    updateContractor,
    assignContractorToProject,
    updateProjectAssignment,
  };
} 