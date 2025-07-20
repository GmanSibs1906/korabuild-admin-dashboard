import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔍 Finding orphaned projects (projects with no valid owners)...');
    
    // Find projects with null client_id or client_id pointing to non-existent users
    const { data: allProjects, error: projectsError } = await supabaseAdmin
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
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: projectsError.message },
        { status: 500 }
      );
    }

    // Filter for orphaned projects (no client or client_id is null)
    const orphanedProjects = allProjects.filter(project => 
      !project.client_id || !project.client
    );

    console.log(`✅ Found ${orphanedProjects.length} orphaned projects out of ${allProjects.length} total projects`);

    return NextResponse.json({
      orphanedProjects,
      totalProjects: allProjects.length,
      orphanedCount: orphanedProjects.length
    });

  } catch (error) {
    console.error('❌ Error finding orphaned projects:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    console.log('🗑️ Deleting all orphaned projects...');
    
    // First find orphaned projects
    const { data: allProjects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        client_id,
        project_name,
        client:users!projects_client_id_fkey(id)
      `);

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    // Filter for orphaned projects
    const orphanedProjects = allProjects.filter(project => 
      !project.client_id || !project.client
    );

    if (orphanedProjects.length === 0) {
      return NextResponse.json({
        message: 'No orphaned projects found',
        deletedCount: 0
      });
    }

    console.log(`Found ${orphanedProjects.length} orphaned projects to delete:`);
    orphanedProjects.forEach(project => {
      console.log(`- ${project.project_name} (ID: ${project.id})`);
    });

    let deletedCount = 0;
    const deletionResults = [];

    // Delete each orphaned project using the existing DELETE endpoint logic
    for (const project of orphanedProjects) {
      try {
        console.log(`🗑️ Deleting orphaned project: ${project.project_name} (${project.id})`);
        
        // Use the same deletion logic as the individual project DELETE endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projects/${project.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          deletedCount++;
          deletionResults.push({
            id: project.id,
            name: project.project_name,
            status: 'success'
          });
          console.log(`✅ Successfully deleted: ${project.project_name}`);
        } else {
          const errorData = await response.json();
          deletionResults.push({
            id: project.id,
            name: project.project_name,
            status: 'failed',
            error: errorData.error
          });
          console.error(`❌ Failed to delete ${project.project_name}:`, errorData.error);
        }
      } catch (error) {
        deletionResults.push({
          id: project.id,
          name: project.project_name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ Error deleting ${project.project_name}:`, error);
      }
    }

    console.log(`✅ Deletion complete. Successfully deleted ${deletedCount} out of ${orphanedProjects.length} orphaned projects`);

    return NextResponse.json({
      message: `Successfully deleted ${deletedCount} orphaned projects`,
      deletedCount,
      totalFound: orphanedProjects.length,
      results: deletionResults
    });

  } catch (error) {
    console.error('❌ Error deleting orphaned projects:', error);
    return NextResponse.json(
      { error: 'Failed to delete orphaned projects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 