-- Fix status column
ALTER TABLE project_tasks ALTER COLUMN status DROP DEFAULT;
ALTER TABLE project_tasks ALTER COLUMN status TYPE "TaskStatus" USING status::"TaskStatus";
ALTER TABLE project_tasks ALTER COLUMN status SET DEFAULT 'TODO'::"TaskStatus";
