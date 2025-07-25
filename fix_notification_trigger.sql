-- Fix Notification Trigger Issue
-- The error shows: create_project_update_notification() is trying to access NEW.project_id
-- This function is likely triggered on the wrong table or context

-- 1. IDENTIFY: Find the problematic trigger and function
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE action_statement ILIKE '%create_project_update_notification%'
ORDER BY event_object_table, trigger_name;

-- 2. EXAMINE: Look at the function definition
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_project_update_notification';

-- 3. FIND: All triggers that might be affecting projects table
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'projects'
ORDER BY trigger_name;

-- 4. TEMPORARY FIX: Disable the problematic trigger
-- (Uncomment after confirming the trigger name)
/*
DROP TRIGGER IF EXISTS trigger_create_project_update_notification ON projects;
*/

-- 5. ALTERNATIVE FIX: Modify the function to handle missing fields safely
-- Create a safer version of the notification function
CREATE OR REPLACE FUNCTION create_project_update_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    notification_title TEXT;
    notification_message TEXT;
    target_project_id UUID;
BEGIN
    -- Safely determine the project_id based on the table context
    IF TG_TABLE_NAME = 'projects' THEN
        -- For projects table, use NEW.id (not NEW.project_id)
        target_project_id := NEW.id;
        target_client_id := NEW.client_id;
    ELSIF TG_TABLE_NAME = 'project_milestones' OR TG_TABLE_NAME = 'project_updates' THEN
        -- For related tables, use NEW.project_id
        target_project_id := NEW.project_id;
        -- Get client_id from projects table
        SELECT client_id INTO target_client_id
        FROM projects 
        WHERE id = target_project_id;
    ELSE
        -- For other tables, try to find project_id field
        BEGIN
            target_project_id := (to_jsonb(NEW) ->> 'project_id')::UUID;
            IF target_project_id IS NOT NULL THEN
                SELECT client_id INTO target_client_id
                FROM projects 
                WHERE id = target_project_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- If we can't determine project_id, skip notification
            RETURN NEW;
        END;
    END IF;
    
    -- Skip if no valid project or client
    IF target_project_id IS NULL OR target_client_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Create appropriate notification based on operation
    IF TG_OP = 'UPDATE' THEN
        notification_title := 'Project Updated';
        notification_message := format('Project %s has been updated', 
            COALESCE((SELECT project_name FROM projects WHERE id = target_project_id), 'Unknown'));
    ELSIF TG_OP = 'INSERT' THEN
        notification_title := 'New Project Activity';
        notification_message := format('New activity in project %s', 
            COALESCE((SELECT project_name FROM projects WHERE id = target_project_id), 'Unknown'));
    ELSE
        notification_title := 'Project Change';
        notification_message := 'Project has been modified';
    END IF;
    
    -- Insert notification safely
    BEGIN
        INSERT INTO notifications (
            user_id,
            project_id,
            notification_type,
            title,
            message,
            priority,
            created_at
        ) VALUES (
            target_client_id,
            target_project_id,
            'project_update',
            notification_title,
            notification_message,
            'normal',
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        -- If notification insert fails, log but don't break the main operation
        RAISE NOTICE 'Failed to create notification for project %: %', target_project_id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. SAFE UPDATE: Now we can safely update projects without trigger errors
-- Test with a single project first:
/*
UPDATE projects 
SET progress_percentage = 65, updated_at = NOW() 
WHERE id = '7f099897-5ebe-47da-a085-58c6027db672';
*/

-- 7. BULK UPDATE: After confirming the fix works, update all projects
/*
UPDATE projects 
SET 
    progress_percentage = COALESCE((
        SELECT ROUND(AVG(m.progress_percentage))
        FROM project_milestones m 
        WHERE m.project_id = projects.id
    ), 0),
    total_milestones = COALESCE((
        SELECT COUNT(*) 
        FROM project_milestones m 
        WHERE m.project_id = projects.id
    ), 0),
    completed_milestones = COALESCE((
        SELECT COUNT(*) 
        FROM project_milestones m 
        WHERE m.project_id = projects.id 
        AND m.status = 'completed'
    ), 0),
    updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM project_milestones m WHERE m.project_id = projects.id
);
*/

-- 8. VERIFICATION: Check if the fix worked
/*
SELECT 
    project_name,
    progress_percentage,
    total_milestones,
    completed_milestones,
    updated_at
FROM projects 
WHERE updated_at >= NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC;
*/

-- INSTRUCTIONS:
-- 1. Run queries 1-3 to identify the problematic trigger
-- 2. Run query 5 to create the safer notification function
-- 3. Test with query 6 (single project update)
-- 4. If successful, run query 7 (bulk update)
-- 5. Verify with query 8 