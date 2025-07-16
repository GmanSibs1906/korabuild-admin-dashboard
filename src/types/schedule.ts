// Schedule-related TypeScript interfaces

export interface ProjectSchedule {
  id: string;
  project_id: string;
  schedule_name: string;
  schedule_type: 'baseline' | 'current' | 'revised' | 'what_if';
  status: 'active' | 'archived' | 'draft' | 'approved';
  start_date: string;
  end_date: string;
  baseline_duration: number;
  current_duration: number | null;
  critical_path: Record<string, unknown> | null;
  schedule_health: 'ahead' | 'on_track' | 'at_risk' | 'delayed';
  completion_percentage: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  projects?: {
    project_name: string;
    start_date: string;
    expected_completion: string;
    current_phase: string;
    progress_percentage: number;
    status: string;
    client_id: string | null;
    users?: {
      full_name: string;
    } | null;
  } | null;
}

export interface SchedulePhase {
  id: string;
  schedule_id: string;
  project_id: string;
  phase_name: string;
  phase_category: 'pre_construction' | 'foundation' | 'framing' | 'roofing' | 'electrical' | 'plumbing' | 'insulation' | 'drywall' | 'flooring' | 'interior_finishing' | 'exterior_finishing' | 'landscaping' | 'final_inspections' | 'cleanup';
  phase_order: number;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
  duration_days: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  progress_percentage: number;
  budget_allocated: number;
  budget_spent: number;
  dependencies: Record<string, unknown> | null;
  notes: string | null;
  responsible_contractor: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleTask {
  id: string;
  schedule_id: string;
  project_id: string;
  phase_id: string | null;
  task_name: string;
  task_description: string | null;
  task_type: 'milestone' | 'activity' | 'inspection' | 'delivery' | 'approval';
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
  duration_hours: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  progress_percentage: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_crew_id: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  weather_dependent: boolean;
  requires_inspection: boolean;
  dependencies: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  schedule_phases?: {
    phase_name: string;
    phase_category: string;
  } | null;
  crew_members?: {
    crew_name: string;
    crew_type: string;
  } | null;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  milestone_name: string;
  description: string | null;
  phase_category: string;
  planned_start: string;
  planned_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'on_hold';
  progress_percentage: number;
  photos: string[];
  notes: string | null;
  order_index: number;
  estimated_cost: number | null;
  actual_cost: number | null;
  responsible_contractor: string | null;
  created_at: string;
  updated_at: string;
}

// **MOBILE APP DATA STRUCTURES** - What users see in mobile app
export interface CalendarEvent {
  id: string;
  project_id: string;
  event_title: string;
  event_description?: string;
  event_type: 'meeting' | 'inspection' | 'delivery' | 'milestone' | 'other';
  start_datetime: string;
  end_datetime: string;
  location?: string;
  attendees?: string[];
  reminder_minutes?: number;
  is_recurring?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrewMember {
  id: string;
  project_id: string;
  crew_name: string;
  crew_type: 'internal' | 'contractor' | 'subcontractor';
  specialization?: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  hourly_rate?: number;
  status: 'active' | 'inactive' | 'on_break' | 'assigned';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleStats {
  // Mobile app statistics (what users see)
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  overdueItems: number;
  upcomingItems: number;
  overallProgress: number;
  
  // Legacy format for compatibility
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  delayedTasks: number;
  
  // Phase and milestone breakdown
  totalPhases: number;
  completedPhases: number;
  inProgressPhases: number;
  notStartedPhases: number;
  
  totalMilestones: number;
  completedMilestones: number;
  inProgressMilestones: number;
  notStartedMilestones: number;
  
  scheduleHealth: 'ahead' | 'on_track' | 'at_risk' | 'delayed';
  delayedCount: number;
}

export interface ScheduleOverviewStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  overallCompletion: number;
  scheduleHealth: 'ahead' | 'on_track' | 'at_risk' | 'delayed';
}

export interface ProjectScheduleData {
  schedule: ProjectSchedule;
  phases: SchedulePhase[];
  tasks: ScheduleTask[];
  milestones: ProjectMilestone[];
  calendarEvents: CalendarEvent[];
  crewMembers: CrewMember[];
  stats: ScheduleStats;
}

export interface ScheduleOverviewData {
  projects: ProjectSchedule[];
  stats: ScheduleOverviewStats;
}

// Update interfaces
export interface UpdateTaskData {
  task_name?: string;
  task_description?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  progress_percentage?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigned_crew_id?: string;
  estimated_cost?: number;
  actual_cost?: number;
  notes?: string;
}

export interface UpdatePhaseData {
  phase_name?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  progress_percentage?: number;
  budget_allocated?: number;
  budget_spent?: number;
  notes?: string;
  responsible_contractor?: string;
}

export interface UpdateScheduleData {
  schedule_name?: string;
  start_date?: string;
  end_date?: string;
  schedule_health?: 'ahead' | 'on_track' | 'at_risk' | 'delayed';
  completion_percentage?: number;
  notes?: string;
}

// Hook interfaces
export interface UseScheduleOptions {
  projectId?: string;
  autoRefresh?: boolean;
  refetchInterval?: number;
}

export interface UseScheduleReturn {
  // Data
  scheduleData: ProjectScheduleData | null;
  overviewData: ScheduleOverviewData | null;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  updateTask: (taskId: string, data: UpdateTaskData) => Promise<void>;
  updatePhase: (phaseId: string, data: UpdatePhaseData) => Promise<void>;
  updateSchedule: (scheduleId: string, data: UpdateScheduleData) => Promise<void>;
  refreshData: () => Promise<void>;
} 