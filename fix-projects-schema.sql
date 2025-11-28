-- Migration: Add missing columns to projects table
-- Date: 2025-11-21

-- Check if columns exist first
DO $$ 
BEGIN
    -- Add pm_user_id if not exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'pm_user_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN pm_user_id VARCHAR(255);
        RAISE NOTICE 'Added pm_user_id column';
    END IF;

    -- Add sales_user_id if not exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'sales_user_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN sales_user_id VARCHAR(255);
        RAISE NOTICE 'Added sales_user_id column';
    END IF;

    -- Add sales_order_id if not exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'sales_order_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN sales_order_id VARCHAR(255);
        RAISE NOTICE 'Added sales_order_id column';
    END IF;

    -- Add total_value if not exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'total_value'
    ) THEN
        ALTER TABLE projects ADD COLUMN total_value DECIMAL(18,2);
        RAISE NOTICE 'Added total_value column';
    END IF;
END $$;

-- Add foreign key constraints if not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'projects_pm_user_id_fkey'
    ) THEN
        ALTER TABLE projects 
        ADD CONSTRAINT projects_pm_user_id_fkey 
        FOREIGN KEY (pm_user_id) REFERENCES users(id);
        RAISE NOTICE 'Added pm_user_id foreign key';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'projects_sales_user_id_fkey'
    ) THEN
        ALTER TABLE projects 
        ADD CONSTRAINT projects_sales_user_id_fkey 
        FOREIGN KEY (sales_user_id) REFERENCES users(id);
        RAISE NOTICE 'Added sales_user_id foreign key';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_pm_user_id ON projects(pm_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_sales_user_id ON projects(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

SELECT 'Migration completed successfully!' as status;
