import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ProjectMilestone, ProjectPhoto } from '@/types/database';

// Types for mobile app progress data control
interface MobileProgressData {
  currentStage: string;
  completionPercentage: number;
  daysLeft: number;
  milestoneStatus: {
    completed: number;
    inProgress: number;
    notStarted: number;
  };
}

interface MobileTimelineData {
  startDate: string;
  endDate: string;
  currentPhase: string;
  phaseDuration: number;
}

interface MobileMilestoneData {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'not_started';
  progressPercentage: number;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
}

interface MobilePhotoData {
  id: string;
  url: string;
  title: string;
  description: string;
  phaseCategory: string;
  photoType: string;
  dateTaken: string;
  uploadedBy: string;
  gpsCoordinates?: string;
  tags: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get project basic info
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get milestones
    const { data: milestones, error: milestonesError } = await supabaseAdmin
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index');

    if (milestonesError) {
      throw milestonesError;
    }

    // Get progress photos
    const { data: photos, error: photosError } = await supabaseAdmin
      .from('project_photos')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (photosError) {
      throw photosError;
    }

    // Calculate days left
    const endDate = new Date(project.expected_completion);
    const today = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate milestone status
    const milestoneStatus = {
      completed: milestones?.filter((m: ProjectMilestone) => m.status === 'completed').length || 0,
      inProgress: milestones?.filter((m: ProjectMilestone) => m.status === 'in_progress').length || 0,
      notStarted: milestones?.filter((m: ProjectMilestone) => m.status === 'not_started').length || 0,
    };

    // Prepare mobile progress data
    const mobileProgressData: MobileProgressData = {
      currentStage: project.current_phase || 'Planning',
      completionPercentage: project.progress_percentage || 0,
      daysLeft: daysLeft,
      milestoneStatus,
    };

    // Prepare mobile timeline data
    const mobileTimelineData: MobileTimelineData = {
      startDate: project.start_date,
      endDate: project.expected_completion,
      currentPhase: project.current_phase || 'Planning',
      phaseDuration: Math.ceil((endDate.getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24)),
    };

    // Prepare mobile milestone data
    const mobileMilestoneData: MobileMilestoneData[] = milestones?.map((milestone: ProjectMilestone) => {
      // Map database status to mobile app status
      let mobileStatus: 'completed' | 'in_progress' | 'not_started';
      switch (milestone.status) {
        case 'completed':
          mobileStatus = 'completed';
          break;
        case 'in_progress':
        case 'delayed': // Map delayed to in_progress for mobile app
          mobileStatus = 'in_progress';
          break;
        case 'not_started':
        case 'on_hold': // Map on_hold to not_started for mobile app
        default:
          mobileStatus = 'not_started';
          break;
      }
      
      return {
        id: milestone.id,
        name: milestone.milestone_name,
        status: mobileStatus,
        progressPercentage: milestone.progress_percentage || 0,
        plannedStart: milestone.planned_start || '',
        plannedEnd: milestone.planned_end || '',
        actualStart: milestone.actual_start || undefined,
        actualEnd: milestone.actual_end || undefined,
      };
    }) || [];

    // Prepare mobile photo data
    const mobilePhotoData: MobilePhotoData[] = photos?.map((photo: ProjectPhoto) => ({
      id: photo.id,
      url: photo.photo_url,
      title: photo.photo_title || '',
      description: photo.description || '',
      phaseCategory: photo.phase_category,
      photoType: photo.photo_type,
      dateTaken: photo.date_taken,
      uploadedBy: photo.uploaded_by || '',
      gpsCoordinates: photo.gps_coordinates || undefined,
      tags: photo.tags || [],
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        progress: mobileProgressData,
        timeline: mobileTimelineData,
        milestones: mobileMilestoneData,
        photos: mobilePhotoData,
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error fetching mobile progress data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mobile progress data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, updateType, data } = body;

    if (!projectId || !updateType || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result;

    switch (updateType) {
      case 'progress':
        // Update project progress
        const { data: projectUpdate, error: projectError } = await supabaseAdmin
          .from('projects')
          .update({
            progress_percentage: data.completionPercentage,
            current_phase: data.currentStage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId)
          .select()
          .single();

        if (projectError) throw projectError;
        result = projectUpdate;
        break;

      case 'timeline':
        // Update project timeline
        const { data: timelineUpdate, error: timelineError } = await supabaseAdmin
          .from('projects')
          .update({
            start_date: data.startDate,
            expected_completion: data.endDate,
            current_phase: data.currentPhase,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId)
          .select()
          .single();

        if (timelineError) throw timelineError;
        result = timelineUpdate;
        break;

      case 'milestone':
        // Update milestone status
        const { data: milestoneUpdate, error: milestoneError } = await supabaseAdmin
          .from('project_milestones')
          .update({
            status: data.status,
            progress_percentage: data.progressPercentage,
            actual_start: data.actualStart,
            actual_end: data.actualEnd,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.milestoneId)
          .eq('project_id', projectId)
          .select()
          .single();

        if (milestoneError) throw milestoneError;
        result = milestoneUpdate;
        break;

      case 'photo':
        // Update photo information
        const { data: photoUpdate, error: photoError } = await supabaseAdmin
          .from('project_photos')
          .update({
            photo_title: data.title,
            description: data.description,
            phase_category: data.phaseCategory,
            photo_type: data.photoType,
            tags: data.tags,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.photoId)
          .eq('project_id', projectId)
          .select()
          .single();

        if (photoError) throw photoError;
        result = photoUpdate;
        break;

      default:
        return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
    }

    // Log the admin action for audit trail
    const { error: logError } = await supabaseAdmin
      .from('project_updates')
      .insert({
        project_id: projectId,
        update_type: 'admin_mobile_control',
        title: `Admin updated ${updateType} for mobile app`,
        description: `Updated ${updateType} data for mobile app synchronization`,
        metadata: {
          updateType,
          originalData: data,
          timestamp: new Date().toISOString(),
        },
        created_by: 'admin', // TODO: Replace with actual admin user ID
      });

    if (logError) {
      console.error('Error logging admin action:', logError);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `${updateType} updated successfully`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error updating mobile progress data:', error);
    return NextResponse.json(
      { error: 'Failed to update mobile progress data' },
      { status: 500 }
    );
  }
} 