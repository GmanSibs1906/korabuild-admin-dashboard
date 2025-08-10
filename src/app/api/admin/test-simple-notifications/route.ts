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
      case 'test_document_trigger': {
        // Test document upload trigger by inserting directly without project constraint
        const testDocument = {
          project_id: null, // No project dependency
          document_name: 'Simple Document Test - Trigger Verification',
          document_type: 'other',
          category: 'general',
          file_url: 'https://example.com/test-doc.pdf',
          file_size_bytes: 1024,
          file_type: 'application/pdf',
          description: 'Simple test for document upload trigger',
          uploaded_by: '8907e679-d31e-4418-a369-68205ab0e34f',
          approval_status: 'pending',
          is_public: false,
          metadata: {
            test: true,
            trigger_test: 'document_upload'
          }
        };

        const { data: document, error: docError } = await supabase
          .from('documents')
          .insert(testDocument)
          .select()
          .single();

        if (docError) {
          return NextResponse.json({
            success: false,
            error: 'Document insert failed',
            details: docError.message
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Document upload trigger test completed',
          data: {
            document_id: document.id,
            document_name: document.document_name,
            trigger_should_fire: 'Document upload notification trigger should create admin notifications'
          }
        });
      }

      case 'test_request_trigger': {
        // Test request trigger without project dependency
        const testRequest = {
          project_id: null, // No project dependency
          client_id: '8907e679-d31e-4418-a369-68205ab0e34f',
          request_type: 'technical_support',
          category: 'service',
          title: 'Simple Request Test - Trigger Verification',
          description: 'Simple test for new request trigger',
          priority: 'medium',
          status: 'submitted',
          submitted_date: new Date().toISOString().split('T')[0],
          request_data: {
            test: true,
            trigger_test: 'new_request'
          }
        };

        const { data: request, error: reqError } = await supabase
          .from('requests')
          .insert(testRequest)
          .select()
          .single();

        if (reqError) {
          return NextResponse.json({
            success: false,
            error: 'Request insert failed',
            details: reqError.message
          });
        }

        return NextResponse.json({
          success: true,
          message: 'New request trigger test completed',
          data: {
            request_id: request.id,
            request_title: request.title,
            trigger_should_fire: 'New request notification trigger should create admin notifications'
          }
        });
      }

      case 'create_manual_notifications': {
        // Manually create notifications to verify the notification system is working
        const testNotifications = [];

        // Get all admin users
        const { data: adminUsers, error: adminError } = await supabase
          .from('users')
          .select('id, full_name')
          .eq('role', 'admin');

        if (adminError || !adminUsers || adminUsers.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'No admin users found',
            details: adminError?.message || 'No admin users in database'
          });
        }

        // Create test notifications for each admin
        for (const admin of adminUsers) {
          const notificationData = {
            user_id: admin.id,
            project_id: null,
            notification_type: 'system',
            title: '✅ Notification System Test',
            message: `Manual test notification created for admin: ${admin.full_name}`,
            entity_id: null,
            entity_type: 'system',
            priority_level: 'normal',
            is_read: false,
            action_url: '/dashboard',
            metadata: {
              test: true,
              manual_test: true,
              created_for: admin.full_name,
              source: 'manual_test_api'
            },
            priority: 'normal',
            is_pushed: false,
            is_sent: false
          };

          const { data: notification, error: notifError } = await supabase
            .from('notifications')
            .insert(notificationData)
            .select()
            .single();

          if (notifError) {
            console.error(`Failed to create notification for admin ${admin.id}:`, notifError);
          } else {
            testNotifications.push({
              admin_id: admin.id,
              admin_name: admin.full_name,
              notification_id: notification.id
            });
          }
        }

        return NextResponse.json({
          success: true,
          message: `Created ${testNotifications.length} manual test notifications`,
          data: {
            admin_count: adminUsers.length,
            notifications_created: testNotifications,
            expected_behavior: 'Should see notifications appear in admin dashboard within 5 seconds'
          }
        });
      }

      case 'test_all_simple': {
        // Test all triggers in sequence
        const results = [];

        try {
          // Test manual notifications first
          const manualResponse = await fetch(`${request.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create_manual_notifications' })
          });
          const manualResult = await manualResponse.json();
          results.push({ test: 'manual_notifications', ...manualResult });

          // Wait a bit
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Test document trigger
          const docResponse = await fetch(`${request.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'test_document_trigger' })
          });
          const docResult = await docResponse.json();
          results.push({ test: 'document_trigger', ...docResult });

          // Wait a bit
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Test request trigger
          const reqResponse = await fetch(`${request.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'test_request_trigger' })
          });
          const reqResult = await reqResponse.json();
          results.push({ test: 'request_trigger', ...reqResult });

          return NextResponse.json({
            success: true,
            message: 'All simple notification tests completed',
            results,
            instructions: [
              '1. Check your admin dashboard for new notifications',
              '2. You should see manual test notifications immediately',
              '3. Document and request triggers should create additional notifications',
              '4. All notifications should appear within 5-10 seconds',
              '5. Check browser console for detailed logging'
            ]
          });

        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Error running tests',
            details: error instanceof Error ? error.message : 'Unknown error',
            partial_results: results
          });
        }
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          available_actions: [
            'test_document_trigger',
            'test_request_trigger',
            'create_manual_notifications',
            'test_all_simple'
          ]
        });
    }

  } catch (error) {
    console.error('❌ Error in simple notification test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 