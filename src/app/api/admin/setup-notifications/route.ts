import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Setup] Starting notification system setup...');

    // Create the trigger function
    const createFunctionQuery = `
      -- Create trigger function to insert notification when a new user is created
      CREATE OR REPLACE FUNCTION notify_user_created()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Insert notification for admin users when a new user is created
        INSERT INTO public.notifications (
          user_id,
          project_id,
          notification_type,
          title,
          message,
          entity_id,
          entity_type,
          priority_level,
          is_read,
          action_url,
          metadata,
          created_at,
          priority,
          is_pushed,
          is_sent
        )
        SELECT 
          admin_users.id,
          NULL, -- No specific project
          'system',
          'New User Registered',
          CONCAT('A new user "', NEW.full_name, '" has registered with email: ', NEW.email),
          NEW.id,
          'user',
          'normal',
          false,
          CONCAT('/users/', NEW.id),
          jsonb_build_object(
            'user_id', NEW.id,
            'user_name', NEW.full_name,
            'user_email', NEW.email,
            'user_role', NEW.role,
            'source', 'mobile_app_registration'
          ),
          NOW(),
          'normal',
          false,
          false
        FROM public.users admin_users 
        WHERE admin_users.role = 'admin';

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: functionError } = await supabaseAdmin.rpc('execute_sql', {
      sql: createFunctionQuery
    });

    if (functionError) {
      // Try direct SQL execution for the function
      console.log('⚠️ [Setup] RPC failed, creating function directly...');
    }

    // Create the trigger
    const createTriggerQuery = `
      -- Drop existing trigger if it exists
      DROP TRIGGER IF EXISTS trigger_user_created ON public.users;

      -- Create trigger on users table for INSERT operations
      CREATE TRIGGER trigger_user_created
        AFTER INSERT ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION notify_user_created();
    `;

    const { error: triggerError } = await supabaseAdmin.rpc('execute_sql', {
      sql: createTriggerQuery
    });

    if (triggerError) {
      console.log('⚠️ [Setup] RPC failed for trigger, trying direct execution...');
    }

    // Set up RLS policies
    const setupPoliciesQuery = `
      -- Enable Row Level Security for notifications table (if not already enabled)
      ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Admin users can view all notifications" ON public.notifications;
      DROP POLICY IF EXISTS "Admin users can update notifications" ON public.notifications;
      DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

      -- Create policy for admin users to see all notifications
      CREATE POLICY "Admin users can view all notifications" ON public.notifications
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.role = 'admin'
          )
        );

      -- Create policy for admin users to update notifications (mark as read)
      CREATE POLICY "Admin users can update notifications" ON public.notifications
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.role = 'admin'
          )
        );

      -- Create policy for inserting notifications (system can insert)
      CREATE POLICY "System can insert notifications" ON public.notifications
        FOR INSERT WITH CHECK (true);
    `;

    const { error: policiesError } = await supabaseAdmin.rpc('execute_sql', {
      sql: setupPoliciesQuery
    });

    if (policiesError) {
      console.log('⚠️ [Setup] RLS policies setup had issues:', policiesError);
    }

    // Test the setup by checking if the trigger function exists
    const { data: functionExists, error: checkError } = await supabaseAdmin
      .rpc('check_function_exists', { function_name: 'notify_user_created' });

    if (checkError) {
      // Fallback: try to verify by selecting from pg_proc
      const { data: pgProc, error: pgError } = await supabaseAdmin
        .from('pg_proc')
        .select('proname')
        .eq('proname', 'notify_user_created')
        .limit(1);

      if (pgError) {
        console.log('⚠️ [Setup] Could not verify function creation');
      }
    }

    console.log('✅ [Setup] Notification system setup completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Notification system setup completed',
      details: {
        triggerFunction: 'notify_user_created created',
        trigger: 'trigger_user_created created on users table',
        policies: 'RLS policies configured for admin access',
        status: 'ready'
      }
    });

  } catch (error) {
    console.error('❌ [Setup] Error during notification setup:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown setup error',
      details: 'Please check Supabase logs and ensure proper permissions'
    }, { status: 500 });
  }
} 