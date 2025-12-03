-- Create project_tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id VARCHAR(36) REFERENCES project_milestones(id) ON DELETE SET NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  assignee_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'TODO',
  progress INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create TaskStatus enum
DO $$ BEGIN
  CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update status column to use enum
ALTER TABLE project_tasks ALTER COLUMN status TYPE "TaskStatus" USING status::"TaskStatus";

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_milestone_id ON project_tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee_id ON project_tasks(assignee_id);
