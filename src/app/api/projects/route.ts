import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🏗️ Admin API: Fetching all projects with related data...');
    
    // Fetch all projects with comprehensive related data
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        client:users!projects_client_id_fkey(
          id,
          email,
          full_name,
          phone
        ),
        project_milestones(
          id,
          milestone_name,
          status,
          progress_percentage,
          planned_start,
          planned_end,
          actual_start,
          actual_end,
          phase_category
        ),
        project_contractors(
          id,
          contract_status,
          contract_value,
          on_site_status,
          work_completion_percentage,
          contractor:contractors(
            id,
            contractor_name,
            company_name,
            trade_specialization,
            overall_rating
          )
        ),
        payments(
          id,
          amount,
          payment_date,
          status,
          payment_category
        )
      `)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('❌ Admin API: Error fetching projects:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: projectsError.message },
        { status: 500 }
      );
    }

    // Calculate project statistics and health indicators
    const projectsWithStats = projects?.map(project => {
      const totalMilestones = project.project_milestones?.length || 0;
      const completedMilestones = project.project_milestones?.filter((m: any) => m.status === 'completed').length || 0;
      const totalPayments = project.payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
      const totalContractValue = project.project_contractors?.reduce((sum: number, c: any) => sum + (c.contract_value || 0), 0) || project.contract_value || 0;
      
      // Calculate project health score
      const progressScore = project.progress_percentage || 0;
      const timelineScore = calculateTimelineScore(project.start_date, project.expected_completion, project.actual_completion);
      const budgetScore = calculateBudgetScore(totalContractValue, totalPayments);
      const milestoneScore = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
      
      const healthScore = Math.round((progressScore + timelineScore + budgetScore + milestoneScore) / 4);
      
      return {
        ...project,
        stats: {
          totalMilestones,
          completedMilestones,
          totalPayments,
          totalContractValue,
          healthScore,
          progressScore,
          timelineScore,
          budgetScore,
          milestoneScore,
          activeContractors: project.project_contractors?.filter((c: any) => c.contract_status === 'active').length || 0,
          onSiteContractors: project.project_contractors?.filter((c: any) => c.on_site_status === 'on_site').length || 0
        }
      };
    }) || [];

    console.log(`✅ Admin API: Successfully fetched ${projectsWithStats.length} projects with statistics`);
    
    // Calculate overall project metrics
    const totalProjects = projectsWithStats.length;
    const activeProjects = projectsWithStats.filter(p => p.status === 'in_progress').length;
    const completedProjects = projectsWithStats.filter(p => p.status === 'completed').length;
    const onHoldProjects = projectsWithStats.filter(p => p.status === 'on_hold').length;
    const totalContractValue = projectsWithStats.reduce((sum, p) => sum + (p.contract_value || 0), 0);
    const averageProgress = totalProjects > 0 ? Math.round(projectsWithStats.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / totalProjects) : 0;
    const averageHealthScore = totalProjects > 0 ? Math.round(projectsWithStats.reduce((sum, p) => sum + (p.stats?.healthScore || 0), 0) / totalProjects) : 0;
    
    return NextResponse.json({
      projects: projectsWithStats,
      count: totalProjects,
      summary: {
        totalProjects,
        activeProjects,
        completedProjects,
        onHoldProjects,
        totalContractValue,
        averageProgress,
        averageHealthScore,
        projectsNeedingAttention: projectsWithStats.filter(p => (p.stats?.healthScore || 0) < 70).length,
        projectsOnSchedule: projectsWithStats.filter(p => (p.stats?.timelineScore || 0) >= 80).length,
        projectsOverBudget: projectsWithStats.filter(p => (p.stats?.budgetScore || 0) < 60).length
      }
    });
  } catch (error: any) {
    console.error('❌ Admin API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to calculate timeline score
function calculateTimelineScore(startDate: string, expectedCompletion: string, actualCompletion?: string): number {
  const start = new Date(startDate);
  const expected = new Date(expectedCompletion);
  const now = new Date();
  const actual = actualCompletion ? new Date(actualCompletion) : null;
  
  if (actual) {
    // Project is completed
    const expectedDuration = expected.getTime() - start.getTime();
    const actualDuration = actual.getTime() - start.getTime();
    const ratio = expectedDuration / actualDuration;
    return Math.min(100, Math.max(0, ratio * 100));
  } else {
    // Project is in progress
    const totalDuration = expected.getTime() - start.getTime();
    const elapsedDuration = now.getTime() - start.getTime();
    const remainingDuration = expected.getTime() - now.getTime();
    
    if (remainingDuration < 0) {
      // Project is overdue
      const overdueBy = Math.abs(remainingDuration);
      const overdueFactor = overdueBy / totalDuration;
      return Math.max(0, 100 - (overdueFactor * 100));
    } else {
      // Project is on time or ahead
      return 100;
    }
  }
}

// Helper function to calculate budget score
function calculateBudgetScore(budgetAmount: number, spentAmount: number): number {
  if (budgetAmount === 0) return 100;
  const spentRatio = spentAmount / budgetAmount;
  
  if (spentRatio <= 1) {
    // Under or on budget
    return 100;
  } else {
    // Over budget
    const overBudgetFactor = spentRatio - 1;
    return Math.max(0, 100 - (overBudgetFactor * 200)); // Penalize over-budget heavily
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('🏗️ Admin API: Creating new project...', body);
    
    const {
      project_name,
      project_address,
      contract_value,
      start_date,
      expected_completion,
      client_id,
      description,
      current_phase = 'Planning',
      status = 'planning'
    } = body;

    // Validate required fields
    if (!project_name || !project_address || !contract_value || !start_date || !expected_completion || !client_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new project
    const { data: newProject, error: createError } = await supabaseAdmin
      .from('projects')
      .insert({
        project_name,
        project_address,
        contract_value,
        start_date,
        expected_completion,
        client_id,
        description,
        current_phase,
        status,
        progress_percentage: 0
      })
      .select(`
        *,
        client:users!projects_client_id_fkey(
          id,
          email,
          full_name,
          phone
        )
      `)
      .single();

    if (createError) {
      console.error('❌ Admin API: Error creating project:', createError);
      return NextResponse.json(
        { error: 'Failed to create project', details: createError.message },
        { status: 500 }
      );
    }

    console.log('✅ Admin API: Successfully created project:', newProject.id);
    
    return NextResponse.json({
      project: newProject,
      message: 'Project created successfully'
    });
  } catch (error: any) {
    console.error('❌ Admin API: Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 