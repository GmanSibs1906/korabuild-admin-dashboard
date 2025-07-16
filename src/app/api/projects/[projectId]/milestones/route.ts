import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // Fetch milestones for the project
    const { data: milestones, error } = await supabase
      .from('project_milestones')
      .select(`
        id,
        milestone_name,
        description,
        phase_category,
        planned_start,
        planned_end,
        actual_start,
        actual_end,
        status,
        progress_percentage,
        order_index,
        estimated_cost,
        actual_cost,
        responsible_contractor
      `)
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching milestones:', error);
      return NextResponse.json(
        { error: 'Failed to fetch milestones' },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${(milestones || []).length} milestones for project ${projectId}`);

    return NextResponse.json({
      success: true,
      data: milestones || []
    });

  } catch (error) {
    console.error('Error in GET /api/projects/[projectId]/milestones:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 