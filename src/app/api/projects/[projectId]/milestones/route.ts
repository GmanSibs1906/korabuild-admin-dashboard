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
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    console.log('🎯 Fetching project milestones:', { projectId });

    // Get project milestones ordered by order_index
    const { data: milestones, error } = await supabaseAdmin
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
        estimated_cost,
        actual_cost,
        order_index,
        responsible_contractor,
        created_at,
        updated_at
      `)
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Error fetching milestones:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch milestones' },
        { status: 500 }
      );
    }

    console.log('✅ Successfully fetched milestones:', milestones?.length || 0);

    return NextResponse.json({
      success: true,
      data: milestones || [],
    });
  } catch (error) {
    console.error('❌ Error in milestones API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 