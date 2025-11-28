-- Query untuk cek pipeline data
-- Jalankan di PostgreSQL client atau Prisma Studio

-- 1. Cek semua projects dan statusnya
SELECT 
    p.project_name,
    p.status,
    p.estimated_value,
    p.lead_score,
    p.priority,
    c.customer_name,
    c.city
FROM projects p
JOIN customers c ON p.customer_id = c.id
ORDER BY p.status, p.created_at;

-- 2. Pipeline summary by status
SELECT 
    status,
    COUNT(*) as project_count,
    SUM(estimated_value) as total_value,
    AVG(lead_score) as avg_lead_score
FROM projects
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'PROSPECT' THEN 1
        WHEN 'MEETING_SCHEDULED' THEN 2
        WHEN 'PRE_SALES' THEN 3
        WHEN 'PROPOSAL_DELIVERED' THEN 4
        WHEN 'NEGOTIATION' THEN 5
        WHEN 'WON' THEN 6
        WHEN 'LOST' THEN 7
        ELSE 8
    END;

-- 3. Recent project activities
SELECT 
    pa.description,
    pa.performed_at,
    pa.activity_type,
    p.project_name,
    c.customer_name
FROM project_activities pa
JOIN projects p ON pa.project_id = p.id
JOIN customers c ON p.customer_id = c.id
ORDER BY pa.performed_at DESC
LIMIT 10;

-- 4. Projects by sales user
SELECT 
    p.sales_user_id,
    COUNT(*) as project_count,
    SUM(estimated_value) as total_pipeline_value,
    string_agg(DISTINCT p.status, ', ') as statuses
FROM projects p
WHERE p.sales_user_id IS NOT NULL
GROUP BY p.sales_user_id;

-- 5. High priority prospects
SELECT 
    p.project_name,
    p.status,
    p.priority,
    p.estimated_value,
    p.expected_close_date,
    c.customer_name
FROM projects p
JOIN customers c ON p.customer_id = c.id
WHERE p.priority IN ('HIGH', 'URGENT')
AND p.status NOT IN ('WON', 'LOST')
ORDER BY 
    CASE priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 ELSE 3 END,
    p.expected_close_date;