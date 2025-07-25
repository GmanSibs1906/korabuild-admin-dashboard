-- Dynamic Progress Update Script for All Projects
-- Automatically calculates progress for ALL projects based on milestone completion
-- Suitable for 100+ users and 1000+ projects

-- 1. ANALYSIS: Show current state vs calculated progress for all projects
SELECT 
    p.id,
    p.project_name,
    p.progress_percentage as current_progress,
    p.total_milestones as current_total_milestones,
    p.completed_milestones as current_completed_milestones,
    COALESCE(ROUND(AVG(m.progress_percentage)), 0) as calculated_progress,
    COUNT(m.id) as actual_milestone_count,
    COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as actual_completed_count,
    COUNT(CASE WHEN m.status = 'in_progress' THEN 1 END) as in_progress_count,
    COUNT(CASE WHEN m.status = 'not_started' THEN 1 END) as not_started_count,
    -- Show if update is needed
    CASE 
        WHEN p.progress_percentage != COALESCE(ROUND(AVG(m.progress_percentage)), 0) THEN 'UPDATE_NEEDED'
        WHEN p.total_milestones != COUNT(m.id) THEN 'UPDATE_NEEDED'
        WHEN p.completed_milestones != COUNT(CASE WHEN m.status = 'completed' THEN 1 END) THEN 'UPDATE_NEEDED'
        ELSE 'UP_TO_DATE'
    END as update_status
FROM projects p
LEFT JOIN project_milestones m ON p.id = m.project_id
GROUP BY p.id, p.project_name, p.progress_percentage, p.total_milestones, p.completed_milestones
ORDER BY p.project_name;

-- 2. SUMMARY: Show how many projects need updates
SELECT 
    COUNT(*) as total_projects,
    COUNT(CASE WHEN milestone_count > 0 THEN 1 END) as projects_with_milestones,
    COUNT(CASE WHEN milestone_count = 0 THEN 1 END) as projects_without_milestones,
    COUNT(CASE WHEN needs_update THEN 1 END) as projects_needing_updates
FROM (
    SELECT 
        p.id,
        COUNT(m.id) as milestone_count,
        CASE 
            WHEN p.progress_percentage != COALESCE(ROUND(AVG(m.progress_percentage)), 0) THEN true
            WHEN p.total_milestones != COUNT(m.id) THEN true
            WHEN p.completed_milestones != COUNT(CASE WHEN m.status = 'completed' THEN 1 END) THEN true
            ELSE false
        END as needs_update
    FROM projects p
    LEFT JOIN project_milestones m ON p.id = m.project_id
    GROUP BY p.id, p.progress_percentage, p.total_milestones, p.completed_milestones
) analysis;

-- 3. DYNAMIC UPDATE: Auto-calculate progress for ALL projects with milestones
-- This will update progress for ALL projects based on their actual milestone data
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
WHERE 
    -- Only update projects where values have changed
    (
        progress_percentage != COALESCE((
            SELECT ROUND(AVG(m.progress_percentage))
            FROM project_milestones m 
            WHERE m.project_id = projects.id
        ), 0)
        OR 
        total_milestones != COALESCE((
            SELECT COUNT(*) 
            FROM project_milestones m 
            WHERE m.project_id = projects.id
        ), 0)
        OR 
        completed_milestones != COALESCE((
            SELECT COUNT(*) 
            FROM project_milestones m 
            WHERE m.project_id = projects.id 
            AND m.status = 'completed'
        ), 0)
    );
*/

-- 4. VERIFICATION: Check results after running the update
/*
SELECT 
    'AFTER UPDATE' as status,
    COUNT(*) as total_projects,
    COUNT(CASE WHEN total_milestones > 0 THEN 1 END) as projects_with_milestones,
    AVG(progress_percentage) as avg_progress_across_all_projects,
    MIN(progress_percentage) as min_progress,
    MAX(progress_percentage) as max_progress,
    COUNT(CASE WHEN progress_percentage = 100 THEN 1 END) as completed_projects,
    COUNT(CASE WHEN progress_percentage = 0 THEN 1 END) as not_started_projects
FROM projects;
*/

-- 5. DETAILED VERIFICATION: Show updated projects
/*
SELECT 
    p.project_name,
    u.full_name as client_name,
    p.progress_percentage,
    p.total_milestones,
    p.completed_milestones,
    p.status,
    p.updated_at
FROM projects p
LEFT JOIN users u ON p.client_id = u.id
WHERE p.updated_at >= NOW() - INTERVAL '5 minutes'
ORDER BY p.updated_at DESC;
*/

-- 6. PERFORMANCE MONITORING: For large datasets (1000+ projects)
/*
SELECT 
    'Performance Stats' as info,
    COUNT(*) as total_projects_processed,
    COUNT(CASE WHEN total_milestones > 0 THEN 1 END) as projects_with_data,
    AVG(total_milestones) as avg_milestones_per_project,
    MAX(total_milestones) as max_milestones_in_project,
    COUNT(CASE WHEN progress_percentage != LAG(progress_percentage) OVER (ORDER BY updated_at) THEN 1 END) as projects_actually_updated
FROM projects
WHERE updated_at >= NOW() - INTERVAL '10 minutes';
*/

-- INSTRUCTIONS:
-- 1. Run the ANALYSIS query first to see current state
-- 2. Run the SUMMARY query to see how many projects need updates  
-- 3. Uncomment and run the DYNAMIC UPDATE to fix all projects
-- 4. Run VERIFICATION queries to confirm updates worked
-- 5. For ongoing maintenance, set up this as a scheduled job 