'use client';

import { useState, useEffect } from 'react';
import { Database } from '@/types/database';

type Project = Database['public']['Tables']['projects']['Row'] & {
  client?: {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
  };
  project_milestones?: Array<{
    id: string;
    milestone_name: string;
    status: string;
    progress_percentage?: number;
    planned_start?: string;
    planned_end?: string;
    actual_start?: string;
    actual_end?: string;
    phase_category: string;
  }>;
  project_contractors?: Array<{
    id: string;
    contract_status: string;
    contract_value?: number;
    on_site_status?: string;
    work_completion_percentage?: number;
    contractor?: {
      id: string;
      contractor_name: string;
      company_name: string;
      trade_specialization: string;
      overall_rating?: number;
    };
  }>;
  payments?: Array<{
    id: string;
    amount: number;
    payment_date: string;
    status: string;
    payment_category?: string;
  }>;
  stats?: {
    totalMilestones: number;
    completedMilestones: number;
    totalPayments: number;
    totalContractValue: number;
    healthScore: number;
    progressScore: number;
    timelineScore: number;
    budgetScore: number;
    milestoneScore: number;
    activeContractors: number;
    onSiteContractors: number;
  };
};

interface ProjectSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalContractValue: number;
  averageProgress: number;
  averageHealthScore: number;
  projectsNeedingAttention: number;
  projectsOnSchedule: number;
  projectsOverBudget: number;
}

interface UseProjectsReturn {
  projects: Project[];
  summary: ProjectSummary;
  loading: boolean;
  error: string | null;
  count: number;
  refreshProjects: () => void;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<ProjectSummary>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    onHoldProjects: 0,
    totalContractValue: 0,
    averageProgress: 0,
    averageHealthScore: 0,
    projectsNeedingAttention: 0,
    projectsOnSchedule: 0,
    projectsOverBudget: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏗️ Fetching projects using admin API...');
      
      const response = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch projects');
      }

      const data = await response.json();
      console.log('✅ Projects fetched successfully:', data.count);
      
      setProjects(data.projects || []);
      setSummary(data.summary || {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        totalContractValue: 0,
        averageProgress: 0,
        averageHealthScore: 0,
        projectsNeedingAttention: 0,
        projectsOnSchedule: 0,
        projectsOverBudget: 0
      });
    } catch (err) {
      console.error('❌ Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      setProjects([]);
      setSummary({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        totalContractValue: 0,
        averageProgress: 0,
        averageHealthScore: 0,
        projectsNeedingAttention: 0,
        projectsOnSchedule: 0,
        projectsOverBudget: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshProjects = () => {
    fetchProjects();
  };

  useEffect(() => {
    fetchProjects();
  }, []); // Empty dependency array - only run on mount to prevent infinite loops

  return {
    projects,
    summary,
    loading,
    error,
    count: projects.length,
    refreshProjects
  };
} 