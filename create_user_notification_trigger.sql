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

-- Create trigger on users table for INSERT operations
DROP TRIGGER IF EXISTS trigger_user_created ON public.users;

CREATE TRIGGER trigger_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_created();

-- Enable Row Level Security for notifications table (if not already enabled)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

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

-- Comment for documentation
COMMENT ON FUNCTION notify_user_created() IS 'Trigger function that creates notifications for admin users when a new user registers from the mobile app';

COMMENT ON TRIGGER trigger_user_created ON public.users IS 'Triggers notification creation when new users are inserted into the users table'; 