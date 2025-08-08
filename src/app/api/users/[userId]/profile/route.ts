import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    console.log(`🔍 Admin API: Fetching user profile for userId: ${userId}`);
    
    // Get user basic information
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('🔍 API /users/[userId]/profile - User query result:', { user: !!user, error: userError?.message });

    if (userError || !user) {
      console.error('❌ API /users/[userId]/profile - User not found:', userError?.message);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's projects with more detailed information
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        project_name,
        project_address,
        contract_value,
        start_date,
        expected_completion,
        actual_completion,
        current_phase,
        progress_percentage,
        status,
        description,
        created_at,
        updated_at
      `)
      .eq('client_id', userId)
      .order('created_at', { ascending: false });

    console.log('🔍 API /users/[userId]/profile - Projects query result:', { 
      projectsCount: projects?.length || 0, 
      error: projectsError?.message,
      projectIds: projects?.map(p => p.id) || []
    });

    // Get project milestones for user's projects
    const projectIds = projects?.map(p => p.id) || [];
    const { data: projectMilestones } = await supabaseAdmin
      .from('project_milestones')
      .select('id, project_id, status, progress_percentage')
      .in('project_id', projectIds);

    console.log('🔍 API /users/[userId]/profile - Project milestones:', projectMilestones?.length || 0);

    // Get project financials for user's projects  
    const { data: projectFinancials } = await supabaseAdmin
      .from('project_financials')
      .select('*')
      .in('project_id', projectIds);

    // Get user's payments
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select(`
        id,
        project_id,
        amount,
        payment_date,
        status,
        payment_category,
        description,
        payment_method,
        created_at
      `)
      .in('project_id', projectIds)
      .order('payment_date', { ascending: false });

    console.log('🔍 API /users/[userId]/profile - Payments:', payments?.length || 0);

    // Get user's documents
    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select(`
        id,
        project_id,
        document_name,
        document_type,
        approval_status,
        created_at,
        file_url
      `)
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    // Get user's notifications
    const { data: notifications } = await supabaseAdmin
      .from('notifications')
      .select(`
        id,
        title,
        message,
        notification_type,
        is_read,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate statistics
    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => p.status === 'in_progress').length || 0;
    const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
    const planningProjects = projects?.filter(p => p.status === 'planning').length || 0;
    const onHoldProjects = projects?.filter(p => p.status === 'on_hold').length || 0;

    // Calculate financial stats
    const totalContractValue = projects?.reduce((sum, p) => sum + (p.contract_value || 0), 0) || 0;
    const totalCashReceived = payments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const totalAmountUsed = payments?.filter(p => p.payment_category === 'materials' || p.payment_category === 'labor').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const totalAmountRemaining = totalCashReceived - totalAmountUsed;

    // Build user profile response that matches the interface
    const userProfile = {
      userInfo: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        profilePhotoUrl: user.profile_photo_url, // Convert snake_case to camelCase
        joinDate: user.created_at,
        lastActivity: user.updated_at
      },
      quickStats: {
        totalProjects,
        activeProjects,
        completedProjects,
        planningProjects,
        onHoldProjects,
        totalContractValue,
        totalCashReceived,
        totalAmountUsed,
        totalAmountRemaining,
        totalMessages: 0, // Will be calculated from conversations if needed
        unreadNotifications: notifications?.filter(n => !n.is_read).length || 0,
        engagementScore: Math.min(100, Math.max(0, (activeProjects * 20) + (completedProjects * 10)))
      },
      projects: projects || [],
      payments: payments || [],
      allPayments: payments || [],
      documents: documents || [],
      notifications: notifications || [],
      contractorReviews: [],
      approvalRequests: [],
      certifications: [],
      projectFinancials: projectFinancials || [],
      projectMilestones: projectMilestones || [],
      conversations: []
    };

    console.log('✅ API /users/[userId]/profile - Successfully compiled user profile');
    
    return NextResponse.json(userProfile);
    
  } catch (error) {
    console.error('❌ Admin API: Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 