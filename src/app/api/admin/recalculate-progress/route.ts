import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// 🚀 Bulk Progress Recalculation API
// Recalculates progress for all projects based on milestone data
// Works without custom database functions

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
        completed_milestones,
        project_milestones(
          id,
          status,
          progress_percentage
        )
      `);

    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch projects',
        details: projectsError.message
      }, { status: 500 });
    }

    const results = [];
    let updatedCount = 0;
    let errorCount = 0;

    // Process each project
    for (const project of projects || []) {
      try {
        const milestones = project.project_milestones || [];
        const milestoneCount = milestones.length;
        const completedCount = milestones.filter(m => m.status === 'completed').length;
        
        // Calculate new progress
        const calculatedProgress = milestoneCount > 0 
          ? Math.round(milestones.reduce((sum, m) => sum + (m.progress_percentage || 0), 0) / milestoneCount)
          : 0;

        // Check if update is needed
        const needsUpdate = 
          project.progress_percentage !== calculatedProgress ||
          project.total_milestones !== milestoneCount ||
          project.completed_milestones !== completedCount;

        if (needsUpdate) {
          console.log(`🔄 Updating ${project.project_name}: ${project.progress_percentage}% → ${calculatedProgress}%`);
          
          // 🔧 SAFER UPDATE: Try multiple approaches to handle trigger issues
          let updateSuccess = false;
          let updateError = null;
          
          // Approach 1: Standard update
          try {
            const { error: standardError } = await supabaseAdmin
              .from('projects')
              .update({
                progress_percentage: calculatedProgress,
                total_milestones: milestoneCount,
                completed_milestones: completedCount,
                updated_at: new Date().toISOString()
              })
              .eq('id', project.id);

            if (standardError) {
              throw standardError;
            }
            updateSuccess = true;
            console.log(`✅ Standard update successful for ${project.project_name}`);
            
          } catch (error) {
            console.log(`⚠️ Standard update failed for ${project.project_name}:`, error.message);
            updateError = error;
            
            // Approach 2: Individual field updates to bypass triggers
            try {
              console.log(`🔄 Trying individual field updates for ${project.project_name}...`);
              
              // Update progress percentage only
              const { error: progressError } = await supabaseAdmin
                .from('projects')
                .update({ progress_percentage: calculatedProgress })
                .eq('id', project.id);
              
              if (!progressError) {
                // Update milestone counts separately
                const { error: statsError } = await supabaseAdmin
                  .from('projects')
                  .update({ 
                    total_milestones: milestoneCount,
                    completed_milestones: completedCount,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', project.id);
                
                if (!statsError) {
                  updateSuccess = true;
                  console.log(`✅ Individual field updates successful for ${project.project_name}`);
                } else {
                  throw new Error(`Stats update failed: ${statsError.message}`);
                }
              } else {
                throw new Error(`Progress update failed: ${progressError.message}`);
              }
              
            } catch (individualError) {
              console.log(`❌ Individual updates also failed for ${project.project_name}:`, individualError.message);
              updateError = individualError;
              
              // Approach 3: Stats-only update (skip progress percentage)
              try {
                console.log(`🔄 Trying stats-only update for ${project.project_name}...`);
                
                const { error: statsOnlyError } = await supabaseAdmin
                  .from('projects')
                  .update({ 
                    total_milestones: milestoneCount,
                    completed_milestones: completedCount,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', project.id);
                
                if (!statsOnlyError) {
                  updateSuccess = true;
                  console.log(`✅ Stats-only update successful for ${project.project_name} (progress skipped)`);
                  
                  results.push({
                    projectId: project.id,
                    projectName: project.project_name,
                    oldProgress: project.progress_percentage,
                    newProgress: calculatedProgress,
                    savedProgress: project.progress_percentage, // Progress not saved
                    milestoneCount,
                    completedCount,
                    progressChange: 0, // No progress change saved
                    status: 'partial_update',
                    warning: 'Progress percentage could not be updated due to database constraints'
                  });
                } else {
                  throw new Error(`Stats-only update failed: ${statsOnlyError.message}`);
                }
                
              } catch (statsError) {
                console.log(`❌ All update approaches failed for ${project.project_name}`);
                updateError = statsError;
              }
            }
          }

          if (updateSuccess && !results.find(r => r.projectId === project.id)) {
            updatedCount++;
            results.push({
              projectId: project.id,
              projectName: project.project_name,
              oldProgress: project.progress_percentage,
              newProgress: calculatedProgress,
              milestoneCount,
              completedCount,
              progressChange: calculatedProgress - project.progress_percentage,
              status: 'updated'
            });
          } else if (!updateSuccess) {
            errorCount++;
            results.push({
              projectId: project.id,
              projectName: project.project_name,
              oldProgress: project.progress_percentage,
              newProgress: calculatedProgress,
              milestoneCount,
              completedCount,
              status: 'failed',
              error: updateError?.message || 'Unknown error'
            });
          }
        } else {
          results.push({
            projectId: project.id,
            projectName: project.project_name,
            oldProgress: project.progress_percentage,
            newProgress: calculatedProgress,
            milestoneCount,
            completedCount,
            status: 'no_change'
          });
        }

      } catch (projectError) {
        console.error(`❌ Error processing project ${project.project_name}:`, projectError);
        errorCount++;
        results.push({
          projectId: project.id,
          projectName: project.project_name,
          status: 'error',
          error: projectError instanceof Error ? projectError.message : 'Unknown error'
        });
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Bulk recalculation completed in ${duration}ms`);
    console.log(`📊 Results: ${updatedCount} updated, ${errorCount} errors, ${results.length - updatedCount - errorCount} no change`);

    // Calculate statistics
    const successfulResults = results.filter(r => r.status === 'updated');
    const stats = {
      totalProjectsProcessed: results.length,
      totalProjectsUpdated: updatedCount,
      totalErrors: errorCount,
      executionTimeMs: duration,
      averageProgressBefore: successfulResults.length > 0 
        ? Math.round(successfulResults.reduce((sum, r) => sum + (r.oldProgress || 0), 0) / successfulResults.length)
        : 0,
      averageProgressAfter: successfulResults.length > 0
        ? Math.round(successfulResults.reduce((sum, r) => sum + (r.newProgress || 0), 0) / successfulResults.length)
        : 0,
      projectsWithMilestones: results.filter(r => r.milestoneCount > 0).length,
      projectsCompleted: results.filter(r => r.newProgress === 100).length,
      projectsInProgress: results.filter(r => r.newProgress > 0 && r.newProgress < 100).length,
      projectsNotStarted: results.filter(r => r.newProgress === 0).length
    };

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${stats.totalProjectsProcessed} projects. ${updatedCount} updated, ${errorCount} errors.`,
      stats,
      results: results
    });

  } catch (error) {
    console.error('❌ Error in bulk progress recalculation:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during bulk recalculation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get status of current progress calculations
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Getting bulk recalculation status...');

    // Get summary of all projects and their progress status
    const { data: analysis, error } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        project_name,
        progress_percentage,
        total_milestones,
        completed_milestones,
        status,
        updated_at,
        project_milestones(
          id,
          status,
          progress_percentage
        )
      `);

    if (error) {
      console.error('❌ Error getting project analysis:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to analyze projects',
        details: error.message
      }, { status: 500 });
    }

    // Analyze which projects need updates
    const projectsNeedingUpdate = [];
    const summary = {
      totalProjects: analysis?.length || 0,
      projectsWithMilestones: 0,
      projectsWithoutMilestones: 0,
      projectsNeedingUpdate: 0,
      averageProgress: 0,
      progressDistribution: {
        notStarted: 0,    // 0%
        justStarted: 0,   // 1-25%
        inProgress: 0,    // 26-75%
        nearComplete: 0,  // 76-99%
        completed: 0      // 100%
      }
    };

    let totalProgress = 0;

    analysis?.forEach(project => {
      const milestones = project.project_milestones || [];
      const milestoneCount = milestones.length;
      const completedCount = milestones.filter(m => m.status === 'completed').length;
      const calculatedProgress = milestoneCount > 0 
        ? Math.round(milestones.reduce((sum, m) => sum + (m.progress_percentage || 0), 0) / milestoneCount)
        : 0;

      // Check if project needs update
      const needsUpdate = 
        project.progress_percentage !== calculatedProgress ||
        project.total_milestones !== milestoneCount ||
        project.completed_milestones !== completedCount;

      if (needsUpdate) {
        summary.projectsNeedingUpdate++;
        projectsNeedingUpdate.push({
          id: project.id,
          name: project.project_name,
          currentProgress: project.progress_percentage,
          calculatedProgress,
          currentMilestones: project.total_milestones,
          actualMilestones: milestoneCount,
          currentCompleted: project.completed_milestones,
          actualCompleted: completedCount
        });
      }

      // Update summary stats
      if (milestoneCount > 0) {
        summary.projectsWithMilestones++;
      } else {
        summary.projectsWithoutMilestones++;
      }

      totalProgress += project.progress_percentage || 0;

      // Progress distribution
      const progress = project.progress_percentage || 0;
      if (progress === 0) summary.progressDistribution.notStarted++;
      else if (progress <= 25) summary.progressDistribution.justStarted++;
      else if (progress <= 75) summary.progressDistribution.inProgress++;
      else if (progress < 100) summary.progressDistribution.nearComplete++;
      else summary.progressDistribution.completed++;
    });

    summary.averageProgress = summary.totalProjects > 0 
      ? Math.round(totalProgress / summary.totalProjects)
      : 0;

    return NextResponse.json({
      success: true,
      summary,
      projectsNeedingUpdate: projectsNeedingUpdate.slice(0, 20), // Limit to first 20 for response size
      hasMoreProjectsNeedingUpdate: projectsNeedingUpdate.length > 20
    });

  } catch (error) {
    console.error('❌ Error getting recalculation status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get recalculation status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 