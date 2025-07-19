import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use admin client to bypass RLS for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/*
 * 🚨 CRITICAL FIX: Data Consistency with Mobile App
 * 
 * This API now uses project_financials table as the AUTHORITATIVE source for financial data,
 * ensuring 100% consistency with what users see in the mobile app.
 * 
 * Key Changes:
 * - totalCashReceived: From project_financials.cash_received (matches mobile app)
 * - totalAmountUsed: From project_financials.amount_used (matches mobile app) 
 * - totalAmountRemaining: From project_financials.amount_remaining (matches mobile app)
 * - Added financial reconciliation logging to detect discrepancies
 * 
 * This prevents the serious data accuracy issues that could cause operational problems.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    console.log('🔍 API /users/[userId] - Fetching user profile for:', userId);
    console.log('🔍 API /users/[userId] - Request URL:', request.url);
    console.log('🔍 API /users/[userId] - Request method:', request.method);

    // Get user basic information
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('🔍 API /users/[userId] - User query result:', { user: !!user, error: userError?.message });

    if (userError || !user) {
      console.error('❌ API /users/[userId] - User not found:', userError?.message);
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

    console.log('🔍 API /users/[userId] - Projects query result:', { 
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

    console.log('🔍 API /users/[userId] - Project milestones:', projectMilestones?.length || 0);

    // Get ALL payments for user's projects (not just recent ones)
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select(`
        id,
        project_id,
        amount,
        payment_date,
        payment_method,
        description,
        status,
        payment_category,
        created_at,
        projects(project_name)
      `)
      .in('project_id', projectIds)
      .order('payment_date', { ascending: false });

    console.log('🔍 API /users/[userId] - Payments query result:', { 
      paymentsCount: payments?.length || 0, 
      error: paymentsError?.message,
      totalAmount: payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    });

    // Get user's messages/conversations
    const { data: conversations } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        project_id,
        conversation_name,
        conversation_type,
        last_message_at,
        message_count,
        created_at
      `)
      .contains('participants', [userId])
      .order('last_message_at', { ascending: false })
      .limit(10);

    // Get user's documents
    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select(`
        *,
        projects(project_name)
      `)
      .in('project_id', projects?.map(p => p.id) || [])
      .order('created_at', { ascending: false })
      .limit(20);

    // Get user's notifications
    const { data: notifications } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get user's contractor reviews (if they've left any)
    const { data: contractorReviews } = await supabaseAdmin
      .from('contractor_reviews')
      .select(`
        *,
        contractors(contractor_name, company_name),
        projects(project_name)
      `)
      .eq('reviewer_id', userId)
      .order('review_date', { ascending: false });

    // Get user's approval requests
    const { data: approvalRequests } = await supabaseAdmin
      .from('approval_requests')
      .select(`
        *,
        projects(project_name)
      `)
      .eq('requested_by', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get user's training certifications
    const { data: certifications } = await supabaseAdmin
      .from('training_certifications')
      .select('*')
      .eq('user_id', userId)
      .order('issue_date', { ascending: false });

    // Get additional financial data from project_financials table (AUTHORITATIVE SOURCE)
    // 🚨 CRITICAL FIX: Get only the LATEST record per project using consistent ordering
    const { data: projectFinancials, error: financialsError } = await supabaseAdmin
      .from('project_financials')
      .select('project_id, cash_received, amount_used, amount_remaining, created_at, updated_at, snapshot_date')
      .in('project_id', projectIds)
      .order('snapshot_date', { ascending: false })
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false });

    // Group by project_id and take only the latest record for each project (same logic as mobile-control API)
    const latestFinancials = projectIds.map(projectId => {
      const projectRecords = projectFinancials?.filter(pf => pf.project_id === projectId) || [];
      return projectRecords.length > 0 ? projectRecords[0] : null; // Take the latest (first after sorting)
    }).filter(Boolean);

    console.log('🔍 API /users/[userId] - Project financials query:', { 
      total_records: projectFinancials?.length || 0,
      latest_records_used: latestFinancials.length,
      error: financialsError?.message,
      projects_with_duplicates: projectIds.filter(projectId => {
        const records = projectFinancials?.filter(pf => pf.project_id === projectId) || [];
        return records.length > 1;
      }),
      data: latestFinancials
    });

    // Calculate user statistics using AUTHORITATIVE financial data
    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => p.status === 'in_progress').length || 0;
    const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
    const onHoldProjects = projects?.filter(p => p.status === 'on_hold').length || 0;
    const planningProjects = projects?.filter(p => p.status === 'planning').length || 0;
    
    // 🚨 CRITICAL FIX: Use LATEST project_financials records only (same as mobile app)
    const totalCashReceived = latestFinancials?.reduce((sum, pf) => sum + (pf?.cash_received || 0), 0) || 0;
    const totalAmountUsed = latestFinancials?.reduce((sum, pf) => sum + (pf?.amount_used || 0), 0) || 0;
    const totalAmountRemaining = latestFinancials?.reduce((sum, pf) => sum + (pf?.amount_remaining || 0), 0) || 0;
    
    // Calculate contract values from projects table (this should match mobile app contract values)
    const totalContractValue = projects?.reduce((sum, project) => sum + (project.contract_value || 0), 0) || 0;
    
    // For backward compatibility, still calculate payment-based spending for comparison
    const completedPayments = payments?.filter(p => p.status === 'completed') || [];
    const paymentBasedSpent = completedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    console.log('🔍 API /users/[userId] - FINANCIAL RECONCILIATION:', {
      'AUTHORITATIVE (project_financials)': {
        totalCashReceived,
        totalAmountUsed,
        totalAmountRemaining,
        totalContractValue
      },
      'LEGACY (payments table)': {
        paymentBasedSpent,
        paymentsCount: completedPayments.length
      },
      'DISCREPANCY CHECK': {
        cashReceivedVsPayments: totalCashReceived - paymentBasedSpent,
        isConsistent: Math.abs(totalCashReceived - paymentBasedSpent) < 100 // Allow $100 tolerance
      }
    });
    
    // Calculate total messages from conversation message_count
    const totalMessages = conversations?.reduce((sum, conv) => sum + (conv.message_count || 0), 0) || 0;
    const unreadNotifications = notifications?.filter(n => !n.is_read).length || 0;

    console.log('🔍 API /users/[userId] - Calculated stats:', {
      totalProjects,
      activeProjects,
      completedProjects,
      totalCashReceived,
      totalAmountUsed,
      totalContractValue,
      totalMessages,
      unreadNotifications
    });

    // Calculate user engagement score (0-100)
    const baseScore = 50;
    const projectScore = Math.min(totalProjects * 10, 30); // Max 30 points for projects
    const messageScore = Math.min(totalMessages * 0.5, 15); // Max 15 points for messages
    const reviewScore = contractorReviews?.length ? Math.min(contractorReviews.length * 5, 5) : 0; // Max 5 points
    const engagementScore = Math.round(baseScore + projectScore + messageScore + reviewScore);

    // Get user's last activity (most recent across all entities)
    const lastActivityDates = [
      user.updated_at,
      projects?.[0]?.updated_at,
      conversations?.[0]?.last_message_at,
      payments?.[0]?.created_at,
      documents?.[0]?.created_at
    ].filter(Boolean);

    const lastActivity = lastActivityDates.length > 0 
      ? new Date(Math.max(...lastActivityDates.map(d => new Date(d!).getTime())))
      : new Date(user.created_at);

    const userProfile = {
      // Basic user information
      userInfo: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePhotoUrl: user.profile_photo_url,
        joinDate: user.created_at,
        lastActivity: lastActivity.toISOString(),
      },

      // Quick statistics (using AUTHORITATIVE financial data)
      quickStats: {
        totalProjects,
        activeProjects,
        completedProjects,
        onHoldProjects,
        planningProjects,
        totalCashReceived,
        totalAmountUsed,
        totalAmountRemaining,
        totalContractValue,
        totalMessages,
        unreadNotifications,
        engagementScore,
        lastActivity: lastActivity.toISOString(),
        // Legacy field for backward compatibility
        totalSpent: totalAmountUsed
      },

      // Related data
      projects: projects || [],
      conversations: conversations || [],
      payments: completedPayments || [], // Only show completed payments
      allPayments: payments || [], // Include all payments for reference
      documents: documents || [],
      notifications: notifications || [],
      contractorReviews: contractorReviews || [],
      approvalRequests: approvalRequests || [],
      certifications: certifications || [],
      projectFinancials: latestFinancials || [],
      projectMilestones: projectMilestones || [],
      
      // Data consistency validation
      dataValidation: {
        isFinanciallyConsistent: Math.abs(totalCashReceived - paymentBasedSpent) < 100,
        cashReceivedVsPayments: totalCashReceived - paymentBasedSpent,
        hasProjectFinancials: (latestFinancials?.length || 0) > 0,
        hasProjects: (projects?.length || 0) > 0,
        lastValidationCheck: new Date().toISOString()
      }
    };

    console.log('✅ API /users/[userId] - User profile data compiled successfully');
    console.log('🔍 API /users/[userId] - Returning user profile with keys:', Object.keys(userProfile));
    console.log('🔍 API /users/[userId] - UserInfo:', userProfile.userInfo);
    return NextResponse.json(userProfile);

  } catch (error) {
    console.error('❌ API /users/[userId] - Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
} 