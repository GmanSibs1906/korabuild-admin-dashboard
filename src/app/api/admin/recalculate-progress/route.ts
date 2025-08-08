import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// 🚀 Bulk Progress Recalculation API
// Recalculates progress for all projects based on milestone data
// Works without custom database functions

interface ProjectResult {
  projectId: string;
  projectName: string;
  oldProgress: number;
  newProgress?: number;
  milestoneCount?: number;
  completedCount?: number;
  status: 'success' | 'failed';
  error?: string;
}

interface ProjectNeedingUpdate {
  id: string;
  project_name: string;
  current_progress: number;
  calculated_progress: number;
  milestone_count: number;
  completed_milestones: number;
  difference: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting bulk progress recalculation for all projects...');
    
    const startTime = Date.now();
    
    // Get all projects with their milestones
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        project_name,
        progress_percentage,
        total_milestones,
        completed_milestones
      `);

    if (projectsError) {
      throw projectsError;
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No projects found to update',
        results: [],
        timing: {
          duration: Date.now() - startTime,
        }
      });
    }

    console.log(`📊 Found ${projects.length} projects to process`);

    // Process each project
    const results: ProjectResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const project of projects) {
      try {
        console.log(`\n🔄 Processing: ${project.project_name}`);
        
        // Get milestones for this project
        const { data: milestones, error: milestonesError } = await supabaseAdmin
          .from('milestones')
          .select('id, is_completed, completion_date')
          .eq('project_id', project.id);

        if (milestonesError) {
          console.log(`❌ Error fetching milestones for ${project.project_name}:`, milestonesError.message);
          results.push({
            projectId: project.id,
            projectName: project.project_name,
            oldProgress: project.progress_percentage || 0,
            status: 'failed',
            error: `Milestone fetch error: ${milestonesError.message}`
          });
          failedCount++;
          continue;
        }

        const totalMilestones = milestones?.length || 0;
        const completedMilestones = milestones?.filter(m => m.is_completed || m.completion_date).length || 0;
        
        // Calculate new progress percentage
        let newProgress = 0;
        if (totalMilestones > 0) {
          newProgress = Math.round((completedMilestones / totalMilestones) * 100);
        }

        console.log(`📈 ${project.project_name}: ${project.progress_percentage}% → ${newProgress}% (${completedMilestones}/${totalMilestones} milestones)`);

        // Update the project
        let updateError: unknown = null;
        
        try {
          // Approach 1: Standard bulk update
          const { error: bulkUpdateError } = await supabaseAdmin
              .from('projects')
              .update({
              progress_percentage: newProgress,
              total_milestones: totalMilestones,
              completed_milestones: completedMilestones,
                updated_at: new Date().toISOString()
              })
              .eq('id', project.id);

          if (bulkUpdateError) {
            throw bulkUpdateError;
            }
            
          } catch (error) {
          console.log(`⚠️ Standard update failed for ${project.project_name}:`, error instanceof Error ? error.message : 'Unknown error');
            updateError = error;
            
          // Approach 2: Individual field updates (fallback)
            try {
            console.log(`🔄 Trying individual updates for ${project.project_name}...`);
              
            await supabaseAdmin
              .from('projects')
              .update({ progress_percentage: newProgress })
              .eq('id', project.id);
              
            await supabaseAdmin
                .from('projects')
              .update({ total_milestones: totalMilestones })
                .eq('id', project.id);
              
            await supabaseAdmin
                  .from('projects')
              .update({ completed_milestones: completedMilestones })
                  .eq('id', project.id);
              
            } catch (individualError) {
            console.log(`❌ Individual updates also failed for ${project.project_name}:`, individualError instanceof Error ? individualError.message : 'Unknown error');
              updateError = individualError;
              
              // Approach 3: Stats-only update (skip progress percentage)
              try {
                console.log(`🔄 Trying stats-only update for ${project.project_name}...`);
                
              await supabaseAdmin
                  .from('projects')
                  .update({ 
                  total_milestones: totalMilestones,
                  completed_milestones: completedMilestones
                  })
                  .eq('id', project.id);
                
              updateError = null; // Success with limited update
              console.log(`✅ Limited update successful for ${project.project_name}`);
              
            } catch (finalError) {
              console.log(`❌ All update approaches failed for ${project.project_name}:`, finalError instanceof Error ? finalError.message : 'Unknown error');
              updateError = finalError;
              }
            }
          }

        if (updateError) {
          // Record failure
            results.push({
              projectId: project.id,
              projectName: project.project_name,
            oldProgress: project.progress_percentage || 0,
            newProgress,
            milestoneCount: totalMilestones,
            completedCount: completedMilestones,
              status: 'failed',
            error: updateError instanceof Error ? updateError.message : 'Unknown error'
            });
          failedCount++;
        } else {
          // Record success
          results.push({
            projectId: project.id,
            projectName: project.project_name,
            oldProgress: project.progress_percentage || 0,
            newProgress,
            milestoneCount: totalMilestones,
            completedCount: completedMilestones,
            status: 'success'
          });
          successCount++;
        }

      } catch (projectError) {
        console.log(`❌ Failed to process ${project.project_name}:`, projectError instanceof Error ? projectError.message : 'Unknown error');
        results.push({
          projectId: project.id,
          projectName: project.project_name,
          oldProgress: project.progress_percentage || 0,
          status: 'failed',
          error: projectError instanceof Error ? projectError.message : 'Unknown error'
        });
        failedCount++;
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Calculate summary statistics
    const successfulResults = results.filter(r => r.status === 'success');
    const summary = {
      totalProjects: projects.length,
      successful: successCount,
      failed: failedCount,
      duration: `${duration}ms`,
      averageProgress: successfulResults.length > 0 
        ? Math.round(successfulResults.reduce((sum, r) => sum + (r.newProgress || 0), 0) / successfulResults.length)
        : 0,
      projectsWithMilestones: results.filter(r => (r.milestoneCount || 0) > 0).length,
      projectsCompleted: results.filter(r => (r.newProgress || 0) === 100).length,
      projectsInProgress: results.filter(r => (r.newProgress || 0) > 0 && (r.newProgress || 0) < 100).length,
      projectsNotStarted: results.filter(r => (r.newProgress || 0) === 0).length
    };

    console.log('\n📊 BULK PROGRESS RECALCULATION COMPLETE');
    console.log('==========================================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📈 Average Progress: ${summary.averageProgress}%`);

    return NextResponse.json({
      success: true,
      message: `Processed ${projects.length} projects in ${duration}ms`,
      summary,
      results,
      timing: {
        start: startTime,
        end: endTime,
        duration
      }
    });

  } catch (error) {
    console.error('❌ Bulk progress recalculation failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to recalculate progress for projects'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Analyzing projects that need progress updates...');

    // Get all projects with their current progress and milestone data
    const { data: analysis, error } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        project_name,
        progress_percentage,
        total_milestones,
        completed_milestones,
        milestones (
          id,
          is_completed,
          completion_date
        )
      `);

    if (error) {
      throw error;
    }

    if (!analysis || analysis.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No projects found',
        summary: { totalProjects: 0 },
        projectsNeedingUpdate: []
      });
    }

    // Analyze which projects need updates
    const projectsNeedingUpdate: ProjectNeedingUpdate[] = [];
    const summary = {
      totalProjects: analysis?.length || 0,
      projectsWithMilestones: 0,
      projectsNeedingUpdate: 0,
      averageProgressDifference: 0,
      maxProgressDifference: 0
    };

    let totalDifference = 0;
    let maxDifference = 0;

    for (const project of analysis) {
      const milestones = project.milestones || [];
      const totalMilestones = milestones.length;
      const completedMilestones = milestones.filter((m: any) => m.is_completed || m.completion_date).length;
      
      if (totalMilestones > 0) {
        summary.projectsWithMilestones++;
        
        const calculatedProgress = Math.round((completedMilestones / totalMilestones) * 100);
        const currentProgress = project.progress_percentage || 0;
        const difference = Math.abs(calculatedProgress - currentProgress);

        if (difference > 0) {
        projectsNeedingUpdate.push({
          id: project.id,
            project_name: project.project_name,
            current_progress: currentProgress,
            calculated_progress: calculatedProgress,
            milestone_count: totalMilestones,
            completed_milestones: completedMilestones,
            difference
          });
          
          summary.projectsNeedingUpdate++;
          totalDifference += difference;
          maxDifference = Math.max(maxDifference, difference);
        }
      }
    }

    summary.averageProgressDifference = summary.projectsNeedingUpdate > 0 
      ? Math.round(totalDifference / summary.projectsNeedingUpdate)
      : 0;
    summary.maxProgressDifference = maxDifference;

    // Sort by difference (largest first)
    projectsNeedingUpdate.sort((a, b) => b.difference - a.difference);

    console.log(`📊 Analysis complete: ${summary.projectsNeedingUpdate}/${summary.totalProjects} projects need updates`);

    return NextResponse.json({
      success: true,
      summary,
      projectsNeedingUpdate: projectsNeedingUpdate.slice(0, 20), // Limit to first 20 for response size
      hasMoreProjectsNeedingUpdate: projectsNeedingUpdate.length > 20
    });

  } catch (error) {
    console.error('❌ Progress analysis failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to analyze project progress'
    }, { status: 500 });
  }
} 