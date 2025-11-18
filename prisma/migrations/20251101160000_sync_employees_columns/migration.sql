-- Ensure required enum types exist (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Gender') THEN
    CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MaritalStatus') THEN
    CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BloodType') THEN
    CREATE TYPE "BloodType" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmploymentType') THEN
    CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmployeeStatus') THEN
    CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE', 'PROBATION');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EducationLevel') THEN
    CREATE TYPE "EducationLevel" AS ENUM ('HIGH_SCHOOL', 'DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE');
  END IF;
END$$;

-- Make sure BloodType enum contains all expected values (supports Postgres with IF NOT EXISTS)
ALTER TYPE "BloodType" ADD VALUE IF NOT EXISTS 'A_POSITIVE';
ALTER TYPE "BloodType" ADD VALUE IF NOT EXISTS 'A_NEGATIVE';
ALTER TYPE "BloodType" ADD VALUE IF NOT EXISTS 'B_POSITIVE';
ALTER TYPE "BloodType" ADD VALUE IF NOT EXISTS 'B_NEGATIVE';
ALTER TYPE "BloodType" ADD VALUE IF NOT EXISTS 'AB_POSITIVE';
ALTER TYPE "BloodType" ADD VALUE IF NOT EXISTS 'AB_NEGATIVE';
ALTER TYPE "BloodType" ADD VALUE IF NOT EXISTS 'O_POSITIVE';
ALTER TYPE "BloodType" ADD VALUE IF NOT EXISTS 'O_NEGATIVE';

-- Add missing columns to legacy employees table
ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "department" TEXT,
  ADD COLUMN IF NOT EXISTS "gender" "Gender",
  ADD COLUMN IF NOT EXISTS "marital_status" "MaritalStatus",
  ADD COLUMN IF NOT EXISTS "blood_type" "BloodType",
  ADD COLUMN IF NOT EXISTS "employment_type" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
  ADD COLUMN IF NOT EXISTS "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "education_level" "EducationLevel";
