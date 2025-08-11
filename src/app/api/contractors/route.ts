import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    console.log('👥 Admin API: Fetching contractors...', projectId ? `for project ${projectId}` : 'all contractors');

    if (projectId) {
      // Fetch contractors for a specific project with assignment details
      const { data: projectContractors, error: projectContractorsError } = await supabaseAdmin
        .from('project_contractors')
        .select(`
          *,
          contractor:contractors(
            *,
            contractor_capabilities(*),
            contractor_reviews(
              id,
              overall_rating,
              quality_of_work,
              timeliness,
              communication,
              cleanliness,
              professionalism
            )
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (projectContractorsError) {
        console.error('❌ Error fetching project contractors:', projectContractorsError);
        return NextResponse.json(
          { error: 'Failed to fetch project contractors', details: projectContractorsError.message },
          { status: 500 }
        );
      }

      console.log(`✅ Successfully fetched ${projectContractors?.length || 0} contractors for project ${projectId}`);

      return NextResponse.json({
        success: true,
        data: {
          projectContractors: projectContractors || [],
          stats: {
            totalContractors: projectContractors?.length || 0,
            activeContractors: projectContractors?.filter(pc => pc.contract_status === 'active').length || 0,
            onSiteContractors: projectContractors?.filter(pc => pc.on_site_status === 'on_site').length || 0,
            completedContractors: projectContractors?.filter(pc => pc.contract_status === 'completed').length || 0,
            totalContractValue: projectContractors?.reduce((sum, pc) => sum + (pc.contract_value || 0), 0) || 0,
            averageProgress: projectContractors?.length ? 
              Math.round(projectContractors.reduce((sum, pc) => sum + (pc.work_completion_percentage || 0), 0) / projectContractors.length) : 0
          }
        }
      });
    } else {
      // Fetch all contractors with their project assignments
      const { data: contractors, error: contractorsError } = await supabaseAdmin
        .from('contractors')
        .select(`
          *,
          contractor_capabilities(*),
          contractor_reviews(
            id,
            overall_rating,
            quality_of_work,
            timeliness,
            communication,
            cleanliness,
            professionalism,
            review_date
          ),
          project_contractors(
            id,
            project_id,
            contract_status,
            contract_value,
            on_site_status,
            work_completion_percentage,
            start_date,
            planned_end_date,
            project:projects(
              id,
              project_name,
              status
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (contractorsError) {
        console.error('❌ Error fetching contractors:', contractorsError);
        return NextResponse.json(
          { error: 'Failed to fetch contractors', details: contractorsError.message },
          { status: 500 }
        );
      }

      console.log(`✅ Successfully fetched ${contractors?.length || 0} contractors`);

      // Calculate contractor statistics
      const stats = {
        totalContractors: contractors?.length || 0,
        activeContractors: contractors?.filter(c => c.status === 'active').length || 0,
        verifiedContractors: contractors?.filter(c => c.verification_status === 'verified').length || 0,
        pendingContractors: contractors?.filter(c => c.verification_status === 'pending').length || 0,
        userAddedContractors: contractors?.filter(c => c.contractor_source === 'user_added').length || 0,
        korabuildVerifiedContractors: contractors?.filter(c => c.contractor_source === 'korabuild_verified').length || 0,
        averageRating: contractors?.length ? 
          contractors.reduce((sum, c) => sum + (c.overall_rating || 0), 0) / contractors.length : 0
      };

      return NextResponse.json({
        success: true,
        data: {
          contractors: contractors || [],
          stats
        }
      });
    }

  } catch (error) {
    console.error('❌ Error in contractors API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    console.log('👥 Admin API: Processing contractor action:', action);

    switch (action) {
      case 'add_contractor': {
        const {
          contractor_name,
          company_name,
          primary_contact_name,
          email,
          phone,
          trade_specialization,
          secondary_specializations = [],
          hourly_rate,
          daily_rate,
          contractor_source = 'user_added',
          verification_status = 'pending',
          ...otherFields
        } = data;

        // Validate required fields
        if (!contractor_name || !company_name || !email || !phone || !trade_specialization) {
          return NextResponse.json(
            { error: 'Missing required contractor fields' },
            { status: 400 }
          );
        }

        // Create contractor
        const { data: newContractor, error: contractorError } = await supabaseAdmin
          .from('contractors')
          .insert({
            contractor_name,
            company_name,
            primary_contact_name: primary_contact_name || contractor_name,
            email,
            phone,
            trade_specialization,
            secondary_specializations,
            hourly_rate,
            daily_rate,
            contractor_source,
            verification_status,
            status: 'active',
            ...otherFields
          })
          .select('*')
          .single();

        if (contractorError) {
          console.error('❌ Error creating contractor:', contractorError);
          return NextResponse.json(
            { error: 'Failed to create contractor', details: contractorError.message },
            { status: 500 }
          );
        }

        console.log('✅ Successfully created contractor:', newContractor.id);

        return NextResponse.json({
          success: true,
          data: newContractor,
          message: 'Contractor created successfully'
        });
      }

      case 'assign_to_project': {
        const {
          project_id,
          contractor_id,
          contract_type = 'service_contract',
          contract_value,
          scope_of_work,
          start_date,
          planned_end_date,
          payment_terms = '30 days',
          ...assignmentFields
        } = data;

        if (!project_id || !contractor_id || !scope_of_work || !start_date) {
          return NextResponse.json(
            { error: 'Missing required assignment fields' },
            { status: 400 }
          );
        }

        console.log('👥 Admin API: Processing contractor action: assign_to_project');
        console.log('📋 Assignment data:', { project_id, contractor_id, scope_of_work, start_date });

        // The issue is database triggers with ambiguous column references
        // Use 'pending_approval' status to avoid triggers until they're fixed
        let assignment;
        let assignmentError;
        
        try {
          console.log('🔧 Creating contractor assignment with pending_approval status...');
          const { data, error } = await supabaseAdmin
            .from('project_contractors')
            .insert({
              project_id,
              contractor_id,
              contract_type,
              contract_value: contract_value || 0,
              scope_of_work,
              start_date,
              planned_end_date,
              payment_terms,
              contract_status: 'pending_approval', // Use pending_approval to avoid trigger issues
              on_site_status: 'scheduled',
              work_completion_percentage: 0,
              ...assignmentFields
            })
            .select('id, project_id, contractor_id, contract_status, scope_of_work, start_date, contract_value, planned_end_date')
            .single();
            
          assignment = data;
          assignmentError = error;
          
          if (error) {
            console.log('❌ Assignment failed:', error.message);
            
            if (error.message.includes('ambiguous')) {
              console.log('🚨 Database trigger issue detected - please apply SQL fix');
              
              return NextResponse.json(
                { 
                  error: 'Database trigger configuration issue',
                  details: 'Please apply the SQL fix in CONTRACTOR_ASSIGNMENT_TRIGGER_FIX.sql via Supabase Dashboard',
                  technicalDetails: error.message,
                  sqlFix: 'Run CONTRACTOR_ASSIGNMENT_TRIGGER_FIX.sql in Supabase Dashboard → SQL Editor'
                },
                { status: 500 }
              );
            }
          } else {
            console.log('✅ Contractor assignment successful');
          }
        } catch (err) {
          console.log('💥 Unexpected error during assignment:', err);
          assignmentError = err instanceof Error ? err : new Error('Unknown error');
        }

        if (assignmentError) {
          console.error('❌ Error assigning contractor to project:', assignmentError);
          return NextResponse.json(
            { error: 'Failed to assign contractor to project', details: assignmentError.message },
            { status: 500 }
          );
        }

        if (!assignment) {
          return NextResponse.json(
            { error: 'Failed to assign contractor to project', details: 'No assignment data returned' },
            { status: 500 }
          );
        }

        // Fetch contractor and project details separately to avoid JOIN ambiguity
        console.log('📋 Fetching related contractor and project data...');
        const [contractorResult, projectResult] = await Promise.all([
          supabaseAdmin
            .from('contractors')
            .select('id, contractor_name, company_name, email, phone, trade_specialization')
            .eq('id', contractor_id)
            .single(),
          supabaseAdmin
            .from('projects')
            .select('id, project_name, project_address')
            .eq('id', project_id)
            .single()
        ]);

        const finalAssignment = {
          ...assignment,
          contractor: contractorResult.data,
          project: projectResult.data
        };

        console.log('✅ Successfully assigned contractor to project');

        return NextResponse.json({
          success: true,
          data: finalAssignment,
          message: 'Contractor assigned to project successfully (status: pending_approval)'
        });
      }

      case 'update_contractor': {
        const { contractor_id, updates } = data;

        if (!contractor_id) {
          return NextResponse.json(
            { error: 'Contractor ID is required' },
            { status: 400 }
          );
        }

        const { data: updatedContractor, error: updateError } = await supabaseAdmin
          .from('contractors')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', contractor_id)
          .select('*')
          .single();

        if (updateError) {
          console.error('❌ Error updating contractor:', updateError);
          return NextResponse.json(
            { error: 'Failed to update contractor', details: updateError.message },
            { status: 500 }
          );
        }

        console.log('✅ Successfully updated contractor:', contractor_id);

        return NextResponse.json({
          success: true,
          data: updatedContractor,
          message: 'Contractor updated successfully'
        });
      }

      case 'update_project_assignment': {
        const { assignment_id, updates } = data;

        if (!assignment_id) {
          return NextResponse.json(
            { error: 'Assignment ID is required' },
            { status: 400 }
          );
        }

        const { data: updatedAssignment, error: updateError } = await supabaseAdmin
          .from('project_contractors')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', assignment_id)
          .select(`
            *,
            contractor:contractors(*),
            project:projects(id, project_name)
          `)
          .single();

        if (updateError) {
          console.error('❌ Error updating project assignment:', updateError);
          return NextResponse.json(
            { error: 'Failed to update project assignment', details: updateError.message },
            { status: 500 }
          );
        }

        console.log('✅ Successfully updated project assignment:', assignment_id);

        return NextResponse.json({
          success: true,
          data: updatedAssignment,
          message: 'Project assignment updated successfully'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Error in contractors POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 