-- CreateEnum untuk tipe permission, overtime, dan reimbursement
CREATE TYPE "PermissionType" AS ENUM ('PERSONAL', 'MEDICAL', 'FAMILY_EMERGENCY', 'OFFICIAL_BUSINESS', 'OTHER');
CREATE TYPE "OvertimeCode" AS ENUM ('L1', 'L2', 'L3', 'L4');
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "ReimbursementType" AS ENUM ('TRANSPORTATION', 'MEALS', 'ACCOMMODATION', 'COMMUNICATION', 'MEDICAL', 'OFFICE_SUPPLIES', 'TRAINING', 'OTHER');

-- CreateTable hr_permission_requests
CREATE TABLE "hr_permission_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "permission_type" "PermissionType" NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "duration_hours" DECIMAL(5,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_permission_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable hr_overtime_requests
CREATE TABLE "hr_overtime_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "overtime_code" "OvertimeCode" NOT NULL,
    "overtime_date" DATE NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "duration_hours" DECIMAL(5,2) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_overtime_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable hr_reimbursement_requests
CREATE TABLE "hr_reimbursement_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "reimbursement_type" "ReimbursementType" NOT NULL,
    "claim_date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "description" TEXT NOT NULL,
    "receipt_file" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_reimbursement_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "hr_permission_requests" ADD CONSTRAINT "hr_permission_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_overtime_requests" ADD CONSTRAINT "hr_overtime_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_reimbursement_requests" ADD CONSTRAINT "hr_reimbursement_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
