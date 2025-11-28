-- 02_create_placeholder_hr_employees.sql
-- Inserts placeholder hr_employees for any employee_id referenced in hr_attendances
-- that do not exist in hr_employees. This allows adding the FK non-destructively.
-- IMPORTANT: take a backup before running.

INSERT INTO hr_employees (id, employee_id, full_name, first_name, last_name, email, position, hire_date, basic_salary, created_at, updated_at)
SELECT DISTINCT a.employee_id AS id,
                a.employee_id AS employee_id,
                'Unknown Employee' AS full_name,
                'Unknown' AS first_name,
                'Unknown' AS last_name,
                (a.employee_id || '@example.invalid') AS email,
                'Unknown' AS position,
                NOW() AS hire_date,
                0 AS basic_salary,
                NOW() AS created_at,
                NOW() AS updated_at
FROM hr_attendances a
LEFT JOIN hr_employees e ON a.employee_id = e.id
WHERE e.id IS NULL
  AND a.employee_id IS NOT NULL;

-- After running, verify there are no orphans:
-- SELECT COUNT(*) FROM hr_attendances a LEFT JOIN hr_employees e ON a.employee_id=e.id WHERE e.id IS NULL;
