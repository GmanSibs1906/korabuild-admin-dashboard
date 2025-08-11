import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🧪 [Test Contractor Assignment Fix] Starting comprehensive test...');

    // Step 1: Get test data
    const { data: contractors, error: contractorsError } = await supabase
      .from('contractors')
      .select('id, contractor_name')
      .limit(1);
      
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, project_name')
      .limit(1);

    if (contractorsError || projectsError || !contractors?.[0] || !projects?.[0]) {
      return NextResponse.json({
        success: false,
        error: 'Need at least one contractor and one project for testing'
      });
    }

    const testContractorId = contractors[0].id;
    const testProjectId = projects[0].id;

    console.log('📋 Using test data:', {
      contractor: contractors[0].contractor_name,
      project: projects[0].project_name
    });

    // Step 2: Test the exact same operation that was failing
    console.log('🔧 Testing contractor assignment (same as API)...');
    
    const testAssignmentData = {
      project_id: testProjectId,
      contractor_id: testContractorId,
      contract_type: 'service_contract',
      contract_value: 1000,
      scope_of_work: 'TEST ASSIGNMENT - VERIFYING FIX WORKS',
      start_date: '2025-08-15',
      planned_end_date: '2025-09-15',
      payment_terms: '30 days',
      contract_status: 'pending_approval', // Start with pending
      on_site_status: 'scheduled',
      work_completion_percentage: 0
    };

    const { data: assignment, error: assignmentError } = await supabase
      .from('project_contractors')
      .insert(testAssignmentData)
      .select('id, project_id, contractor_id, contract_status, scope_of_work')
      .single();

    if (assignmentError) {
      return NextResponse.json({
        success: false,
        error: 'Contractor assignment still failing after fix',
        details: assignmentError.message,
        isAmbiguityError: assignmentError.message.includes('ambiguous'),
        recommendation: assignmentError.message.includes('ambiguous') 
          ? 'Apply COMPLETE_CONTRACTOR_TRIGGER_FIX.sql via Supabase Dashboard'
          : 'Different error - check details'
      });
    }

    console.log('✅ Assignment successful!', assignment.id);

    // Step 3: Test status updates
    console.log('🔧 Testing status updates...');
    
    const statusUpdateTests = [];
    
    // Test update to active status
    const { data: activeUpdate, error: activeUpdateError } = await supabase
      .from('project_contractors')
      .update({ contract_status: 'active' })
      .eq('id', assignment.id)
      .select('id, contract_status')
      .single();

    statusUpdateTests.push({
      status: 'active',
      success: !activeUpdateError,
      error: activeUpdateError?.message
    });

    // Step 4: Test with contractor and project data fetch (like the API does)
    console.log('📋 Testing related data fetch...');
    
    const [contractorResult, projectResult] = await Promise.all([
      supabase
        .from('contractors')
        .select('id, contractor_name, company_name, email, phone, trade_specialization')
        .eq('id', testContractorId)
        .single(),
      supabase
        .from('projects')
        .select('id, project_name, project_address')
        .eq('id', testProjectId)
        .single()
    ]);

    const fetchSuccess = !contractorResult.error && !projectResult.error;

    // Step 5: Clean up test record
    await supabase
      .from('project_contractors')
      .delete()
      .eq('id', assignment.id);

    console.log('🧹 Cleaned up test record');

    // Step 6: Test the actual API endpoint to make sure it works end-to-end
    console.log('🌐 Testing actual API endpoint...');
    
    const apiTestResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/contractors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'assign_to_project',
        data: {
          project_id: testProjectId,
          contractor_id: testContractorId,
          scope_of_work: 'API TEST - VERIFYING END-TO-END',
          start_date: '2025-08-16',
          contract_value: 1500
        }
      })
    });

    const apiTestResult = await apiTestResponse.json();
    
    // Clean up API test record if it was created
    if (apiTestResult.success && apiTestResult.data?.id) {
      await supabase
        .from('project_contractors')
        .delete()
        .eq('id', apiTestResult.data.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Contractor assignment fix verification complete!',
      testResults: {
        directAssignment: {
          success: true,
          assignmentId: assignment.id,
          testData: testAssignmentData
        },
        statusUpdates: statusUpdateTests,
        relatedDataFetch: {
          success: fetchSuccess,
          contractorFetch: !contractorResult.error,
          projectFetch: !projectResult.error
        },
        apiEndpointTest: {
          success: apiTestResult.success,
          statusCode: apiTestResponse.status,
          response: apiTestResult
        }
      },
      conclusion: {
        assignmentWorks: true,
        statusUpdatesWork: statusUpdateTests.every(t => t.success),
        apiEndpointWorks: apiTestResult.success,
        overallStatus: apiTestResult.success ? 'COMPLETE SUCCESS! 🎉' : 'API still has issues'
      },
      nextSteps: apiTestResult.success 
        ? ['Contractor assignment is now fully functional!', 'Test from dashboard to confirm UI works']
        : ['API test failed - check response details', 'May need additional fixes']
    });

  } catch (error) {
    console.error('❌ Test contractor assignment fix error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 