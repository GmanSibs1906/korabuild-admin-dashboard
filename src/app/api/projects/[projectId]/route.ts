import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    
    console.log(`🗑️ Admin API: Starting deletion of project ${projectId} and all related data...`);
    
    // Start transaction-like deletion (Supabase doesn't support explicit transactions in this context)
    // We'll delete in reverse dependency order to avoid foreign key constraint violations
    
    // 1. Delete photo comments (depends on project_photos)
    const { data: projectPhotos } = await supabaseAdmin
      .from('project_photos')
      .select('id')
      .eq('project_id', projectId);
    
    if (projectPhotos && projectPhotos.length > 0) {
      const photoIds = projectPhotos.map(p => p.id);
      const { error: photoCommentsError } = await supabaseAdmin
        .from('photo_comments')
        .delete()
        .in('photo_id', photoIds);
      
      if (photoCommentsError) {
        console.error('❌ Error deleting photo comments:', photoCommentsError);
      }
    }
    
    // 2. Delete album photos (depends on photo_albums and project_photos)
    const { data: photoAlbums } = await supabaseAdmin
      .from('photo_albums')
      .select('id')
      .eq('project_id', projectId);
    
    if (photoAlbums && photoAlbums.length > 0) {
      const albumIds = photoAlbums.map(a => a.id);
      const { error: albumPhotosError } = await supabaseAdmin
        .from('album_photos')
        .delete()
        .in('album_id', albumIds);
      
      if (albumPhotosError) {
        console.error('❌ Error deleting album photos:', albumPhotosError);
      }
    }
    
    // 3. Delete work sessions (depends on schedule_tasks)
    const { error: workSessionsError } = await supabaseAdmin
      .from('work_sessions')
      .delete()
      .eq('project_id', projectId);
    
    if (workSessionsError) {
      console.error('❌ Error deleting work sessions:', workSessionsError);
    }
    
    // 4. Delete schedule tasks (depends on schedule_phases)
    const { error: scheduleTasksError } = await supabaseAdmin
      .from('schedule_tasks')
      .delete()
      .eq('project_id', projectId);
    
    if (scheduleTasksError) {
      console.error('❌ Error deleting schedule tasks:', scheduleTasksError);
    }
    
    // 5. Delete schedule phases (depends on project_schedules)
    const { error: schedulePhasesError } = await supabaseAdmin
      .from('schedule_phases')
      .delete()
      .eq('project_id', projectId);
    
    if (schedulePhasesError) {
      console.error('❌ Error deleting schedule phases:', schedulePhasesError);
    }
    
    // 6. Delete quality checklist items (depends on quality_checklists)
    const { data: qualityChecklists } = await supabaseAdmin
      .from('quality_checklists')
      .select('id')
      .eq('project_id', projectId);
    
    // 6. Delete quality inspection results and photos (depends on quality_inspections)
    const { data: qualityInspections } = await supabaseAdmin
      .from('quality_inspections')
      .select('id')
      .eq('project_id', projectId);
    
    if (qualityInspections && qualityInspections.length > 0) {
      const inspectionIds = qualityInspections.map(i => i.id);
      
      // Delete quality inspection results
      const { error: qualityResultsError } = await supabaseAdmin
        .from('quality_inspection_results')
        .delete()
        .in('inspection_id', inspectionIds);
      
      if (qualityResultsError) {
        console.error('❌ Error deleting quality inspection results:', qualityResultsError);
      }
      
      // Delete quality photos
      const { error: qualityPhotosError } = await supabaseAdmin
        .from('quality_photos')
        .delete()
        .in('inspection_id', inspectionIds);
      
      if (qualityPhotosError) {
        console.error('❌ Error deleting quality photos:', qualityPhotosError);
      }
    }
    
    // 7. Delete safety incident attachments (depends on safety_incidents)
    const { data: safetyIncidents } = await supabaseAdmin
      .from('safety_incidents')
      .select('id')
      .eq('project_id', projectId);
    
    if (safetyIncidents && safetyIncidents.length > 0) {
      const incidentIds = safetyIncidents.map(i => i.id);
      
      // Delete safety incident attachments
      const { error: safetyAttachmentsError } = await supabaseAdmin
        .from('safety_incident_attachments')
        .delete()
        .in('incident_id', incidentIds);
      
      if (safetyAttachmentsError) {
        console.error('❌ Error deleting safety incident attachments:', safetyAttachmentsError);
      }
    }
    
    // 8. Delete order-related dependencies (depends on project_orders)
    const { data: projectOrders } = await supabaseAdmin
      .from('project_orders')
      .select('id')
      .eq('project_id', projectId);
    
    if (projectOrders && projectOrders.length > 0) {
      const orderIds = projectOrders.map(o => o.id);
      
      // Delete delivery items first (depends on deliveries)
      const { data: deliveries } = await supabaseAdmin
        .from('deliveries')
        .select('id')
        .in('order_id', orderIds);
      
      if (deliveries && deliveries.length > 0) {
        const deliveryIds = deliveries.map(d => d.id);
        const { error: deliveryItemsError } = await supabaseAdmin
          .from('delivery_items')
          .delete()
          .in('delivery_id', deliveryIds);
        
        if (deliveryItemsError) {
          console.error('❌ Error deleting delivery items:', deliveryItemsError);
        }
      }
      
      // Delete deliveries
      const { error: deliveriesError } = await supabaseAdmin
        .from('deliveries')
        .delete()
        .in('order_id', orderIds);
      
      if (deliveriesError) {
        console.error('❌ Error deleting deliveries:', deliveriesError);
      }
      
      // Delete order items
      const { error: orderItemsError } = await supabaseAdmin
        .from('order_items')
        .delete()
        .in('order_id', orderIds);
      
      if (orderItemsError) {
        console.error('❌ Error deleting order items:', orderItemsError);
      }
      
      // Delete order status history
      const { error: orderStatusError } = await supabaseAdmin
        .from('order_status_history')
        .delete()
        .in('order_id', orderIds);
      
      if (orderStatusError) {
        console.error('❌ Error deleting order status history:', orderStatusError);
      }
    }
    
    // 9. Delete document versions (depends on documents)
    const { data: projectDocuments } = await supabaseAdmin
      .from('documents')
      .select('id')
      .eq('project_id', projectId);
    
    if (projectDocuments && projectDocuments.length > 0) {
      const documentIds = projectDocuments.map(d => d.id);
      
      // Delete document versions
      const { error: documentVersionsError } = await supabaseAdmin
        .from('document_versions')
        .delete()
        .in('document_id', documentIds);
      
      if (documentVersionsError) {
        console.error('❌ Error deleting document versions:', documentVersionsError);
      }
    }
    
    // 10. Fix financial constraints and delete receipt metadata (depends on payments)
    const { data: projectPayments } = await supabaseAdmin
      .from('payments')
      .select('id, amount_used, cash_received')
      .eq('project_id', projectId);
    
    if (projectPayments && projectPayments.length > 0) {
      const paymentIds = projectPayments.map(p => p.id);
      
      // Delete receipt metadata first
      const { error: receiptMetadataError } = await supabaseAdmin
        .from('receipt_metadata')
        .delete()
        .in('payment_id', paymentIds);
      
      if (receiptMetadataError) {
        console.error('❌ Error deleting receipt metadata:', receiptMetadataError);
      }
      
      // Fix constraint violations by updating invalid financial data before deletion
      for (const payment of projectPayments) {
        if (payment.amount_used > payment.cash_received) {
          console.log(`🔧 Fixing payment ${payment.id} constraint: amount_used (${payment.amount_used}) > cash_received (${payment.cash_received})`);
          
          // Update to valid values before deletion
          await supabaseAdmin
            .from('payments')
            .update({ 
              amount_used: 0,
              cash_received: Math.max(payment.cash_received, payment.amount_used)
            })
            .eq('id', payment.id);
        }
      }
    }
    
    // 11. Delete direct project dependencies
    const tablesToClean = [
      'approval_requests',
      'conversations', 
      'credit_accounts',
      'documents',
      'photo_albums',
      'project_contractors',
      'project_photos',
      'project_schedules',
      'project_updates',
      'quality_reports',
      'quality_inspections',
      'requests',
      'safety_training_records',
      'project_orders',
      'communication_log',
      'compliance_documents',
      'meeting_records',
      'safety_inspections',
      'safety_incidents',
      'weather_conditions',
      'legacy_orders',
      'payments',
      'project_milestones'
    ];
    
    for (const table of tablesToClean) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('project_id', projectId);
      
      if (error) {
        console.error(`❌ Error deleting from ${table}:`, error);
        // Continue with other tables even if one fails
      } else {
        console.log(`✅ Deleted ${table} records for project ${projectId}`);
      }
    }
    
    // 12. Delete project_financials last (after all other tables to avoid constraint issues)
    const { error: projectFinancialsError } = await supabaseAdmin
      .from('project_financials')
      .delete()
      .eq('project_id', projectId);
    
    if (projectFinancialsError) {
      console.error('❌ Error deleting project_financials:', projectFinancialsError);
      // Continue anyway, as this might not be critical
    } else {
      console.log(`✅ Deleted project_financials records for project ${projectId}`);
    }
    
    // 13. Check for any remaining references before project deletion (for debugging)
    const tablesToCheck = [
      'approval_requests', 'conversations', 'credit_accounts', 'documents', 
      'photo_albums', 'project_contractors', 'project_photos', 'project_schedules',
      'project_updates', 'quality_reports', 'quality_inspections', 'requests',
      'safety_training_records', 'project_orders', 'communication_log', 
      'compliance_documents', 'meeting_records', 'safety_inspections',
      'safety_incidents', 'weather_conditions', 'legacy_orders', 'payments',
      'project_milestones', 'project_financials'
    ];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('id')
          .eq('project_id', projectId)
          .limit(1);
        
        if (data && data.length > 0) {
          console.log(`⚠️ Found ${data.length} remaining records in ${table} for project ${projectId}`);
        }
      } catch (error) {
        // Ignore errors for tables that might not exist or have different column names
      }
    }
    
    // 14. Finally, delete the project itself
    const { error: projectError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (projectError) {
      console.error('❌ Error deleting project:', projectError);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to delete project';
      if (projectError.code === '23503') {
        errorMessage = 'Cannot delete project due to foreign key constraints. Some related data may still exist.';
      } else if (projectError.code === 'P0001') {
        errorMessage = 'Cannot delete project due to database constraint violations.';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: projectError.message,
          code: projectError.code,
          hint: 'Try refreshing the page and attempting the deletion again, or contact support if the issue persists.'
        },
        { status: 500 }
      );
    }
    
    console.log(`✅ Successfully deleted project ${projectId} and all related data`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Project and all related data deleted successfully' 
    });
    
  } catch (error) {
    console.error('❌ Admin API: Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    
    console.log(`🏗️ Admin API: Fetching project ${projectId} details...`);
    
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        client:users!projects_client_id_fkey(
          id,
          email,
          full_name,
          phone
        ),
        project_milestones(
          id,
          milestone_name,
          status,
          progress_percentage,
          planned_start,
          planned_end,
          actual_start,
          actual_end,
          phase_category
        ),
        project_contractors(
          id,
          contract_status,
          contract_value,
          on_site_status,
          work_completion_percentage,
          contractor:contractors(
            id,
            contractor_name,
            company_name,
            trade_specialization,
            overall_rating
          )
        ),
        payments(
          id,
          amount,
          payment_date,
          status,
          payment_category
        )
      `)
      .eq('id', projectId)
      .single();
    
    if (error) {
      console.error('❌ Admin API: Error fetching project:', error);
      return NextResponse.json(
        { error: 'Failed to fetch project', details: error.message },
        { status: 500 }
      );
    }
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Admin API: Successfully fetched project ${projectId}`);
    
    return NextResponse.json({ project });
    
  } catch (error) {
    console.error('❌ Admin API: Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    
    console.log(`🏗️ Admin API: Updating project ${projectId}...`, body);
    
    const {
      project_name,
      project_address,
      contract_value,
      start_date,
      expected_completion,
      actual_completion,
      description,
      current_phase,
      status,
      progress_percentage
    } = body;

    // Validate required fields
    if (!project_name || !project_address || !contract_value || !start_date || !expected_completion) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update project
    const { data: updatedProject, error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        project_name,
        project_address,
        contract_value,
        start_date,
        expected_completion,
        actual_completion: actual_completion || null,
        description,
        current_phase,
        status,
        progress_percentage: progress_percentage || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select(`
        *,
        client:users!projects_client_id_fkey(
          id,
          email,
          full_name,
          phone
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ Admin API: Error updating project:', updateError);
      return NextResponse.json(
        { error: 'Failed to update project', details: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Admin API: Successfully updated project ${projectId}`);
    
    return NextResponse.json({
      project: updatedProject,
      message: 'Project updated successfully'
    });
  } catch (error: any) {
    console.error('❌ Admin API: Error updating project:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 