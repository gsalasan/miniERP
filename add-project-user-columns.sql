-- Add pm_user_id and sales_user_id columns to projects table if they don't exist
DO $$ 
BEGIN
    -- Add pm_user_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'pm_user_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN pm_user_id VARCHAR(255);
        RAISE NOTICE 'Added pm_user_id column';
    END IF;

    -- Add sales_user_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'sales_user_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN sales_user_id VARCHAR(255);
        RAISE NOTICE 'Added sales_user_id column';
    END IF;
END $$;

-- Clean up invalid references (set to NULL if user doesn't exist)
UPDATE projects 
SET pm_user_id = NULL 
WHERE pm_user_id IS NOT NULL 
  AND pm_user_id NOT IN (SELECT id FROM users);

UPDATE projects 
SET sales_user_id = NULL 
WHERE sales_user_id IS NOT NULL 
  AND sales_user_id NOT IN (SELECT id FROM users);

-- Now add foreign key constraints
DO $$
BEGIN
    -- Add foreign key constraint for pm_user_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_pm_user_id_fkey'
    ) THEN
        ALTER TABLE projects 
        ADD CONSTRAINT projects_pm_user_id_fkey 
        FOREIGN KEY (pm_user_id) REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added pm_user_id foreign key';
    END IF;

    -- Add foreign key constraint for sales_user_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_sales_user_id_fkey'
    ) THEN
        ALTER TABLE projects 
        ADD CONSTRAINT projects_sales_user_id_fkey 
        FOREIGN KEY (sales_user_id) REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added sales_user_id foreign key';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_pm_user_id ON projects(pm_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_sales_user_id ON projects(sales_user_id);

SELECT 'Migration completed successfully' as status;
