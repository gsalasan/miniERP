/*
  Warnings:

  - The values [WORK_FROM_HOME,ON_LEAVE] on the enum `AttendanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [A_POSITIVE,A_NEGATIVE,B_POSITIVE,B_NEGATIVE,AB_POSITIVE,AB_NEGATIVE,O_POSITIVE,O_NEGATIVE] on the enum `BloodType` will be removed. If these variants are still used in the database, this will fail.
  - The values [CERTIFICATION,OTHER] on the enum `EducationLevel` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUSPENDED] on the enum `EmployeeStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [INTERN] on the enum `EmploymentType` will be removed. If these variants are still used in the database, this will fail.
  - The values [OTHER,PREFER_NOT_TO_SAY] on the enum `Gender` will be removed. If these variants are still used in the database, this will fail.
  - The values [ANNUAL_LEAVE,SICK_LEAVE,MATERNITY_LEAVE,PATERNITY_LEAVE,EMERGENCY_LEAVE,UNPAID_LEAVE,STUDY_LEAVE,COMPENSATORY_LEAVE] on the enum `LeaveType` will be removed. If these variants are still used in the database, this will fail.
  - The values [SEPARATED] on the enum `MaritalStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROSPECT');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense');

-- AlterEnum
BEGIN;
CREATE TYPE "AttendanceStatus_new" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'SICK_LEAVE', 'VACATION');
ALTER TABLE "public"."hr_attendances" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "hr_attendances" ALTER COLUMN "status" TYPE "AttendanceStatus_new" USING ("status"::text::"AttendanceStatus_new");
ALTER TYPE "AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE "public"."AttendanceStatus_old";
ALTER TABLE "hr_attendances" ALTER COLUMN "status" SET DEFAULT 'PRESENT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "BloodType_new" AS ENUM ('A', 'B', 'AB', 'O');
ALTER TABLE "hr_employees" ALTER COLUMN "blood_type" TYPE "BloodType_new" USING ("blood_type"::text::"BloodType_new");
ALTER TYPE "BloodType" RENAME TO "BloodType_old";
ALTER TYPE "BloodType_new" RENAME TO "BloodType";
DROP TYPE "public"."BloodType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EducationLevel_new" AS ENUM ('HIGH_SCHOOL', 'DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE');
ALTER TABLE "hr_employees" ALTER COLUMN "education_level" TYPE "EducationLevel_new" USING ("education_level"::text::"EducationLevel_new");
ALTER TYPE "EducationLevel" RENAME TO "EducationLevel_old";
ALTER TYPE "EducationLevel_new" RENAME TO "EducationLevel";
DROP TYPE "public"."EducationLevel_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EmployeeStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE', 'PROBATION');
ALTER TABLE "public"."hr_employees" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "hr_employees" ALTER COLUMN "status" TYPE "EmployeeStatus_new" USING ("status"::text::"EmployeeStatus_new");
ALTER TYPE "EmployeeStatus" RENAME TO "EmployeeStatus_old";
ALTER TYPE "EmployeeStatus_new" RENAME TO "EmployeeStatus";
DROP TYPE "public"."EmployeeStatus_old";
ALTER TABLE "hr_employees" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EmploymentType_new" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE');
ALTER TABLE "public"."hr_employees" ALTER COLUMN "employment_type" DROP DEFAULT;
ALTER TABLE "hr_employees" ALTER COLUMN "employment_type" TYPE "EmploymentType_new" USING ("employment_type"::text::"EmploymentType_new");
ALTER TYPE "EmploymentType" RENAME TO "EmploymentType_old";
ALTER TYPE "EmploymentType_new" RENAME TO "EmploymentType";
DROP TYPE "public"."EmploymentType_old";
ALTER TABLE "hr_employees" ALTER COLUMN "employment_type" SET DEFAULT 'FULL_TIME';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Gender_new" AS ENUM ('MALE', 'FEMALE');
ALTER TABLE "hr_employees" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "public"."Gender_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "LeaveType_new" AS ENUM ('ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'UNPAID');
ALTER TABLE "hr_leave_requests" ALTER COLUMN "leave_type" TYPE "LeaveType_new" USING ("leave_type"::text::"LeaveType_new");
ALTER TYPE "LeaveType" RENAME TO "LeaveType_old";
ALTER TYPE "LeaveType_new" RENAME TO "LeaveType";
DROP TYPE "public"."LeaveType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MaritalStatus_new" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');
ALTER TABLE "hr_employees" ALTER COLUMN "marital_status" TYPE "MaritalStatus_new" USING ("marital_status"::text::"MaritalStatus_new");
ALTER TYPE "MaritalStatus" RENAME TO "MaritalStatus_old";
ALTER TYPE "MaritalStatus_new" RENAME TO "MaritalStatus";
DROP TYPE "public"."MaritalStatus_old";
COMMIT;

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contact_person" TEXT,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "status" "CustomerStatus" NOT NULL,
    "top_days" INTEGER NOT NULL,
    "assigned_sales_id" TEXT,
    "credit_limit" DOUBLE PRECISION,
    "no_npwp" TEXT,
    "sppkp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartOfAccounts" (
    "id" SERIAL NOT NULL,
    "account_code" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChartOfAccounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccounts_account_code_key" ON "ChartOfAccounts"("account_code");

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
