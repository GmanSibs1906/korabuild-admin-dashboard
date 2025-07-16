import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET handler - fetch schedule data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId'); // Optional user filter
    
    const supabase = supabaseAdmin;

    if (projectId) {
      // Fetch specific project's mobile app data
      console.log('📱 Fetching mobile app data for project:', projectId);
      
      // First verify the project exists and get user context
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          id,
          project_name,
          client_id,
          status,
          current_phase,
          progress_percentage,
          start_date,
          expected_completion,
          client:users!projects_client_id_fkey(
            id,
            email,
            full_name,
            role
          )
        `)
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        console.error('❌ Project not found:', projectId, projectError?.message);
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }

      console.log('✅ Project found:', project.project_name, 'for client:', (project.client as any)?.full_name);

      // **MOBILE APP DATA STRUCTURE** - Fetch data exactly how mobile app gets it
      
      // 1. Fetch schedule phases → Phase start/end markers (what mobile app sees)
      const { data: phases, error: phasesError } = await supabase
        .from('schedule_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('phase_order', { ascending: true });

      if (phasesError) {
        console.error('Error fetching schedule phases:', phasesError);
      }

      // 2. Fetch schedule tasks → Individual task items (what mobile app sees)
      const { data: tasks, error: tasksError } = await supabase
        .from('schedule_tasks')
        .select(`
          *,
          schedule_phases:phase_id (
            phase_name,
            phase_category
          ),
          crew_members:assigned_crew_id (
            crew_name,
            crew_type
          )
        `)
        .eq('project_id', projectId)
        .order('planned_start_date', { ascending: true });

      if (tasksError) {
        console.error('Error fetching schedule tasks:', tasksError);
      }

      // 3. Fetch project milestones → Legacy milestones (what mobile app shows)
      const { data: milestones, error: milestonesError } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (milestonesError) {
        console.error('Error fetching project milestones:', milestonesError);
      }

      // 4. Fetch calendar events → Events and meetings (what mobile app shows)
      const { data: calendarEvents, error: calendarError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('project_id', projectId)
        .order('start_datetime', { ascending: true });

      if (calendarError) {
        console.error('Error fetching calendar events:', calendarError);
      }

      // 5. Fetch crew members → Team assignments (what mobile app shows)
      const { data: crewMembers, error: crewError } = await supabase
        .from('crew_members')
        .select('*')
        .eq('project_id', projectId)
        .order('crew_name', { ascending: true });

      if (crewError) {
        console.error('Error fetching crew members:', crewError);
      }

      // **🚨 CRITICAL: DAILY UPDATES DATA - What users actually upload** 
      
      // 6. Fetch project updates → Daily site updates and progress logs
      const { data: projectUpdates, error: updatesError } = await supabase
        .from('project_updates')
        .select(`
          *,
          created_by_user:created_by (
            full_name,
            email
          ),
          milestone:milestone_id (
            milestone_name,
            phase_category
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (updatesError) {
        console.error('Error fetching project updates:', updatesError);
      }

      // 7. Fetch progress photos → Daily photos uploaded by users
      const { data: progressPhotos, error: photosError } = await supabase
        .from('project_photos')
        .select(`
          *,
          uploaded_by_user:uploaded_by (
            full_name,
            email
          ),
          milestone:milestone_id (
            milestone_name,
            phase_category
          )
        `)
        .eq('project_id', projectId)
        .order('date_taken', { ascending: false })
        .limit(100);

      if (photosError) {
        console.error('Error fetching progress photos:', photosError);
      }

      // 8. Fetch work sessions → Daily work logs and activity
      const { data: workSessions, error: workError } = await supabase
        .from('work_sessions')
        .select(`
          *,
          created_by_user:created_by (
            full_name,
            email
          ),
          crew_member:crew_member_id (
            crew_name,
            crew_type,
            crew_lead_name
          ),
          task:task_id (
            task_name,
            task_description
          )
        `)
        .eq('project_id', projectId)
        .order('session_date', { ascending: false })
        .limit(50);

      if (workError) {
        console.error('Error fetching work sessions:', workError);
      }

      // 9. Fetch quality inspections → Daily quality checks
      const { data: qualityInspections, error: qualityError } = await supabase
        .from('quality_inspections')
        .select(`
          *,
          inspector:inspector_id (
            full_name,
            email
          )
        `)
        .eq('project_id', projectId)
        .order('inspection_date', { ascending: false })
        .limit(30);

      if (qualityError) {
        console.error('Error fetching quality inspections:', qualityError);
      }

      // 10. Fetch safety incidents → Daily safety reports
      const { data: safetyIncidents, error: safetyError } = await supabase
        .from('safety_incidents')
        .select(`
          *,
          reported_by_user:reported_by (
            full_name,
            email
          )
        `)
        .eq('project_id', projectId)
        .order('incident_date', { ascending: false })
        .limit(20);

      if (safetyError) {
        console.error('Error fetching safety incidents:', safetyError);
      }

      // **MOBILE APP STATISTICS CALCULATION** - Calculate exactly what mobile app shows
      // Combine all timeline items like mobile app does
      const allItems = [
        ...(phases || []).map(p => ({ ...p, type: 'phase', status: p.status })),
        ...(tasks || []).map(t => ({ ...t, type: 'task', status: t.status })),
        ...(milestones || []).map(m => ({ ...m, type: 'milestone', status: m.status })),
        ...(calendarEvents || []).map(e => ({ ...e, type: 'event', status: 'scheduled' }))
      ];

      // Mobile app statistics (what users see)
      const totalItems = allItems.length;
      const completedItems = allItems.filter(item => item.status === 'completed').length;
      const inProgressItems = allItems.filter(item => 
        item.status === 'in_progress' || item.status === 'active'
      ).length;
      const notStartedItems = allItems.filter(item => 
        item.status === 'not_started' || item.status === 'pending'
      ).length;

      // Calculate overdue items (past due date)
      const now = new Date();
      const overdueItems = allItems.filter(item => {
        const endDate = item.planned_end_date || item.planned_end || item.end_datetime;
        if (!endDate) return false;
        return new Date(endDate) < now && 
               (item.status !== 'completed' && item.status !== 'cancelled');
      }).length;

      // Calculate upcoming items (starting soon)
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingItems = allItems.filter(item => {
        const startDate = item.planned_start_date || item.planned_start || item.start_datetime;
        if (!startDate || item.status === 'completed') return false;
        const start = new Date(startDate);
        return start >= now && start <= weekFromNow;
      }).length;

      // Calculate overall progress (average of all item progress)
      const itemsWithProgress = allItems.filter(item => 
        typeof item.progress_percentage === 'number'
      );
      const averageProgress = itemsWithProgress.length > 0 
        ? Math.round(itemsWithProgress.reduce((sum, item) => 
            sum + (item.progress_percentage || 0), 0) / itemsWithProgress.length)
        : 0;

      // Overall schedule health
      let scheduleHealth = 'on_track';
      const delayedCount = allItems.filter(item => item.status === 'delayed').length;
      const overduePercent = totalItems > 0 ? (overdueItems / totalItems) * 100 : 0;
      
      if (delayedCount > 0 || overduePercent > 20) {
        scheduleHealth = 'delayed';
      } else if (overduePercent > 10) {
        scheduleHealth = 'at_risk';
      }

      // **DAILY ACTIVITY TIMELINE** - Combine all daily updates
      const dailyActivities = [
        ...(projectUpdates || []).map(update => ({
          id: update.id,
          type: 'project_update',
          title: update.title,
          description: update.description,
          date: update.created_at,
          author: update.created_by_user?.full_name || 'System',
          metadata: {
            update_type: update.update_type,
            priority: update.update_priority,
            milestone: update.milestone?.milestone_name,
            photos: update.photo_urls?.length || 0
          }
        })),
        ...(progressPhotos || []).map(photo => ({
          id: photo.id,
          type: 'progress_photo',
          title: photo.photo_title || `${photo.phase_category} Photo`,
          description: photo.description || `Photo taken for ${photo.phase_category} phase`,
          date: photo.date_taken,
          author: photo.uploaded_by_user?.full_name || 'Site Team',
          metadata: {
            photo_url: photo.photo_url,
            phase_category: photo.phase_category,
            photo_type: photo.photo_type,
            processing_status: photo.processing_status,
            views: photo.views_count,
            likes: photo.likes_count
          }
        })),
        ...(workSessions || []).map(session => ({
          id: session.id,
          type: 'work_session',
          title: `Work Session: ${session.task?.task_name || 'General Work'}`,
          description: session.work_description || session.progress_made || 'Work session completed',
          date: session.created_at,
          author: session.crew_member?.crew_lead_name || session.created_by_user?.full_name || 'Crew',
          metadata: {
            duration_hours: session.duration_hours,
            crew: session.crew_member?.crew_name,
            task: session.task?.task_name,
            progress: session.progress_made,
            issues: session.issues_encountered,
            weather: session.weather_conditions
          }
        })),
        ...(qualityInspections || []).map(inspection => ({
          id: inspection.id,
          type: 'quality_inspection',
          title: `Quality Inspection: ${inspection.inspection_type}`,
          description: `Inspection completed with status: ${inspection.inspection_status}`,
          date: inspection.inspection_date,
          author: inspection.inspector?.full_name || 'Quality Inspector',
          metadata: {
            inspection_type: inspection.inspection_type,
            status: inspection.inspection_status,
            score: inspection.overall_score,
            findings: inspection.findings_summary
          }
        })),
        ...(safetyIncidents || []).map(incident => ({
          id: incident.id,
          type: 'safety_incident',
          title: `Safety Report: ${incident.incident_type}`,
          description: incident.description,
          date: incident.incident_date,
          author: incident.reported_by_user?.full_name || 'Safety Officer',
          metadata: {
            incident_type: incident.incident_type,
            severity: incident.severity_level,
            status: incident.investigation_status,
            injuries: incident.injury_details
          }
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Group daily activities by date
      const activitiesByDate = dailyActivities.reduce((groups, activity) => {
        const date = new Date(activity.date).toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(activity);
        return groups;
      }, {} as Record<string, typeof dailyActivities>);

      // Create daily timeline
      const dailyTimeline = Object.entries(activitiesByDate)
        .map(([date, activities]) => ({
          date,
          dateFormatted: new Date(date).toLocaleDateString('en-ZA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          activitiesCount: activities.length,
          activities: activities.slice(0, 10) // Limit to 10 activities per day for performance
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30); // Last 30 days

      console.log('✅ Mobile app compatible data compiled with daily updates:', {
        totalItems,
        completedItems,
        inProgressItems,
        overdueItems,
        overallProgress: averageProgress,
        scheduleHealth,
        dailyActivitiesCount: dailyActivities.length,
        timelineDays: dailyTimeline.length
      });

      // Return mobile app compatible response
      return NextResponse.json({
        success: true,
        data: {
          schedule: {
            id: `schedule_${projectId}`,
            project_id: projectId,
            schedule_name: `${project.project_name} Schedule`,
            schedule_type: 'current',
            start_date: project.start_date,
            end_date: project.expected_completion,
            schedule_health: scheduleHealth,
            completion_percentage: averageProgress,
            projects: project
          },
          phases: phases || [],
          tasks: tasks || [],
          milestones: milestones || [],
          calendarEvents: calendarEvents || [],
          crewMembers: crewMembers || [],
          // **NEW: Daily updates data**
          projectUpdates: projectUpdates || [],
          progressPhotos: progressPhotos || [],
          workSessions: workSessions || [],
          qualityInspections: qualityInspections || [],
          safetyIncidents: safetyIncidents || [],
          dailyTimeline,
          stats: {
            totalItems,
            completedItems,
            inProgressItems,
            overdueItems,
            upcomingItems,
            overallProgress: averageProgress,
            totalTasks: (tasks || []).length,
            completedTasks: (tasks || []).filter(t => t.status === 'completed').length,
            inProgressTasks: (tasks || []).filter(t => t.status === 'in_progress').length,
            notStartedTasks: (tasks || []).filter(t => t.status === 'not_started').length,
            delayedTasks: (tasks || []).filter(t => t.status === 'delayed').length,
            totalPhases: (phases || []).length,
            completedPhases: (phases || []).filter(p => p.status === 'completed').length,
            inProgressPhases: (phases || []).filter(p => p.status === 'in_progress').length,
            notStartedPhases: (phases || []).filter(p => p.status === 'not_started').length,
            totalMilestones: (milestones || []).length,
            completedMilestones: (milestones || []).filter(m => m.status === 'completed').length,
            inProgressMilestones: (milestones || []).filter(m => m.status === 'in_progress').length,
            notStartedMilestones: (milestones || []).filter(m => m.status === 'not_started').length,
            scheduleHealth,
            delayedCount: (allItems || []).filter(item => item.status === 'delayed').length,
            // **Daily update statistics**
            totalDailyUpdates: dailyActivities.length,
            recentPhotos: (progressPhotos || []).filter(p => {
              const daysSince = (Date.now() - new Date(p.date_taken).getTime()) / (1000 * 60 * 60 * 24);
              return daysSince <= 7;
            }).length,
            recentWorkSessions: (workSessions || []).filter(w => {
              const daysSince = (Date.now() - new Date(w.session_date).getTime()) / (1000 * 60 * 60 * 24);
              return daysSince <= 7;
            }).length,
            pendingQualityInspections: (qualityInspections || []).filter(q => q.inspection_status === 'pending').length,
            safetyIncidentsThisMonth: (safetyIncidents || []).filter(s => {
              const daysSince = (Date.now() - new Date(s.incident_date).getTime()) / (1000 * 60 * 60 * 24);
              return daysSince <= 30;
            }).length
          }
        }
      });

    } else {
      // Fetch all project schedules for overview
      const { data: allSchedules, error: allSchedulesError } = await supabase
        .from('project_schedules')
        .select(`
          *,
          projects:project_id (
            project_name,
            start_date,
            expected_completion,
            current_phase,
            progress_percentage,
            status,
            client_id,
            users:client_id (
              full_name
            )
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (allSchedulesError) {
        console.error('Error fetching all schedules:', allSchedulesError);
        return NextResponse.json(
          { error: 'Failed to fetch schedules' },
          { status: 500 }
        );
      }

      // Fetch summary statistics
      const { data: allTasks, error: allTasksError } = await supabase
        .from('schedule_tasks')
        .select('status, planned_end_date, actual_end_date')
        .in('schedule_id', (allSchedules || []).map(s => s.id));

      if (allTasksError) {
        console.error('Error fetching task statistics:', allTasksError);
      }

      const { data: allPhases, error: allPhasesError } = await supabase
        .from('schedule_phases')
        .select('status, planned_end_date, actual_end_date')
        .in('schedule_id', (allSchedules || []).map(s => s.id));

      if (allPhasesError) {
        console.error('Error fetching phase statistics:', allPhasesError);
      }

      // Calculate overall statistics
      const totalProjects = allSchedules?.length || 0;
      const activeProjects = allSchedules?.filter(s => s.projects?.status === 'in_progress').length || 0;
      const completedProjects = allSchedules?.filter(s => s.projects?.status === 'completed').length || 0;
      const delayedProjects = allSchedules?.filter(s => s.schedule_health === 'delayed').length || 0;

      const totalTasks = allTasks?.length || 0;
      const completedTasks = allTasks?.filter(t => t.status === 'completed').length || 0;
      const totalPhases = allPhases?.length || 0;
      const completedPhases = allPhases?.filter(p => p.status === 'completed').length || 0;

      const overallCompletion = totalProjects > 0 
        ? Math.round((allSchedules?.reduce((sum, s) => sum + (s.completion_percentage || 0), 0) || 0) / totalProjects)
        : 0;

      const projectsOnSchedule = allSchedules?.filter(s => 
        s.schedule_health === 'on_track'
      ).length || 0;

      const averageProgress = totalProjects > 0
        ? Math.round((allSchedules?.reduce((sum, s) => sum + (s.completion_percentage || 0), 0) || 0) / totalProjects)
        : 0;

      console.log('✅ Schedule overview data compiled');

      return NextResponse.json({
        success: true,
        data: {
          schedules: allSchedules || [],
          stats: {
            totalProjects,
            activeProjects,
            completedProjects,
            delayedProjects,
            totalTasks,
            completedTasks,
            totalPhases,
            completedPhases,
            overallCompletion,
            projectsOnSchedule,
            averageProgress
          }
        }
      });
    }

  } catch (error) {
    console.error('Error in schedule API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for updating schedule data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, projectId, scheduleId, phaseId, taskId, data } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    switch (action) {
      case 'updateTask': {
        if (!taskId) {
          return NextResponse.json(
            { error: 'Task ID is required' },
            { status: 400 }
          );
        }

        const { data: updatedTask, error } = await supabase
          .from('schedule_tasks')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId)
          .select()
          .single();

        if (error) {
          console.error('Error updating task:', error);
          return NextResponse.json(
            { error: 'Failed to update task' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: updatedTask
        });
      }

      case 'updatePhase': {
        if (!phaseId) {
          return NextResponse.json(
            { error: 'Phase ID is required' },
            { status: 400 }
          );
        }

        const { data: updatedPhase, error } = await supabase
          .from('schedule_phases')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', phaseId)
          .select()
          .single();

        if (error) {
          console.error('Error updating phase:', error);
          return NextResponse.json(
            { error: 'Failed to update phase' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: updatedPhase
        });
      }

      case 'updateSchedule': {
        if (!scheduleId) {
          return NextResponse.json(
            { error: 'Schedule ID is required' },
            { status: 400 }
          );
        }

        const { data: updatedSchedule, error } = await supabase
          .from('project_schedules')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', scheduleId)
          .select()
          .single();

        if (error) {
          console.error('Error updating schedule:', error);
          return NextResponse.json(
            { error: 'Failed to update schedule' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: updatedSchedule
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in POST /api/schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 