-- Automatic Progress Update Function and Trigger
-- This creates a system that automatically updates project progress 
-- whenever milestone data is modified (INSERT, UPDATE, DELETE)

-- 1. Create the function to recalculate project progress
CREATE OR REPLACE FUNCTION recalculate_project_progress()
RETURNS TRIGGER AS $$
DECLARE
    target_project_id UUID;
    calculated_progress INTEGER;
    milestone_count INTEGER;
    completed_count INTEGER;
BEGIN
    -- Determine which project to update based on the operation
    IF TG_OP = 'DELETE' THEN
        target_project_id := OLD.project_id;
    ELSE
        target_project_id := NEW.project_id;
    END IF;
    
    -- Skip if no project_id (shouldn't happen but safety first)
    IF target_project_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Calculate the new progress based on all milestones for this project
    SELECT 
        COALESCE(ROUND(AVG(progress_percentage)), 0),
        COUNT(*),
        COUNT(CASE WHEN status = 'completed' THEN 1 END)
    INTO calculated_progress, milestone_count, completed_count
    FROM project_milestones 
    WHERE project_id = target_project_id;
    
    -- Update the project with calculated values
    -- Use a direct UPDATE to avoid potential trigger conflicts
    BEGIN
        UPDATE projects 
        SET 
            progress_percentage = calculated_progress,
            total_milestones = milestone_count,
            completed_milestones = completed_count,
            updated_at = NOW()
        WHERE id = target_project_id;
        
        -- Log the update for debugging
        RAISE NOTICE 'Auto-updated project % progress to %% (milestones: %/%)', 
            target_project_id, calculated_progress, completed_count, milestone_count;
            
    EXCEPTION WHEN OTHERS THEN
        -- If update fails, log but don't break the milestone operation
        RAISE NOTICE 'Could not auto-update progress for project %: %', target_project_id, SQLERRM;
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on project_milestones table
DROP TRIGGER IF EXISTS trigger_auto_update_project_progress ON project_milestones;

CREATE TRIGGER trigger_auto_update_project_progress
    AFTER INSERT OR UPDATE OR DELETE ON project_milestones
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_project_progress();

-- 3. Create a manual function for bulk recalculation (for API use)
CREATE OR REPLACE FUNCTION recalculate_all_project_progress()
RETURNS TABLE(
    project_id UUID,
    project_name TEXT,
    old_progress INTEGER,
    new_progress INTEGER,
    milestone_count INTEGER,
    completed_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    UPDATE projects 
    SET 
        progress_percentage = subquery.calculated_progress,
        total_milestones = subquery.milestone_count,
        completed_milestones = subquery.completed_count,
        updated_at = NOW()
    FROM (
        SELECT 
            p.id,
            p.project_name,
            p.progress_percentage as old_progress,
            COALESCE(ROUND(AVG(m.progress_percentage)), 0) as calculated_progress,
            COUNT(m.id) as milestone_count,
            COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_count
        FROM projects p
        LEFT JOIN project_milestones m ON p.id = m.project_id
        GROUP BY p.id, p.project_name, p.progress_percentage
    ) subquery
    WHERE projects.id = subquery.id
    AND (
        projects.progress_percentage != subquery.calculated_progress
        OR projects.total_milestones != subquery.milestone_count  
        OR projects.completed_milestones != subquery.completed_count
    )
    RETURNING 
        projects.id,
        subquery.project_name,
        subquery.old_progress,
        projects.progress_percentage,
        projects.total_milestones,
        projects.completed_milestones;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a function for single project recalculation (safer for API)
CREATE OR REPLACE FUNCTION recalculate_single_project_progress(target_project_id UUID)
RETURNS TABLE(
    success BOOLEAN,
    old_progress INTEGER,
    new_progress INTEGER,
    milestone_count INTEGER,
    completed_count INTEGER,
    message TEXT
) AS $$
DECLARE
    calculated_progress INTEGER;
    milestone_count_val INTEGER;
    completed_count_val INTEGER;
    old_progress_val INTEGER;
BEGIN
    -- Get current progress
    SELECT progress_percentage INTO old_progress_val
    FROM projects WHERE id = target_project_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0, 0, 0, 0, 'Project not found';
        RETURN;
    END IF;
    
    -- Calculate new progress
    SELECT 
        COALESCE(ROUND(AVG(progress_percentage)), 0),
        COUNT(*),
        COUNT(CASE WHEN status = 'completed' THEN 1 END)
    INTO calculated_progress, milestone_count_val, completed_count_val
    FROM project_milestones 
    WHERE project_id = target_project_id;
    
    -- Update the project
    BEGIN
        UPDATE projects 
        SET 
            progress_percentage = calculated_progress,
            total_milestones = milestone_count_val,
            completed_milestones = completed_count_val,
            updated_at = NOW()
        WHERE id = target_project_id;
        
        RETURN QUERY SELECT 
            true,
            old_progress_val,
            calculated_progress,
            milestone_count_val,
            completed_count_val,
            format('Updated progress from %s%% to %s%% based on %s milestones', 
                   old_progress_val, calculated_progress, milestone_count_val);
        RETURN;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false,
            old_progress_val,
            calculated_progress,
            milestone_count_val,
            completed_count_val,
            format('Failed to update: %s', SQLERRM);
        RETURN;
    END;
END;
$$ LANGUAGE plpgsql;

-- 5. Grant permissions for the functions
GRANT EXECUTE ON FUNCTION recalculate_project_progress() TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_project_progress() TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_single_project_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_project_progress() TO service_role;
GRANT EXECUTE ON FUNCTION recalculate_all_project_progress() TO service_role;
GRANT EXECUTE ON FUNCTION recalculate_single_project_progress(UUID) TO service_role;

-- USAGE EXAMPLES:

-- Test single project recalculation:
-- SELECT * FROM recalculate_single_project_progress('7f099897-5ebe-47da-a085-58c6027db672');

-- Bulk recalculate all projects:
-- SELECT * FROM recalculate_all_project_progress();

-- Check if trigger is working by updating a milestone:
-- UPDATE project_milestones SET progress_percentage = 50 WHERE id = 'some-milestone-id'; 