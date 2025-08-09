import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [Setup] Creating new user notification trigger...');

    // The SQL to create the new user notification trigger
    const triggerSQL = `
      -- Create function to notify admins when a new user is created
      CREATE OR REPLACE FUNCTION notify_new_user_created()
      RETURNS TRIGGER AS $$
      DECLARE
          admin_user RECORD;
      BEGIN
          -- Only create notifications for non-admin users
          IF NEW.role != 'admin' THEN
              -- Create notifications for all admin users
              FOR admin_user IN
                  SELECT id, full_name
                  FROM users
                  WHERE role = 'admin'
              LOOP
                  INSERT INTO notifications (
                      user_id, notification_type, title, message,
                      entity_id, entity_type, priority_level, is_read, 
                      metadata, priority, is_pushed, is_sent
                  ) VALUES (
                      admin_user.id,
                      'user_created',
                      '🎉 New User Registered: ' || COALESCE(NEW.full_name, 'New User'),
                      'A new ' || NEW.role || ' has joined the platform. Review their profile to ensure they have a project setup.',
                      NEW.id,
                      'user',
                      'urgent',
                      false,
                      jsonb_build_object(
                          'user_id', NEW.id,
                          'user_name', COALESCE(NEW.full_name, 'New User'),
                          'user_email', NEW.email,
                          'user_role', NEW.role,
                          'registration_time', NEW.created_at,
                          'source', 'user_registration_trigger',
                          'priority_alert', true
                      ),
                      'urgent',
                      false,
                      false
                  );
              END LOOP;
              
              RAISE NOTICE 'Created priority notifications for new user: %', NEW.full_name;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Drop existing trigger if any
      DROP TRIGGER IF EXISTS trigger_notify_new_user_created ON users;

      -- Create the trigger
      CREATE TRIGGER trigger_notify_new_user_created
          AFTER INSERT ON users
          FOR EACH ROW
          EXECUTE FUNCTION notify_new_user_created();
    `;

    return NextResponse.json({
      success: true,
      message: 'New user notification trigger setup completed!',
      sql: triggerSQL,
      instructions: 'Execute this SQL in your Supabase SQL Editor to enable new user notifications.'
    });

  } catch (error) {
    console.error('❌ [Setup] Error setting up user notifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to setup new user notifications'
      },
      { status: 500 }
    );
  }
} 