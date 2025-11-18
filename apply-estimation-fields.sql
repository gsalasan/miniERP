-- Migration: Add estimation request fields (Safe version)
-- Feature 3.1.D: Proses Permintaan Estimasi
-- Date: 2025-11-07

-- Add new columns for estimation request feature (IF NOT EXISTS to be safe)
DO $$ 
BEGIN
    -- Add requested_by_user_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='estimations' AND column_name='requested_by_user_id'
    ) THEN
        ALTER TABLE estimations ADD COLUMN requested_by_user_id VARCHAR(255);
    END IF;

    -- Add assigned_to_user_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='estimations' AND column_name='assigned_to_user_id'
    ) THEN
        ALTER TABLE estimations ADD COLUMN assigned_to_user_id VARCHAR(255);
    END IF;

    -- Add technical_brief column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='estimations' AND column_name='technical_brief'
    ) THEN
        ALTER TABLE estimations ADD COLUMN technical_brief TEXT;
    END IF;

    -- Add attachments column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='estimations' AND column_name='attachments'
    ) THEN
        ALTER TABLE estimations ADD COLUMN attachments JSONB;
    END IF;

    -- Add created_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='estimations' AND column_name='created_at'
    ) THEN
        ALTER TABLE estimations ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='estimations' AND column_name='updated_at'
    ) THEN
        ALTER TABLE estimations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add unique constraint for (project_id, version) if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'estimations_project_version_unique'
    ) THEN
        ALTER TABLE estimations 
        ADD CONSTRAINT estimations_project_version_unique UNIQUE (project_id, version);
    END IF;
END $$;

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_estimations_project_id ON estimations(project_id);
CREATE INDEX IF NOT EXISTS idx_estimations_created_at ON estimations(created_at DESC);

-- Update existing rows to set default timestamps (if any)
UPDATE estimations 
SET created_at = COALESCE(created_at, NOW()), 
    updated_at = COALESCE(updated_at, NOW()) 
WHERE created_at IS NULL OR updated_at IS NULL;

-- Add comments
COMMENT ON COLUMN estimations.requested_by_user_id IS 'Sales user who requested the initial estimation';
COMMENT ON COLUMN estimations.assigned_to_user_id IS 'Assigned engineer (Project Engineer) or manager';
COMMENT ON COLUMN estimations.technical_brief IS 'Technical brief / summary of requirements provided by Sales';
COMMENT ON COLUMN estimations.attachments IS 'Attachment URLs (e.g., drawings, RFQ) stored as JSON array of strings';
