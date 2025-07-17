'use client';

import { useState, useEffect, useCallback } from 'react';
import { Database } from '@/types/database';

type Contractor = Database['public']['Tables']['contractors']['Row'] & {
  contractor_capabilities?: Array<{
    id: string;
    services_offered: string[];
    specialized_skills: string[];
    equipment_owned: any;
    safety_certifications: string[];
    technical_certifications: string[];
  }>;
  contractor_reviews?: Array<{
    id: string;
    overall_rating: number;
    quality_of_work: number;
    timeliness: number;
    communication: number;
    cleanliness: number;
    professionalism: number;
    review_date: string;
  }>;
  project_contractors?: Array<{
    id: string;
    project_id: string;
    contract_status: string;
    contract_value: number;
    on_site_status: string;
    work_completion_percentage: number;
    start_date: string;
    planned_end_date: string;
    project?: {
      id: string;
      project_name: string;
      status: string;
    };
  }>;
};

type ProjectContractor = {
  id: string;
  project_id: string;
  contractor_id: string;
  contract_status: string;
  contract_value: number;
  on_site_status: string;
  work_completion_percentage: number;
  start_date: string;
  planned_end_date: string;
  contractor?: Contractor;
};

interface ContractorStats {
  totalContractors: number;
  activeContractors: number;
  verifiedContractors: number;
  pendingContractors: number;
  userAddedContractors: number;
  korabuildVerifiedContractors: number;
  averageRating: number;
}

interface ProjectContractorStats {
  totalContractors: number;
  activeContractors: number;
  onSiteContractors: number;
  completedContractors: number;
  totalContractValue: number;
  averageProgress: number;
}

interface UseContractorsReturn {
  contractors: Contractor[];
  projectContractors: ProjectContractor[];
  stats: ContractorStats;
  projectStats: ProjectContractorStats;
  loading: boolean;
  error: string | null;
  fetchContractors: () => Promise<void>;
  fetchProjectContractors: (projectId: string) => Promise<void>;
  addContractor: (contractorData: any) => Promise<void>;
  updateContractor: (contractorId: string, updates: any) => Promise<void>;
  assignContractorToProject: (assignmentData: any) => Promise<void>;
  updateProjectAssignment: (assignmentId: string, updates: any) => Promise<void>;
}

export function useContractors(): UseContractorsReturn {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [projectContractors, setProjectContractors] = useState<ProjectContractor[]>([]);
  const [stats, setStats] = useState<ContractorStats>({
    totalContractors: 0,
    activeContractors: 0,
    verifiedContractors: 0,
    pendingContractors: 0,
    userAddedContractors: 0,
    korabuildVerifiedContractors: 0,
    averageRating: 0
  });
  const [projectStats, setProjectStats] = useState<ProjectContractorStats>({
    totalContractors: 0,
    activeContractors: 0,
    onSiteContractors: 0,
    completedContractors: 0,
    totalContractValue: 0,
    averageProgress: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContractors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👥 Fetching all contractors...');
      
      const response = await fetch('/api/contractors', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error fetching contractors:', errorData);
        setError(errorData.error || 'Failed to fetch contractors');
        return;
      }

      const { data } = await response.json();
      console.log('✅ Contractors fetched successfully:', data.contractors.length);

      setContractors(data.contractors || []);
      setStats(data.stats || {
        totalContractors: 0,
        activeContractors: 0,
        verifiedContractors: 0,
        pendingContractors: 0,
        userAddedContractors: 0,
        korabuildVerifiedContractors: 0,
        averageRating: 0
      });

    } catch (error: any) {
      console.error('❌ Error fetching contractors:', error);
      setError(error.message || 'Failed to fetch contractors');
      setContractors([]);
      setStats({
        totalContractors: 0,
        activeContractors: 0,
        verifiedContractors: 0,
        pendingContractors: 0,
        userAddedContractors: 0,
        korabuildVerifiedContractors: 0,
        averageRating: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjectContractors = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👥 Fetching contractors for project:', projectId);
      
      const response = await fetch(`/api/contractors?projectId=${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error fetching project contractors:', errorData);
        setError(errorData.error || 'Failed to fetch project contractors');
        return;
      }

      const { data } = await response.json();
      console.log('✅ Project contractors fetched successfully:', data.projectContractors.length);

      setProjectContractors(data.projectContractors || []);
      setProjectStats(data.stats || {
        totalContractors: 0,
        activeContractors: 0,
        onSiteContractors: 0,
        completedContractors: 0,
        totalContractValue: 0,
        averageProgress: 0
      });

    } catch (error: any) {
      console.error('❌ Error fetching project contractors:', error);
      setError(error.message || 'Failed to fetch project contractors');
      setProjectContractors([]);
      setProjectStats({
        totalContractors: 0,
        activeContractors: 0,
        onSiteContractors: 0,
        completedContractors: 0,
        totalContractValue: 0,
        averageProgress: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const addContractor = useCallback(async (contractorData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👥 Adding contractor:', contractorData.contractor_name);
      
      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add_contractor',
          data: contractorData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error adding contractor:', errorData);
        setError(errorData.error || 'Failed to add contractor');
        throw new Error(errorData.error || 'Failed to add contractor');
      }

      const { data } = await response.json();
      console.log('✅ Contractor added successfully:', contractorData.contractor_name);

      // Refresh contractors list
      await fetchContractors();

      return data;

    } catch (error: any) {
      console.error('❌ Error adding contractor:', error);
      setError(error.message || 'Failed to add contractor');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchContractors]);

  const updateContractor = async (contractorId: string, updates: any) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👥 Updating contractor:', contractorId);
      
      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_contractor',
          data: { contractor_id: contractorId, updates }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error updating contractor:', errorData);
        setError(errorData.error || 'Failed to update contractor');
        throw new Error(errorData.error || 'Failed to update contractor');
      }

      const { data } = await response.json();
      console.log('✅ Contractor updated successfully:', contractorId);

      // Update local state
      setContractors(prev => prev.map(c => c.id === contractorId ? { ...c, ...updates } : c));

      return data;

    } catch (error: any) {
      console.error('❌ Error updating contractor:', error);
      setError(error.message || 'Failed to update contractor');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const assignContractorToProject = async (assignmentData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👥 Assigning contractor to project...');
      
      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'assign_to_project',
          data: assignmentData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error assigning contractor:', errorData);
        setError(errorData.error || 'Failed to assign contractor');
        throw new Error(errorData.error || 'Failed to assign contractor');
      }

      const { data } = await response.json();
      console.log('✅ Contractor assigned successfully');

      return data;

    } catch (error: any) {
      console.error('❌ Error assigning contractor:', error);
      setError(error.message || 'Failed to assign contractor');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProjectAssignment = useCallback(async (assignmentId: string, updates: any) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👥 Updating project assignment:', assignmentId);
      
      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_project_assignment',
          data: { assignment_id: assignmentId, updates }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error updating assignment:', errorData);
        setError(errorData.error || 'Failed to update assignment');
        throw new Error(errorData.error || 'Failed to update assignment');
      }

      const { data } = await response.json();
      console.log('✅ Assignment updated successfully:', assignmentId);

      // Update local state
      setProjectContractors(prev => prev.map(pc => pc.id === assignmentId ? { ...pc, ...updates } : pc));

      return data;

    } catch (error: any) {
      console.error('❌ Error updating assignment:', error);
      setError(error.message || 'Failed to update assignment');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  return {
    contractors,
    projectContractors,
    stats,
    projectStats,
    loading,
    error,
    fetchContractors,
    fetchProjectContractors,
    addContractor,
    updateContractor,
    assignContractorToProject,
    updateProjectAssignment,
  };
} 