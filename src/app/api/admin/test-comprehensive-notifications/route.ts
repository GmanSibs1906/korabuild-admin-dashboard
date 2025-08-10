import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'test_document_upload': {
        // Test document upload notification
        const testDocument = {
          project_id: '550e8400-e29b-41d4-a716-446655440000', // Use valid project ID from sample data
          document_name: 'Test Construction Plan - Admin Notification Test',
          document_type: 'plan',
          category: 'construction',
          file_url: 'https://example.com/test-document.pdf',
          file_size_bytes: 1024000,
          file_type: 'application/pdf',
          description: 'This is a test document upload to verify admin notifications',
          uploaded_by: '8907e679-d31e-4418-a369-68205ab0e34f', // Client user ID
          approval_status: 'pending',
          is_public: false,
          metadata: {
            test: true,
            notification_test: 'document_upload'
          }
        };

        const { data: document, error: docError } = await supabase
          .from('documents')
          .insert(testDocument)
          .select()
          .single();

        if (docError) {
          throw docError;
        }

        return NextResponse.json({
          success: true,
          message: 'Document upload notification test completed',
          data: {
            document_id: document.id,
            document_name: document.document_name,
            expected_notification: 'Should create notifications for all admins about new document upload'
          }
        });
      }

      case 'test_new_request': {
        // Test new request notification
        const testRequest = {
          project_id: '550e8400-e29b-41d4-a716-446655440000', // Use valid project ID from sample data
          client_id: '8907e679-d31e-4418-a369-68205ab0e34f', // Client user ID
          request_type: 'change_order',
          category: 'service',
          title: 'Test Change Order Request - Admin Notification Test',
          description: 'This is a test request to verify admin notifications for new requests',
          address: '123 Test Street, Test City',
          priority: 'high',
          status: 'submitted',
          submitted_date: new Date().toISOString().split('T')[0],
          request_data: {
            test: true,
            notification_test: 'new_request'
          }
        };

        const { data: request, error: reqError } = await supabase
          .from('requests')
          .insert(testRequest)
          .select()
          .single();

        if (reqError) {
          throw reqError;
        }

        return NextResponse.json({
          success: true,
          message: 'New request notification test completed',
          data: {
            request_id: request.id,
            request_title: request.title,
            request_type: request.request_type,
            expected_notification: 'Should create notifications for all admins about new request submission'
          }
        });
      }

      case 'test_order_approval': {
        // First create a test order in draft status, then approve it
        const testOrder = {
          project_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          supplier_id: '123e4567-e89b-12d3-a456-426614174000', // You'll need a real supplier ID
          order_number: `TEST-ORDER-${Date.now()}`,
          order_date: new Date().toISOString().split('T')[0],
          status: 'draft',
          total_amount: 15750.00,
          currency: 'USD',
          ordered_by: '9021dca2-2960-4bb5-b79a-dc3bb50247f4', // Admin user ID
          notes: 'Test order for admin notification testing'
        };

        const { data: order, error: orderError } = await supabase
          .from('project_orders')
          .insert(testOrder)
          .select()
          .single();

        if (orderError) {
          throw orderError;
        }

        // Now approve the order to trigger notification
        const { data: approvedOrder, error: approvalError } = await supabase
          .from('project_orders')
          .update({
            status: 'approved',
            approved_by: '9021dca2-2960-4bb5-b79a-dc3bb50247f4'
          })
          .eq('id', order.id)
          .select()
          .single();

        if (approvalError) {
          throw approvalError;
        }

        return NextResponse.json({
          success: true,
          message: 'Order approval notification test completed',
          data: {
            order_id: approvedOrder.id,
            order_number: approvedOrder.order_number,
            total_amount: approvedOrder.total_amount,
            status: approvedOrder.status,
            expected_notification: 'Should create notifications for all admins about order approval'
          }
        });
      }

      case 'test_contractor_acceptance': {
        // Test contractor assignment acceptance
        // First we need to create a contractor assignment, then update it to 'active'
        const testContractorAssignment = {
          project_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          contractor_id: '456e7890-e89b-12d3-a456-426614174001', // You'll need a real contractor ID
          contract_type: 'subcontract',
          contract_status: 'pending_approval',
          start_date: new Date().toISOString().split('T')[0],
          contract_value: 25000.00,
          scope_of_work: 'Test contractor assignment for notification testing',
          assigned_by: '9021dca2-2960-4bb5-b79a-dc3bb50247f4'
        };

        const { data: assignment, error: assignmentError } = await supabase
          .from('project_contractors')
          .insert(testContractorAssignment)
          .select()
          .single();

        if (assignmentError) {
          throw assignmentError;
        }

        // Now update to 'active' to simulate user acceptance
        const { data: acceptedAssignment, error: acceptanceError } = await supabase
          .from('project_contractors')
          .update({
            contract_status: 'active',
            signed_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', assignment.id)
          .select()
          .single();

        if (acceptanceError) {
          throw acceptanceError;
        }

        return NextResponse.json({
          success: true,
          message: 'Contractor acceptance notification test completed',
          data: {
            assignment_id: acceptedAssignment.id,
            contract_status: acceptedAssignment.contract_status,
            contract_value: acceptedAssignment.contract_value,
            expected_notification: 'Should create notifications for all admins about contractor assignment acceptance'
          }
        });
      }

      case 'test_document_approval': {
        // Test document approval status change
        // First create a document, then approve it
        const testDocument = {
          project_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          document_name: 'Test Document for Approval - Admin Notification Test',
          document_type: 'contract',
          category: 'legal',
          file_url: 'https://example.com/test-contract.pdf',
          file_size_bytes: 2048000,
          file_type: 'application/pdf',
          uploaded_by: '8907e679-d31e-4418-a369-68205ab0e34f',
          approval_status: 'pending',
          metadata: {
            test: true,
            notification_test: 'document_approval'
          }
        };

        const { data: document, error: docError } = await supabase
          .from('documents')
          .insert(testDocument)
          .select()
          .single();

        if (docError) {
          throw docError;
        }

        // Now approve the document
        const { data: approvedDocument, error: approvalError } = await supabase
          .from('documents')
          .update({
            approval_status: 'approved',
            approved_by: '9021dca2-2960-4bb5-b79a-dc3bb50247f4',
            approval_date: new Date().toISOString()
          })
          .eq('id', document.id)
          .select()
          .single();

        if (approvalError) {
          throw approvalError;
        }

        return NextResponse.json({
          success: true,
          message: 'Document approval notification test completed',
          data: {
            document_id: approvedDocument.id,
            document_name: approvedDocument.document_name,
            approval_status: approvedDocument.approval_status,
            expected_notification: 'Should create notifications for all admins about document approval'
          }
        });
      }

      case 'test_all_notifications': {
        // Run all tests sequentially
        const results = [];

        try {
          // Test document upload
          const docResponse = await fetch(`${request.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'test_document_upload' })
          });
          const docResult = await docResponse.json();
          results.push({ test: 'document_upload', ...docResult });

          // Test new request
          const reqResponse = await fetch(`${request.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'test_new_request' })
          });
          const reqResult = await reqResponse.json();
          results.push({ test: 'new_request', ...reqResult });

          // Add delay between tests
          await new Promise(resolve => setTimeout(resolve, 1000));

          return NextResponse.json({
            success: true,
            message: 'All notification tests completed',
            results,
            instructions: [
              '1. Check your browser console for notification logs',
              '2. Look for notifications in the admin dashboard',
              '3. Verify that notifications appear for document uploads, new requests, order approvals, and contractor acceptances',
              '4. Each test should create notifications for all admin users'
            ]
          });

        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Error running comprehensive tests',
            details: error instanceof Error ? error.message : 'Unknown error',
            results
          });
        }
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          available_actions: [
            'test_document_upload',
            'test_new_request', 
            'test_order_approval',
            'test_contractor_acceptance',
            'test_document_approval',
            'test_all_notifications'
          ]
        });
    }

  } catch (error) {
    console.error('❌ Error in notification test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 