-- Adds missing attendance columns expected by Prisma schema
ALTER TABLE "hr_attendances" ADD COLUMN IF NOT EXISTS "check_in_latitude" DECIMAL(10,8);
ALTER TABLE "hr_attendances" ADD COLUMN IF NOT EXISTS "check_in_longitude" DECIMAL(11,8);
ALTER TABLE "hr_attendances" ADD COLUMN IF NOT EXISTS "check_in_location" TEXT;
ALTER TABLE "hr_attendances" ADD COLUMN IF NOT EXISTS "check_out_latitude" DECIMAL(10,8);
ALTER TABLE "hr_attendances" ADD COLUMN IF NOT EXISTS "check_out_longitude" DECIMAL(11,8);
ALTER TABLE "hr_attendances" ADD COLUMN IF NOT EXISTS "check_out_location" TEXT;
ALTER TABLE "hr_attendances" ADD COLUMN IF NOT EXISTS "work_duration_minutes" INTEGER;
