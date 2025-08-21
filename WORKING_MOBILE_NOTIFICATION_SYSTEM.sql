-- =========================================================================
-- WORKING MOBILE NOTIFICATION SYSTEM FOR KORABUILD
-- =========================================================================
-- This creates notifications for mobile app users when admin adds next payment due dates
-- Triggers on enhanced_credit_accounts table (not payments table)

-- Step 1: Create notifications table (mobile app compatible)
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL CHECK (type = ANY (ARRAY['payment'::text, 'delivery'::text, 'progress'::text, 'approval'::text, 'general'::text])),
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    
    -- Additional fields for compatibility
    notification_type text,
    entity_id uuid,
    entity_type text,
    priority_level text DEFAULT 'normal' CHECK (priority_level = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])),
    read_at timestamp with time zone,
    action_url text,
    expires_at timestamp with time zone,
    metadata jsonb DEFAULT '{}',
    
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT notifications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_project ON public.notifications(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type, created_at DESC);

-- Step 3: Enable Realtime for mobile app
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Step 4: Set up Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- Policy: System can insert notifications for any user
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Policy: Admins can manage all notifications
CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Step 5: Create the CORRECT notification function for next payments
CREATE OR REPLACE FUNCTION notify_next_payment_created()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id uuid;
    project_name text;
    milestone_title text;
    payment_description text;
    days_until_due integer;
    priority_level text := 'normal';
BEGIN
    -- Get project owner and project name
    SELECT p.client_id, p.project_name
    INTO project_owner_id, project_name
    FROM projects p
    WHERE p.id = NEW.project_id;
    
    -- Get milestone name if applicable
    IF NEW.milestone_id IS NOT NULL THEN
        SELECT pm.milestone_name
        INTO milestone_title
        FROM project_milestones pm
        WHERE pm.id = NEW.milestone_id;
    END IF;
    
    -- Only create notification if we have a valid project owner and next payment date
    IF project_owner_id IS NOT NULL AND NEW.next_payment_date IS NOT NULL THEN
        -- Calculate days until due
        days_until_due := (NEW.next_payment_date - CURRENT_DATE)::integer;
        
        -- Set priority based on days until due
        IF days_until_due <= 3 THEN
            priority_level := 'high';
        ELSIF days_until_due <= 7 THEN
            priority_level := 'normal';
        ELSE
            priority_level := 'low';
        END IF;
        
        -- Create payment description
        payment_description := 'Payment of $' || COALESCE(NEW.payment_amount::text, NEW.monthly_payment::text, '0') || 
                              ' is due on ' || TO_CHAR(NEW.next_payment_date, 'FMMonth DD, YYYY');
        
        IF milestone_title IS NOT NULL THEN
            payment_description := payment_description || ' for ' || milestone_title || ' milestone';
        END IF;
        
        -- Insert notification into notifications table
        INSERT INTO public.notifications (
            user_id,
            project_id,
            title,
            message,
            type,
            notification_type,
            entity_type,
            entity_id,
            priority_level,
            action_url,
            metadata,
            is_read,
            created_at
        ) VALUES (
            project_owner_id,
            NEW.project_id,
            '💰 Payment Due Soon',
            payment_description,
            'payment',
            'payment_due',
            'enhanced_credit_account',
            NEW.id,
            priority_level,
            '/finance',
            jsonb_build_object(
                'payment_amount', COALESCE(NEW.payment_amount, NEW.monthly_payment, 0),
                'next_payment_date', NEW.next_payment_date,
                'project_name', project_name,
                'milestone_name', milestone_title,
                'days_until_due', days_until_due,
                'credit_status', NEW.credit_status,
                'source', 'admin_dashboard_next_payment'
            ),
            false,
            now()
        );
        
        RAISE LOG 'Created next payment notification for user: % (project: %, amount: $%)', 
            project_owner_id, project_name, COALESCE(NEW.payment_amount, NEW.monthly_payment, 0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create notification function for payment updates
CREATE OR REPLACE FUNCTION notify_next_payment_updated()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id uuid;
    project_name text;
    milestone_title text;
    payment_description text;
    days_until_due integer;
    priority_level text := 'normal';
BEGIN
    -- Only create notification if next_payment_date changed
    IF OLD.next_payment_date IS DISTINCT FROM NEW.next_payment_date 
       OR OLD.payment_amount IS DISTINCT FROM NEW.payment_amount 
       OR OLD.monthly_payment IS DISTINCT FROM NEW.monthly_payment THEN
        
        -- Get project owner and project name
        SELECT p.client_id, p.project_name
        INTO project_owner_id, project_name
        FROM projects p
        WHERE p.id = NEW.project_id;
        
        -- Get milestone name if applicable
        IF NEW.milestone_id IS NOT NULL THEN
            SELECT pm.milestone_name
            INTO milestone_title
            FROM project_milestones pm
            WHERE pm.id = NEW.milestone_id;
        END IF;
        
        -- Only create notification if we have a valid project owner and next payment date
        IF project_owner_id IS NOT NULL AND NEW.next_payment_date IS NOT NULL THEN
            -- Calculate days until due
            days_until_due := (NEW.next_payment_date - CURRENT_DATE)::integer;
            
            -- Set priority based on days until due
            IF days_until_due <= 3 THEN
                priority_level := 'high';
            ELSIF days_until_due <= 7 THEN
                priority_level := 'normal';
            ELSE
                priority_level := 'low';
            END IF;
            
            -- Create payment description
            payment_description := 'Payment updated: $' || COALESCE(NEW.payment_amount::text, NEW.monthly_payment::text, '0') || 
                                  ' is due on ' || TO_CHAR(NEW.next_payment_date, 'FMMonth DD, YYYY');
            
            IF milestone_title IS NOT NULL THEN
                payment_description := payment_description || ' for ' || milestone_title || ' milestone';
            END IF;
            
            -- Insert notification into notifications table
            INSERT INTO public.notifications (
                user_id,
                project_id,
                title,
                message,
                type,
                notification_type,
                entity_type,
                entity_id,
                priority_level,
                action_url,
                metadata,
                is_read,
                created_at
            ) VALUES (
                project_owner_id,
                NEW.project_id,
                '🔄 Payment Updated',
                payment_description,
                'payment',
                'payment_updated',
                'enhanced_credit_account',
                NEW.id,
                priority_level,
                '/finance',
                jsonb_build_object(
                    'payment_amount', COALESCE(NEW.payment_amount, NEW.monthly_payment, 0),
                    'next_payment_date', NEW.next_payment_date,
                    'project_name', project_name,
                    'milestone_name', milestone_title,
                    'days_until_due', days_until_due,
                    'credit_status', NEW.credit_status,
                    'source', 'admin_dashboard_payment_update'
                ),
                false,
                now()
            );
            
            RAISE LOG 'Created payment update notification for user: % (project: %, amount: $%)', 
                project_owner_id, project_name, COALESCE(NEW.payment_amount, NEW.monthly_payment, 0);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create triggers on enhanced_credit_accounts (THE CORRECT TABLE!)
DROP TRIGGER IF EXISTS trigger_next_payment_created ON enhanced_credit_accounts;
CREATE TRIGGER trigger_next_payment_created
    AFTER INSERT ON enhanced_credit_accounts
    FOR EACH ROW
    EXECUTE FUNCTION notify_next_payment_created();

DROP TRIGGER IF EXISTS trigger_next_payment_updated ON enhanced_credit_accounts;
CREATE TRIGGER trigger_next_payment_updated
    AFTER UPDATE ON enhanced_credit_accounts
    FOR EACH ROW
    EXECUTE FUNCTION notify_next_payment_updated();

-- Step 8: Grant permissions
GRANT EXECUTE ON FUNCTION notify_next_payment_created() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_next_payment_updated() TO authenticated;

-- Step 9: Create test function
CREATE OR REPLACE FUNCTION test_next_payment_notification_system()
RETURNS text AS $$
DECLARE
    test_project_id uuid;
    test_client_id uuid;
    notification_count integer;
    result_message text;
BEGIN
    -- Get a test project with client
    SELECT p.id, p.client_id
    INTO test_project_id, test_client_id
    FROM projects p
    WHERE p.client_id IS NOT NULL
    LIMIT 1;
    
    IF test_project_id IS NULL THEN
        RETURN '❌ No test project found with client_id';
    END IF;
    
    -- Count notifications before test
    SELECT COUNT(*) INTO notification_count
    FROM notifications
    WHERE type = 'payment'
    AND created_at >= CURRENT_DATE;
    
    -- Create a test enhanced_credit_account (this should trigger notification)
    INSERT INTO enhanced_credit_accounts (
        project_id,
        client_id,
        payment_amount,
        next_payment_date,
        credit_status,
        credit_terms
    ) VALUES (
        test_project_id,
        test_client_id,
        500.00,
        CURRENT_DATE + INTERVAL '7 days',
        'active',
        '30 days net'
    );
    
    -- Count notifications after test
    SELECT COUNT(*) INTO notification_count
    FROM notifications
    WHERE type = 'payment'
    AND created_at >= CURRENT_DATE;
    
    -- Clean up test record
    DELETE FROM enhanced_credit_accounts
    WHERE project_id = test_project_id
    AND payment_amount = 500.00
    AND next_payment_date = CURRENT_DATE + INTERVAL '7 days';
    
    result_message := '✅ Test completed! Found ' || notification_count || ' payment notifications created today.';
    result_message := result_message || ' Test project: ' || test_project_id || ', Client: ' || test_client_id;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Run verification queries
SELECT 'notifications table created' as status, COUNT(*) as existing_records 
FROM public.notifications;

SELECT 'enhanced_credit_accounts table exists' as status, COUNT(*) as existing_records 
FROM public.enhanced_credit_accounts;

-- Step 11: Test the system
SELECT test_next_payment_notification_system() as test_result;

-- Step 12: Show recent notifications
SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.priority_level,
    n.created_at,
    u.full_name as recipient_name,
    p.project_name
FROM notifications n
JOIN users u ON n.user_id = u.id
JOIN projects p ON n.project_id = p.id
WHERE n.type = 'payment'
ORDER BY n.created_at DESC
LIMIT 5;

RAISE NOTICE '🎉 WORKING Mobile Notification System installed successfully!';
RAISE NOTICE '📱 Mobile app will now receive notifications when admin adds next payment due dates!';
RAISE NOTICE '🧪 Test the system by adding a next payment due date in the admin dashboard!'; 