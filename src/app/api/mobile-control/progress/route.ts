import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// 🔧 GET - Fetch progress/milestone data for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const milestoneId = searchParams.get('milestoneId');

    if (!projectId && !milestoneId) {
      return NextResponse.json({ error: 'Project ID or Milestone ID is required' }, { status: 400 });
    }

    console.log('📊 Mobile Progress Control - GET:', { projectId, milestoneId });

    if (milestoneId) {
      // Get specific milestone
      const { data: milestone, error } = await supabaseAdmin
        .from('project_milestones')
        .select('*')
        .eq('id', milestoneId)
        .single();

      if (error) {
        console.error('❌ Error fetching milestone:', error);
        return NextResponse.json({ error: 'Failed to fetch milestone' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: milestone,
      });
    }

    // Get project data with timeline information
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, project_name, start_date, expected_completion, actual_completion, current_phase, progress_percentage, status, project_photo_urls')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('❌ Error fetching project:', projectError);
      return NextResponse.json({ error: 'Failed to fetch project data' }, { status: 500 });
    }

    // Get all milestones for project
    const { data: milestones, error: milestonesError } = await supabaseAdmin
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (milestonesError) {
      console.error('❌ Error fetching milestones:', milestonesError);
      return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
    }

    // Get progress photos for project
    const { data: progressPhotos, error: photosError } = await supabaseAdmin
      .from('project_photos')
      .select('*')
      .eq('project_id', projectId)
      .order('date_taken', { ascending: false });

    if (photosError) {
      console.error('❌ Error fetching progress photos:', photosError);
      return NextResponse.json({ error: 'Failed to fetch progress photos' }, { status: 500 });
    }

    // Calculate days remaining
    const now = new Date();
    const expectedCompletion = new Date(project.expected_completion);
    const daysRemaining = Math.max(0, Math.ceil((expectedCompletion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Calculate milestone statistics
    const milestoneStats = {
      totalMilestones: milestones?.length || 0,
      completedMilestones: milestones?.filter(m => m.status === 'completed').length || 0,
      inProgressMilestones: milestones?.filter(m => m.status === 'in_progress').length || 0,
      notStartedMilestones: milestones?.filter(m => m.status === 'not_started').length || 0,
      delayedMilestones: milestones?.filter(m => m.status === 'delayed').length || 0,
      overallProgress: milestones?.length > 0 
        ? Math.round(milestones.reduce((sum, m) => sum + (m.progress_percentage || 0), 0) / milestones.length)
        : 0,
      totalEstimatedCost: milestones?.reduce((sum, m) => sum + (m.estimated_cost || 0), 0) || 0,
      totalActualCost: milestones?.reduce((sum, m) => sum + (m.actual_cost || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        project: {
          ...project,
          daysRemaining,
        },
        milestones: milestones || [],
        progressPhotos: progressPhotos || [],
        stats: milestoneStats,
      },
    });

  } catch (error) {
    console.error('❌ Error in progress GET API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 🔧 POST - Create/Update/Delete progress data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, projectId, milestoneData, milestoneId, updates, photoData } = body;

    console.log('📊 Mobile Progress Control - POST:', { action, projectId, milestoneId });

    // Handle different actions
    switch (action) {
      case 'create':
        return await createMilestone(projectId, milestoneData);
      case 'update':
        return await updateMilestone(milestoneId, milestoneData);
      case 'updateProgress':
        return await updateMilestoneProgress(milestoneId, updates);
      case 'updateStatus':
        return await updateMilestoneStatus(milestoneId, updates);
      case 'delete':
        return await deleteMilestone(milestoneId);
      case 'reorder':
        return await reorderMilestones(projectId, updates.milestones);
      case 'updateProjectTimeline':
        return await updateProjectTimeline(projectId, updates);
      case 'updateProjectPhase':
        return await updateProjectPhase(projectId, updates);
      case 'updateProjectProgress':
        return await updateProjectProgress(projectId, updates);
      case 'uploadProgressPhoto':
        return await uploadProgressPhoto(projectId, photoData);
      case 'updatePhotoDetails':
        return await updatePhotoDetails(updates.photoId, updates);
      case 'approvePhoto':
        return await approveProgressPhoto(updates.photoId);
      case 'deletePhoto':
        return await deleteProgressPhoto(updates.photoId, updates.reason);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in progress POST API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create new milestone
async function createMilestone(projectId: string, milestoneData: any) {
  console.log('📊 Creating milestone:', { projectId, milestoneData });

  try {
    // Get the next order index
    const { data: existingMilestones, error: countError } = await supabaseAdmin
      .from('project_milestones')
      .select('order_index')
      .eq('project_id', projectId)
      .order('order_index', { ascending: false })
      .limit(1);

    if (countError) {
      console.error('❌ Error counting milestones:', countError);
      return NextResponse.json({ error: 'Failed to get milestone count' }, { status: 500 });
    }

    const nextOrderIndex = (existingMilestones?.[0]?.order_index || 0) + 1;

    // Insert milestone
    const { data: milestone, error } = await supabaseAdmin
      .from('project_milestones')
      .insert({
        project_id: projectId,
        milestone_name: milestoneData.milestone_name,
        description: milestoneData.description || null,
        phase_category: milestoneData.phase_category || 'general',
        planned_start: milestoneData.planned_start || null,
        planned_end: milestoneData.planned_end || null,
        status: milestoneData.status || 'not_started',
        progress_percentage: milestoneData.progress_percentage || 0,
        notes: milestoneData.notes || null,
        order_index: nextOrderIndex,
        estimated_cost: milestoneData.estimated_cost || null,
        actual_cost: milestoneData.actual_cost || null,
        responsible_contractor: milestoneData.responsible_contractor || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating milestone:', error);
      return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
    }

    // Update project milestone stats
    await updateProjectMilestoneStats(projectId);

    console.log('✅ Milestone created:', milestone);
    return NextResponse.json({
      success: true,
      data: milestone,
      message: 'Milestone created successfully',
    });

  } catch (error) {
    console.error('❌ Error in createMilestone:', error);
    return NextResponse.json({ 
      error: 'Failed to create milestone',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update existing milestone
async function updateMilestone(milestoneId: string, milestoneData: any) {
  console.log('📊 Updating milestone:', { milestoneId, milestoneData });

  try {
    const { data: milestone, error } = await supabaseAdmin
      .from('project_milestones')
      .update({
        milestone_name: milestoneData.milestone_name,
        description: milestoneData.description,
        phase_category: milestoneData.phase_category,
        planned_start: milestoneData.planned_start,
        planned_end: milestoneData.planned_end,
        actual_start: milestoneData.actual_start,
        actual_end: milestoneData.actual_end,
        status: milestoneData.status,
        progress_percentage: milestoneData.progress_percentage,
        notes: milestoneData.notes,
        estimated_cost: milestoneData.estimated_cost,
        actual_cost: milestoneData.actual_cost,
        responsible_contractor: milestoneData.responsible_contractor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating milestone:', error);
      return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
    }

    // Update project milestone stats
    if (milestone) {
      await updateProjectMilestoneStats(milestone.project_id);
    }

    console.log('✅ Milestone updated:', milestone);
    return NextResponse.json({
      success: true,
      data: milestone,
      message: 'Milestone updated successfully',
    });

  } catch (error) {
    console.error('❌ Error in updateMilestone:', error);
    return NextResponse.json({ 
      error: 'Failed to update milestone',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update milestone progress only
async function updateMilestoneProgress(milestoneId: string, updates: any) {
  console.log('📊 Updating milestone progress:', { milestoneId, updates });

  try {
    const updateData: any = {
      progress_percentage: updates.progress_percentage,
      updated_at: new Date().toISOString(),
    };

    if (updates.photos) {
      updateData.photos = updates.photos;
    }

    if (updates.notes) {
      updateData.notes = updates.notes;
    }

    const { data: milestone, error } = await supabaseAdmin
      .from('project_milestones')
      .update(updateData)
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating milestone progress:', error);
      return NextResponse.json({ error: 'Failed to update milestone progress' }, { status: 500 });
    }

    // Update project milestone stats
    if (milestone) {
      await updateProjectMilestoneStats(milestone.project_id);
    }

    console.log('✅ Milestone progress updated:', milestone);
    return NextResponse.json({
      success: true,
      data: milestone,
      message: 'Milestone progress updated successfully',
    });

  } catch (error) {
    console.error('❌ Error in updateMilestoneProgress:', error);
    return NextResponse.json({ 
      error: 'Failed to update milestone progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update milestone status with auto-date setting
async function updateMilestoneStatus(milestoneId: string, updates: any) {
  console.log('📊 Updating milestone status:', { milestoneId, updates });

  try {
    const updateData: any = {
      status: updates.status,
      updated_at: new Date().toISOString(),
    };

    // Auto-set dates based on status
    const now = new Date().toISOString();
    if (updates.status === 'in_progress' && !updates.actual_start) {
      updateData.actual_start = now;
    }
    if (updates.status === 'completed') {
      updateData.actual_end = now;
      updateData.progress_percentage = 100;
    }

    if (updates.actual_start) {
      updateData.actual_start = updates.actual_start;
    }
    if (updates.actual_end) {
      updateData.actual_end = updates.actual_end;
    }

    const { data: milestone, error } = await supabaseAdmin
      .from('project_milestones')
      .update(updateData)
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating milestone status:', error);
      return NextResponse.json({ error: 'Failed to update milestone status' }, { status: 500 });
    }

    // Update project milestone stats
    if (milestone) {
      await updateProjectMilestoneStats(milestone.project_id);
    }

    console.log('✅ Milestone status updated:', milestone);
    return NextResponse.json({
      success: true,
      data: milestone,
      message: 'Milestone status updated successfully',
    });

  } catch (error) {
    console.error('❌ Error in updateMilestoneStatus:', error);
    return NextResponse.json({ 
      error: 'Failed to update milestone status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete milestone
async function deleteMilestone(milestoneId: string) {
  console.log('📊 Deleting milestone:', { milestoneId });

  try {
    // Get the milestone to know which project to update
    const { data: milestone, error: fetchError } = await supabaseAdmin
      .from('project_milestones')
      .select('project_id')
      .eq('id', milestoneId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching milestone for deletion:', fetchError);
      return NextResponse.json({ error: 'Failed to find milestone' }, { status: 500 });
    }

    // Delete the milestone
    const { error } = await supabaseAdmin
      .from('project_milestones')
      .delete()
      .eq('id', milestoneId);

    if (error) {
      console.error('❌ Error deleting milestone:', error);
      return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
    }

    // Update project milestone stats
    if (milestone) {
      await updateProjectMilestoneStats(milestone.project_id);
    }

    console.log('✅ Milestone deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'Milestone deleted successfully',
    });

  } catch (error) {
    console.error('❌ Error in deleteMilestone:', error);
    return NextResponse.json({ 
      error: 'Failed to delete milestone',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Reorder milestones
async function reorderMilestones(projectId: string, milestones: Array<{ id: string; order_index: number }>) {
  console.log('📊 Reordering milestones:', { projectId, milestones });

  try {
    // Update each milestone's order_index
    for (const milestone of milestones) {
      const { error } = await supabaseAdmin
        .from('project_milestones')
        .update({ 
          order_index: milestone.order_index,
          updated_at: new Date().toISOString() 
        })
        .eq('id', milestone.id);

      if (error) {
        console.error(`❌ Error updating milestone ${milestone.id} order:`, error);
        return NextResponse.json({ error: `Failed to update milestone ${milestone.id} order` }, { status: 500 });
      }
    }

    console.log('✅ Milestones reordered successfully');
    return NextResponse.json({
      success: true,
      message: 'Milestones reordered successfully',
    });

  } catch (error) {
    console.error('❌ Error in reorderMilestones:', error);
    return NextResponse.json({ 
      error: 'Failed to reorder milestones',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update project timeline (start/end dates)
async function updateProjectTimeline(projectId: string, updates: any) {
  console.log('📊 Updating project timeline:', { projectId, updates });

  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.start_date) {
      updateData.start_date = updates.start_date;
    }
    if (updates.expected_completion) {
      updateData.expected_completion = updates.expected_completion;
    }
    if (updates.actual_completion) {
      updateData.actual_completion = updates.actual_completion;
    }

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating project timeline:', error);
      return NextResponse.json({ error: 'Failed to update project timeline' }, { status: 500 });
    }

    console.log('✅ Project timeline updated:', project);
    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project timeline updated successfully',
    });

  } catch (error) {
    console.error('❌ Error in updateProjectTimeline:', error);
    return NextResponse.json({ 
      error: 'Failed to update project timeline',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update project phase
async function updateProjectPhase(projectId: string, updates: any) {
  console.log('📊 Updating project phase:', { projectId, updates });

  try {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .update({
        current_phase: updates.current_phase,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating project phase:', error);
      return NextResponse.json({ error: 'Failed to update project phase' }, { status: 500 });
    }

    console.log('✅ Project phase updated:', project);
    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project phase updated successfully',
    });

  } catch (error) {
    console.error('❌ Error in updateProjectPhase:', error);
    return NextResponse.json({ 
      error: 'Failed to update project phase',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update project progress percentage
async function updateProjectProgress(projectId: string, updates: any) {
  console.log('📊 Updating project progress:', { projectId, updates });

  try {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .update({
        progress_percentage: updates.progress_percentage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating project progress:', error);
      return NextResponse.json({ error: 'Failed to update project progress' }, { status: 500 });
    }

    console.log('✅ Project progress updated:', project);
    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project progress updated successfully',
    });

  } catch (error) {
    console.error('❌ Error in updateProjectProgress:', error);
    return NextResponse.json({ 
      error: 'Failed to update project progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Upload progress photo
async function uploadProgressPhoto(projectId: string, photoData: any) {
  console.log('📊 Uploading progress photo:', { projectId, photoData });

  try {
    const { data: photo, error } = await supabaseAdmin
      .from('project_photos')
      .insert({
        project_id: projectId,
        milestone_id: photoData.milestone_id || null,
        photo_url: photoData.photo_url,
        photo_title: photoData.photo_title || null,
        description: photoData.description || null,
        phase_category: photoData.phase_category || 'general',
        photo_type: photoData.photo_type || 'progress',
        date_taken: photoData.date_taken || new Date().toISOString(),
        uploaded_by: photoData.uploaded_by || null,
        processing_status: 'pending_approval',
        is_featured: false,
        likes_count: 0,
        views_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error uploading progress photo:', error);
      return NextResponse.json({ error: 'Failed to upload progress photo' }, { status: 500 });
    }

    console.log('✅ Progress photo uploaded:', photo);
    return NextResponse.json({
      success: true,
      data: photo,
      message: 'Progress photo uploaded successfully',
    });

  } catch (error) {
    console.error('❌ Error in uploadProgressPhoto:', error);
    return NextResponse.json({ 
      error: 'Failed to upload progress photo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update photo details
async function updatePhotoDetails(photoId: string, updates: any) {
  console.log('📊 Updating photo details:', { photoId, updates });

  try {
    const { data: photo, error } = await supabaseAdmin
      .from('project_photos')
      .update({
        photo_title: updates.photo_title,
        description: updates.description,
        phase_category: updates.phase_category,
        tags: updates.tags,
        is_featured: updates.is_featured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', photoId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating photo details:', error);
      return NextResponse.json({ error: 'Failed to update photo details' }, { status: 500 });
    }

    console.log('✅ Photo details updated:', photo);
    return NextResponse.json({
      success: true,
      data: photo,
      message: 'Photo details updated successfully',
    });

  } catch (error) {
    console.error('❌ Error in updatePhotoDetails:', error);
    return NextResponse.json({ 
      error: 'Failed to update photo details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Approve progress photo
async function approveProgressPhoto(photoId: string) {
  console.log('📊 Approving progress photo:', { photoId });

  try {
    const { data: photo, error } = await supabaseAdmin
      .from('project_photos')
      .update({
        processing_status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', photoId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error approving progress photo:', error);
      return NextResponse.json({ error: 'Failed to approve progress photo' }, { status: 500 });
    }

    console.log('✅ Progress photo approved:', photo);
    return NextResponse.json({
      success: true,
      data: photo,
      message: 'Progress photo approved successfully',
    });

  } catch (error) {
    console.error('❌ Error in approveProgressPhoto:', error);
    return NextResponse.json({ 
      error: 'Failed to approve progress photo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete progress photo
async function deleteProgressPhoto(photoId: string, reason: string) {
  console.log('📊 Deleting progress photo:', { photoId, reason });

  try {
    const { error } = await supabaseAdmin
      .from('project_photos')
      .delete()
      .eq('id', photoId);

    if (error) {
      console.error('❌ Error deleting progress photo:', error);
      return NextResponse.json({ error: 'Failed to delete progress photo' }, { status: 500 });
    }

    console.log('✅ Progress photo deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'Progress photo deleted successfully',
    });

  } catch (error) {
    console.error('❌ Error in deleteProgressPhoto:', error);
    return NextResponse.json({ 
      error: 'Failed to delete progress photo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update project milestone statistics
async function updateProjectMilestoneStats(projectId: string) {
  try {
    console.log('📊 Updating project milestone stats for:', projectId);

    // Get all milestones for the project
    const { data: milestones, error } = await supabaseAdmin
      .from('project_milestones')
      .select('status, progress_percentage')
      .eq('project_id', projectId);

    if (error) {
      console.error('❌ Error fetching milestones for stats update:', error);
      return;
    }

    const totalMilestones = milestones?.length || 0;
    const completedMilestones = milestones?.filter(m => m.status === 'completed').length || 0;

    // Update project with milestone statistics
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        total_milestones: totalMilestones,
        completed_milestones: completedMilestones,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('❌ Error updating project milestone stats:', updateError);
    } else {
      console.log('✅ Project milestone stats updated successfully');
    }

  } catch (error) {
    console.error('❌ Error in updateProjectMilestoneStats:', error);
  }
} 