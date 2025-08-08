-- Create a database trigger to automatically create notifications when messages are inserted
-- This will work regardless of whether the mobile app uses API endpoints or direct database inserts

-- First, create the notification creation function
CREATE OR REPLACE FUNCTION create_message_notifications()
RETURNS TRIGGER AS $$
DECLARE
    sender_info RECORD;
    conversation_info RECORD;
    admin_user RECORD;
    project_name TEXT;
BEGIN
    -- Log the trigger execution
    RAISE LOG 'Message notification trigger fired for message: %', NEW.id;
    
    -- Get sender information
    SELECT id, full_name, role 
    INTO sender_info 
    FROM users 
    WHERE id = NEW.sender_id;
    
    -- Only create notifications if sender is not an admin
    IF sender_info.role != 'admin' THEN
        RAISE LOG 'Creating notifications for non-admin sender: %', sender_info.full_name;
        
        -- Get conversation information
        SELECT c.conversation_name, c.project_id, p.project_name
        INTO conversation_info
        FROM conversations c
        LEFT JOIN projects p ON c.project_id = p.id
        WHERE c.id = NEW.conversation_id;
        
        -- Set project name
        project_name := COALESCE(conversation_info.project_name, 'General');
        
        -- Create notifications for all admin users
        FOR admin_user IN 
            SELECT id, full_name 
            FROM users 
            WHERE role = 'admin'
        LOOP
            INSERT INTO notifications (
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
                conversation_id,
                metadata,
                priority,
                is_pushed,
                is_sent
            ) VALUES (
                admin_user.id,
                conversation_info.project_id,
                'message',
                CASE 
                    WHEN conversation_info.project_name IS NOT NULL THEN
                        'New message in ' || conversation_info.project_name || ' - ' || COALESCE(conversation_info.conversation_name, 'General')
                    ELSE
                        'New message from ' || COALESCE(sender_info.full_name, 'Mobile User')
                END,
                CASE 
                    WHEN LENGTH(NEW.message_text) > 100 THEN
                        SUBSTRING(NEW.message_text FROM 1 FOR 100) || '...'
                    ELSE
                        NEW.message_text
                END,
                NEW.id,
                'message',
                'normal',
                false,
                '/communications?conversation=' || NEW.conversation_id,
                NEW.conversation_id,
                jsonb_build_object(
                    'message_id', NEW.id,
                    'sender_id', NEW.sender_id,
                    'sender_name', COALESCE(sender_info.full_name, 'Mobile User'),
                    'conversation_id', NEW.conversation_id,
                    'conversation_name', COALESCE(conversation_info.conversation_name, 'General'),
                    'project_id', conversation_info.project_id,
                    'project_name', project_name,
                    'message_type', COALESCE(NEW.message_type, 'text'),
                    'source', 'database_trigger'
                ),
                'normal',
                false,
                false
            );
            
            RAISE LOG 'Created notification for admin user: %', admin_user.full_name;
        END LOOP;
        
        RAISE LOG 'Completed creating notifications for message: %', NEW.id;
    ELSE
        RAISE LOG 'Skipping notifications for admin sender: %', sender_info.full_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_message_notifications ON messages;

-- Create the trigger that fires AFTER INSERT on messages
CREATE TRIGGER trigger_create_message_notifications
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION create_message_notifications();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_message_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION create_message_notifications() TO anon;

-- Log successful creation
SELECT 'Message notification trigger created successfully' as status; 