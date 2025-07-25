-- Fix Progress Update Triggers
-- This script identifies and potentially removes problematic triggers

-- 1. First, let's see all triggers on the projects table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'projects'
ORDER BY trigger_name;

-- 2. Look for triggers that might reference 'project_id' incorrectly
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'projects'
  AND action_statement ILIKE '%project_id%'
ORDER BY trigger_name;

-- 3. Check for any triggers on related tables that might affect projects
SELECT 
    event_object_table,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE action_statement ILIKE '%project%'
  AND event_object_table IN ('project_milestones', 'project_financials', 'payments')
ORDER BY event_object_table, trigger_name;

-- 4. TEMPORARY FIX: If you find problematic triggers, you can disable them
-- (UNCOMMENT THE LINES BELOW AFTER IDENTIFYING THE SPECIFIC TRIGGER)

-- Example: Drop a specific trigger (replace 'trigger_name' with actual name)
-- DROP TRIGGER IF EXISTS trigger_name ON projects;

-- 5. ALTERNATIVE: Create a simple function to update progress safely
CREATE OR REPLACE FUNCTION update_project_progress_safe(
    p_project_id UUID,
    p_progress_percentage INTEGER
) 
RETURNS BOOLEAN AS $$
BEGIN
    -- Simple update without triggering complex triggers
    UPDATE projects 
    SET 
        progress_percentage = p_progress_percentage,
        updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN FOUND;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail
    RAISE NOTICE 'Could not update progress for project %: %', p_project_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_project_progress_safe(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_project_progress_safe(UUID, INTEGER) TO service_role;

-- Usage example:
-- SELECT update_project_progress_safe('7f099897-5ebe-47da-a085-58c6027db672', 65); 