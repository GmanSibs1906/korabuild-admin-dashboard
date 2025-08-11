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
    
    console.log('🔍 [Find Trigger Source] Starting step-by-step investigation...');

    // Test 1: Simple read operations first
    console.log('📋 Test 1: Basic table reads...');
    
    const { data: projectContractors, error: pcError } = await supabase
      .from('project_contractors')
      .select('id, project_id, contractor_id, contract_status')
      .limit(3);
      
    if (pcError) {
      return NextResponse.json({
        success: false,
        error: 'Basic project_contractors read failed',
        details: pcError.message
      });
    }

    const { data: contractors, error: contractorsError } = await supabase
      .from('contractors')
      .select('id, contractor_name')
      .limit(3);
      
    if (contractorsError) {
      return NextResponse.json({
        success: false,
        error: 'Basic contractors read failed',
        details: contractorsError.message
      });
    }

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, project_name')
      .limit(3);
      
    if (projectsError) {
      return NextResponse.json({
        success: false,
        error: 'Basic projects read failed',
        details: projectsError.message
      });
    }

    console.log('✅ Basic reads successful');

    // Test 2: Try minimal insert that might trigger the issue
    console.log('📋 Test 2: Minimal insert test...');
    
    // Get actual IDs for testing
    const testContractorId = contractors?.[0]?.id;
    const testProjectId = projects?.[0]?.id;
    
    if (!testContractorId || !testProjectId) {
      return NextResponse.json({
        success: false,
        error: 'No test data available - need existing contractors and projects'
      });
    }

    // Try the most minimal insert possible
    const { data: minimalInsert, error: minimalInsertError } = await supabase
      .from('project_contractors')
      .insert({
        project_id: testProjectId,
        contractor_id: testContractorId,
        scope_of_work: 'DEBUG TEST - MINIMAL INSERT',
        start_date: '2025-01-01',
        contract_status: 'draft' // Use draft to avoid triggers
      })
      .select('id, project_id, contractor_id, contract_status')
      .single();

    if (minimalInsertError) {
      console.log('❌ Minimal insert failed:', minimalInsertError.message);
      
      if (minimalInsertError.message.includes('ambiguous')) {
        return NextResponse.json({
          success: false,
          error: 'Trigger ambiguity confirmed during minimal insert',
          details: minimalInsertError.message,
          analysis: 'Even basic INSERT with draft status triggers the ambiguity error',
          solution: 'The database has triggers that fire on INSERT regardless of status'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Insert failed for different reason',
          details: minimalInsertError.message
        });
      }
    }

    console.log('✅ Minimal insert successful, ID:', minimalInsert?.id);

    // Test 3: Try updating to different statuses to see which one triggers the issue
    console.log('📋 Test 3: Status update tests...');
    
    const statusTests = ['pending_approval', 'active'];
    const statusResults = [];

    for (const status of statusTests) {
      console.log(`Testing status: ${status}`);
      
      const { data: statusUpdate, error: statusUpdateError } = await supabase
        .from('project_contractors')
        .update({ contract_status: status })
        .eq('id', minimalInsert.id)
        .select('id, contract_status')
        .single();

      statusResults.push({
        status,
        success: !statusUpdateError,
        error: statusUpdateError?.message,
        isAmbiguous: statusUpdateError?.message?.includes('ambiguous')
      });

      if (statusUpdateError?.message?.includes('ambiguous')) {
        console.log(`❌ Status ${status} triggers ambiguity!`);
        break;
      } else {
        console.log(`✅ Status ${status} works fine`);
      }
    }

    // Clean up test record
    await supabase
      .from('project_contractors')
      .delete()
      .eq('id', minimalInsert.id);

    console.log('🧹 Cleaned up test record');

    return NextResponse.json({
      success: true,
      message: 'Trigger source investigation complete',
      testResults: {
        basicReads: 'SUCCESS',
        minimalInsert: minimalInsert ? 'SUCCESS' : 'FAILED',
        statusTests: statusResults
      },
      findings: {
        triggersCausingIssue: statusResults.filter(r => r.isAmbiguous).map(r => r.status),
        workingStatuses: statusResults.filter(r => r.success).map(r => r.status),
        failingStatuses: statusResults.filter(r => !r.success).map(r => r.status)
      },
      testData: {
        usedContractorId: testContractorId,
        usedProjectId: testProjectId,
        testRecordCreated: minimalInsert?.id
      }
    });

  } catch (error) {
    console.error('❌ Find trigger source error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 