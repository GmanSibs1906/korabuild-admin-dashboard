-- KoraBuild Admin Dashboard: New User Notification Trigger
-- Execute this SQL in your Supabase SQL Editor to enable new user priority notifications

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
                'system',
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
                    'priority_alert', true,
                    'notification_subtype', 'user_created'
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

-- Verify the trigger was created
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_notify_new_user_created';

-- Test the trigger by creating a test user (optional - remove if not needed)
-- INSERT INTO users (email, full_name, role) 
-- VALUES ('test.trigger@example.com', 'Test Trigger User', 'client'); 