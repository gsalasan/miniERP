-- Migration: Convert ProjectStatus from ENUM to VARCHAR for dynamic pipeline boards
-- This allows users to create custom status columns without manual database migrations

BEGIN;

-- Step 1: Add temporary VARCHAR column
ALTER TABLE projects ADD COLUMN status_new VARCHAR(100);

-- Step 2: Copy existing ENUM values to VARCHAR
UPDATE projects SET status_new = status::text;

-- Step 3: Drop old ENUM column
ALTER TABLE projects DROP COLUMN status;

-- Step 4: Rename new column to original name
ALTER TABLE projects RENAME COLUMN status_new TO status;

-- Step 5: Add NOT NULL constraint (assuming status should always have a value)
ALTER TABLE projects ALTER COLUMN status SET NOT NULL;

-- Step 6: Add default value for new projects
ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'PROSPECT';

-- Step 7: Create index for better query performance
CREATE INDEX idx_projects_status ON projects(status);

-- Step 8: Drop the old ENUM type (no longer needed)
DROP TYPE IF EXISTS "ProjectStatus";

COMMIT;
