import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { confirm } = body;
    
    // Require confirmation for data deletion
    if (confirm !== 'CLEANUP_ORPHANED_DATA') {
      return NextResponse.json(
        { error: 'Confirmation required. Send {"confirm": "CLEANUP_ORPHANED_DATA"} to proceed.' },
        { status: 400 }
      );
    }
    
    console.log('🧹 Admin API: Starting comprehensive cleanup of orphaned users...');
    
    // Step 1: Get all authenticated user IDs
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Force Cleanup API: Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch authenticated users', details: authError.message },
        { status: 500 }
      );
    }

    const authenticatedUserIds = authUsers.users.map(user => user.id);
    console.log(`📧 Found ${authenticatedUserIds.length} authenticated users`);

    // Step 2: Get all users from public.users table
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role');

    if (usersError) {
      console.error('❌ Force Cleanup API: Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      );
    }

    console.log(`👤 Found ${allUsers?.length || 0} users in public.users table`);

    // Step 3: Find users who don't have auth entries (orphaned data)
    const orphanedUsers = allUsers?.filter(user => !authenticatedUserIds.includes(user.id)) || [];
    
    if (orphanedUsers.length === 0) {
      console.log('✅ Force Cleanup API: No orphaned users to remove');
      return NextResponse.json({
        message: 'No orphaned users found to clean up',
        removedUsers: [],
        count: 0
      });
    }

    console.log(`🗑️ Found ${orphanedUsers.length} orphaned users to remove:`, orphanedUsers.map(u => `${u.full_name} (${u.email})`));

    const orphanedUserIds = orphanedUsers.map(user => user.id);
    
    // Step 4: Clean up related data with foreign key constraints
    // Order matters - clean child tables before parent tables
    const cleanupResults = {
      removedUsers: orphanedUsers,
      cleanedTables: {} as Record<string, number>
    };
    
    // Tables that might reference orphaned users (clean in order to avoid FK violations)
    const tablesToClean = [
      // Child tables first (those that reference users)
      { table: 'contractors', columns: ['added_by_user_id'] },
      { table: 'training_certifications', columns: ['user_id'] },
      { table: 'user_push_tokens', columns: ['user_id'] },
      
      // Communication and requests
      { table: 'conversations', columns: ['created_by'] },
      { table: 'messages', columns: ['sender_id'] },
      { table: 'communication_log', columns: ['user_id'] },
      { table: 'requests', columns: ['client_id', 'assigned_to_user_id'] },
      { table: 'request_comments', columns: ['user_id'] },
      { table: 'request_status_history', columns: ['changed_by'] },
      
      // Financial records
      { table: 'payments', columns: ['client_id'] },
      { table: 'credit_accounts', columns: ['client_id'] },
      { table: 'enhanced_credit_accounts', columns: ['client_id', 'created_by'] },
      { table: 'financial_budgets', columns: ['created_by'] },
      
      // Quality and safety
      { table: 'quality_inspections', columns: ['inspector_id'] },
      { table: 'quality_reports', columns: ['generated_by'] },
      { table: 'safety_incidents', columns: ['reported_by_user_id', 'investigator_user_id'] },
      { table: 'safety_inspections', columns: ['inspector_user_id', 'corrective_actions_assigned_to'] },
      { table: 'safety_training_records', columns: ['trainee_user_id', 'trainer_user_id'] },
      
      // Documents and uploads
      { table: 'documents', columns: ['uploaded_by', 'approved_by'] },
      { table: 'project_photos', columns: ['uploaded_by'] },
      { table: 'photo_comments', columns: ['user_id'] },
      { table: 'photo_albums', columns: ['created_by'] },
      
      // Orders and deliveries  
      { table: 'project_orders', columns: ['ordered_by', 'approved_by'] },
      { table: 'deliveries', columns: ['delivered_by'] },
      { table: 'inventory_transactions', columns: ['performed_by'] },
      
      // Work and schedules
      { table: 'work_sessions', columns: ['created_by', 'verified_by'] },
      { table: 'daily_updates', columns: ['submitted_by'] },
      { table: 'project_updates', columns: ['created_by'] },
      
      // Admin and approvals
      { table: 'approval_requests', columns: ['requested_by', 'assigned_to'] },
      { table: 'approval_responses', columns: ['responder_id'] },
      { table: 'meeting_records', columns: ['meeting_organizer'] },
      { table: 'compliance_documents', columns: ['uploaded_by'] },
      
      // Notifications
      { table: 'notifications', columns: ['user_id'] }
    ];
    
    // Clean up related data
    for (const { table, columns } of tablesToClean) {
      let totalDeleted = 0;
      
      for (const column of columns) {
        try {
          const { count, error } = await supabaseAdmin
            .from(table)
            .delete({ count: 'exact' })
            .in(column, orphanedUserIds);
          
          if (!error) {
            totalDeleted += count || 0;
            if (count && count > 0) {
              console.log(`✅ Cleaned ${count} records from ${table}.${column}`);
            }
          }
        } catch (error) {
          // Continue with other columns/tables even if one fails
          console.log(`⚠️ Could not clean ${table}.${column}:`, error);
        }
      }
      
      if (totalDeleted > 0) {
        cleanupResults.cleanedTables[table] = totalDeleted;
      }
    }
    
    // Step 5: Now delete orphaned users from projects (as client_id)
    try {
      const { count: projectCount, error: projectError } = await supabaseAdmin
        .from('projects')
        .delete({ count: 'exact' })
        .in('client_id', orphanedUserIds);
        
      if (!projectError && projectCount && projectCount > 0) {
        cleanupResults.cleanedTables['projects'] = projectCount;
        console.log(`✅ Cleaned ${projectCount} projects owned by orphaned users`);
      }
    } catch (error) {
      console.log(`⚠️ Could not clean projects:`, error);
    }
    
    // Step 6: Finally, delete the orphaned users themselves
    const { count: userCount, error: deleteError } = await supabaseAdmin
      .from('users')
      .delete({ count: 'exact' })
      .in('id', orphanedUserIds);

    if (deleteError) {
      console.error('❌ Force Cleanup API: Error deleting orphaned users:', deleteError);
      return NextResponse.json(
        { 
          error: 'Failed to delete orphaned users after cleanup', 
          details: deleteError.message,
          partialCleanup: cleanupResults 
        },
        { status: 500 }
      );
    }

    console.log('✅ Force Cleanup API: Successfully removed all orphaned data');
    
    return NextResponse.json({
      message: `Successfully removed ${orphanedUsers.length} orphaned users and all related data`,
      removedUsers: orphanedUsers.map(u => ({ 
        id: u.id, 
        email: u.email, 
        name: u.full_name, 
        role: u.role 
      })),
      count: orphanedUsers.length,
      cleanedTables: cleanupResults.cleanedTables,
      summary: {
        usersRemoved: userCount || 0,
        tablesAffected: Object.keys(cleanupResults.cleanedTables).length,
        totalRecordsRemoved: Object.values(cleanupResults.cleanedTables).reduce((sum, count) => sum + count, 0)
      }
    });
    
  } catch (error: any) {
    console.error('❌ Force Cleanup API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 