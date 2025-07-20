import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔍 Analyzing all projects for cleanup...');
    
    // Get all projects with full details
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        client_id,
        project_name,
        project_address,
        contract_value,
        status,
        current_phase,
        created_at,
        client:users!projects_client_id_fkey(
          id,
          full_name,
          email,
          phone,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    // Analyze each project
    const analysis = projects.map(project => {
      // Handle client data - it might be an array or single object
      const clientData = Array.isArray(project.client) ? project.client[0] : project.client;
      const hasValidOwner = !!(project.client_id && clientData);
      
      return {
        id: project.id,
        project_name: project.project_name,
        project_address: project.project_address,
        contract_value: project.contract_value,
        status: project.status,
        current_phase: project.current_phase,
        created_at: project.created_at,
        client_id: project.client_id,
        owner: clientData ? {
          id: clientData.id,
          name: clientData.full_name,
          email: clientData.email,
          phone: clientData.phone,
          role: clientData.role
        } : null,
        issues: {
          no_client_id: !project.client_id,
          client_not_found: project.client_id && !clientData,
          has_valid_owner: hasValidOwner
        },
        recommended_action: !hasValidOwner ? 'DELETE' : 'KEEP'
      };
    });

    const problematic = analysis.filter(p => !p.issues.has_valid_owner);
    const valid = analysis.filter(p => p.issues.has_valid_owner);

    return NextResponse.json({
      total: projects.length,
      valid: valid.length,
      problematic: problematic.length,
      all_projects: analysis,
      projects_to_delete: problematic,
      valid_projects: valid
    });

  } catch (error) {
    console.error('❌ Error analyzing projects:', error);
    return NextResponse.json(
      { error: 'Failed to analyze projects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { projectIds } = await request.json();
    
    if (!projectIds || !Array.isArray(projectIds)) {
      return NextResponse.json(
        { error: 'projectIds array is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting ${projectIds.length} selected projects...`);

    let deletedCount = 0;
    const results = [];

    for (const projectId of projectIds) {
      try {
        // Get project name for logging
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select('project_name')
          .eq('id', projectId)
          .single();

        console.log(`🗑️ Deleting project: ${project?.project_name || projectId}`);
        
        // Delete using the existing DELETE endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projects/${projectId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          deletedCount++;
          results.push({
            id: projectId,
            name: project?.project_name || 'Unknown',
            status: 'success'
          });
          console.log(`✅ Successfully deleted: ${project?.project_name || projectId}`);
        } else {
          const errorData = await response.json();
          results.push({
            id: projectId,
            name: project?.project_name || 'Unknown',
            status: 'failed',
            error: errorData.error
          });
          console.error(`❌ Failed to delete ${project?.project_name || projectId}:`, errorData.error);
        }
      } catch (error) {
        results.push({
          id: projectId,
          name: 'Unknown',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ Error deleting project ${projectId}:`, error);
      }
    }

    return NextResponse.json({
      message: `Deleted ${deletedCount} out of ${projectIds.length} projects`,
      deletedCount,
      totalRequested: projectIds.length,
      results
    });

  } catch (error) {
    console.error('❌ Error in bulk delete:', error);
    return NextResponse.json(
      { error: 'Failed to delete projects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 