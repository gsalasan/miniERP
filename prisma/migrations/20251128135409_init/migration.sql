-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('INTERNAL', 'FREELANCE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CEO', 'FINANCE_ADMIN', 'SALES', 'SALES_MANAGER', 'PROJECT_MANAGER', 'PROJECT_ENGINEER', 'HR_ADMIN', 'EMPLOYEE', 'PROCUREMENT_ADMIN', 'ASSET_ADMIN', 'SYSTEM_ADMIN', 'OPERATIONAL_MANAGER');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('Active', 'EndOfLife', 'Discontinue');

-- CreateEnum
CREATE TYPE "MaterialLocation" AS ENUM ('Local', 'Import');

-- CreateEnum
CREATE TYPE "Components" AS ENUM ('Main_Equipment', 'Supporting_Equipment', 'Installation_Material', 'Consumables');

-- CreateEnum
CREATE TYPE "ServiceUnit" AS ENUM ('Jam', 'Hari');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE', 'PROBATION');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('HIGH_SCHOOL', 'DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE');

-- CreateEnum
CREATE TYPE "AllowanceCategory" AS ENUM ('ATTENDANCE', 'COMMUNICATION', 'TRANSPORTATION', 'MEALS', 'HOUSING', 'POSITION');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'SICK_LEAVE', 'VACATION');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'UNPAID');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROSPECT');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'CostOfService');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VendorClassification" AS ENUM ('Local', 'International', 'Principal', 'Distributor', 'Freelance');

-- CreateEnum
CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('STATUS_CHANGE', 'MEETING', 'CALL', 'EMAIL', 'PROPOSAL_SENT', 'DOCUMENT_UPLOAD', 'NOTE_ADDED', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "EstimationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PENDING_APPROVAL', 'PENDING_DISCOUNT_APPROVAL', 'APPROVED', 'DISCOUNT_APPROVED', 'REJECTED', 'REVISION_REQUIRED', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('MATERIAL', 'SERVICE');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "service_types" (
    "service_type_code" TEXT NOT NULL,
    "service_type_name" TEXT NOT NULL,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("service_type_code")
);

-- CreateTable
CREATE TABLE "cost_types" (
    "cost_type_code" TEXT NOT NULL,
    "cost_type_name" TEXT NOT NULL,
    "markup_percentage" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_types_pkey" PRIMARY KEY ("cost_type_code")
);

-- CreateTable
CREATE TABLE "systems" (
    "id" UUID NOT NULL,
    "system_code" TEXT NOT NULL,
    "system_name" TEXT NOT NULL,
    "sbu" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsystems" (
    "subsystem_code" TEXT NOT NULL,
    "subsystem_name" TEXT NOT NULL,
    "system_id" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subsystems_pkey" PRIMARY KEY ("subsystem_code")
);

-- CreateTable
CREATE TABLE "positions" (
    "position_code" TEXT NOT NULL,
    "position_name" TEXT NOT NULL,
    "department" TEXT,
    "level" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("position_code")
);

-- CreateTable
CREATE TABLE "sbus" (
    "sbu_code" TEXT NOT NULL,
    "sbu_name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sbus_pkey" PRIMARY KEY ("sbu_code")
);

-- CreateTable
CREATE TABLE "resource_types" (
    "resource_type_code" TEXT NOT NULL,
    "resource_type_name" TEXT NOT NULL,
    "description" TEXT,
    "markup_percentage" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_types_pkey" PRIMARY KEY ("resource_type_code")
);

-- CreateTable
CREATE TABLE "project_types" (
    "project_type_code" TEXT NOT NULL,
    "project_type_name" TEXT NOT NULL,
    "overhead_allocation_percentage" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_types_pkey" PRIMARY KEY ("project_type_code")
);

-- CreateTable
CREATE TABLE "units_of_measure" (
    "unit_code" TEXT NOT NULL,
    "unit_name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("unit_code")
);

-- CreateTable
CREATE TABLE "approval_authorities" (
    "authority_code" TEXT NOT NULL,
    "authority_name" TEXT NOT NULL,
    "min_approval_amount" DECIMAL(18,2),
    "max_approval_amount" DECIMAL(18,2),
    "required_roles" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_authorities_pkey" PRIMARY KEY ("authority_code")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "employee_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "roles" "UserRole"[] DEFAULT ARRAY['EMPLOYEE']::"UserRole"[],

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "hire_date" TIMESTAMP(3) NOT NULL,
    "basic_salary" DECIMAL(65,30) NOT NULL,
    "allowances" JSONB NOT NULL,
    "department" TEXT,
    "blood_type" "BloodType",
    "bank_name" TEXT,
    "bank_account_number" TEXT,
    "npwp" TEXT,
    "ptkp" TEXT,
    "phone" TEXT,
    "tax_id" TEXT,
    "gender" "Gender",
    "marital_status" "MaritalStatus",
    "employment_type" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "education_level" "EducationLevel",

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "system" TEXT,
    "subsystem" TEXT,
    "item_name" TEXT NOT NULL,
    "brand" TEXT,
    "owner_pn" TEXT,
    "vendor" TEXT,
    "status" "MaterialStatus",
    "location" "MaterialLocation",
    "cost_ori" DECIMAL(14,2),
    "curr" VARCHAR(3),
    "satuan" VARCHAR(50),
    "cost_rp" DECIMAL(14,2),
    "cost_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cost_validity" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "components" "Components",
    "sbu" TEXT,
    "kategori_sistem_id" UUID,
    "sub_sistem_id" UUID,
    "sbu_id" UUID,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_name" TEXT NOT NULL,
    "service_code" TEXT NOT NULL,
    "item_type" TEXT NOT NULL DEFAULT 'Service',
    "unit" "ServiceUnit" NOT NULL,
    "default_duration" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kategori_sistem_id" TEXT,
    "sub_sistem_id" TEXT,
    "kategori_jasa_id" TEXT,
    "jenis_jasa_spesifik_id" TEXT,
    "deskripsi_id" TEXT,
    "rekomendasi_tim_id" TEXT,
    "fase_proyek_id" TEXT,
    "sbu_id" TEXT,
    "category" TEXT,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employees" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "personal_email" TEXT,
    "gender" "Gender",
    "date_of_birth" TIMESTAMP(3),
    "place_of_birth" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'Indonesian',
    "religion" TEXT,
    "marital_status" "MaritalStatus",
    "blood_type" "BloodType",
    "current_address" TEXT,
    "permanent_address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Indonesia',
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "emergency_contact_relation" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "manager_id" TEXT,
    "employment_type" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "hire_date" TIMESTAMP(3) NOT NULL,
    "probation_end_date" TIMESTAMP(3),
    "confirmation_date" TIMESTAMP(3),
    "termination_date" TIMESTAMP(3),
    "last_working_date" TIMESTAMP(3),
    "basic_salary" DECIMAL(15,2) NOT NULL,
    "allowances" JSONB,
    "bank_account_number" TEXT,
    "bank_name" TEXT,
    "tax_id" TEXT,
    "social_security_id" TEXT,
    "work_location" TEXT,
    "work_schedule" TEXT,
    "working_hours_per_week" DECIMAL(5,2),
    "education_level" "EducationLevel",
    "university" TEXT,
    "major" TEXT,
    "graduation_year" INTEGER,
    "gpa" DECIMAL(3,2),
    "certifications" JSONB,
    "skills" JSONB,
    "languages" JSONB,
    "profile_picture" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "hr_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_attendances" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "break_start" TIMESTAMP(3),
    "break_end" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "total_hours" DECIMAL(5,2),
    "overtime_hours" DECIMAL(5,2),
    "notes" TEXT,
    "location" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "check_in_latitude" DECIMAL(10,8),
    "check_in_longitude" DECIMAL(11,8),
    "check_in_location" TEXT,
    "check_out_latitude" DECIMAL(10,8),
    "check_out_longitude" DECIMAL(11,8),
    "check_out_location" TEXT,
    "work_duration_minutes" INTEGER,

    CONSTRAINT "hr_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type" "LeaveType" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_days" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_performance_reviews" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "review_period" TEXT NOT NULL,
    "review_year" INTEGER NOT NULL,
    "review_quarter" INTEGER,
    "overall_rating" DECIMAL(3,2) NOT NULL,
    "goals_rating" DECIMAL(3,2),
    "skills_rating" DECIMAL(3,2),
    "attitude_rating" DECIMAL(3,2),
    "strengths" TEXT,
    "areas_for_improvement" TEXT,
    "goals_for_next_period" TEXT,
    "comments" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_training_records" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "training_name" TEXT NOT NULL,
    "training_provider" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "duration_hours" DECIMAL(5,2),
    "certificate_number" TEXT,
    "certificate_file" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "cost" DECIMAL(15,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_training_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_documents" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "is_confidential" BOOLEAN NOT NULL DEFAULT false,
    "expiry_date" DATE,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_employee_documents_pkey" PRIMARY KEY ("id")
);

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
    "alamat" TEXT,
    "district" TEXT,

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

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" SERIAL NOT NULL,
    "currency_from" VARCHAR(3) NOT NULL,
    "currency_to" VARCHAR(3) NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,
    "effective_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_address" TEXT,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "payment_terms" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" SERIAL NOT NULL,
    "tax_name" TEXT NOT NULL,
    "tax_code" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "category" TEXT,
    "classification" "VendorClassification",
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_pricelist" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "price_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "material_id" UUID NOT NULL,

    CONSTRAINT "vendor_pricelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" BIGSERIAL NOT NULL,
    "transaction_date" DATE NOT NULL,
    "description" TEXT,
    "account_id" INTEGER NOT NULL,
    "debit" DECIMAL(15,2),
    "credit" DECIMAL(15,2),
    "reference_id" UUID,
    "reference_type" VARCHAR(50),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSystemCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceSystemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSubSystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "system_category_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceSubSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSpecificType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceSpecificType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDescription" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRecommendation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "team_type" "TeamType" NOT NULL DEFAULT 'INTERNAL',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaseProyekLookup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaseProyekLookup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SBULookup" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SBULookup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialSystemCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialSystemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialSubSystem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "system_category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialSubSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "project_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contract_value" DECIMAL(18,2) NOT NULL,
    "estimated_hpp" DECIMAL(18,2),
    "actual_cost" DECIMAL(18,2),
    "actual_close_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "description" TEXT,
    "estimated_value" DECIMAL(15,2),
    "estimation_status" "EstimationStatus" DEFAULT 'PENDING',
    "expected_close_date" TIMESTAMP(3),
    "lead_score" INTEGER DEFAULT 0,
    "notes" TEXT,
    "priority" "ProjectPriority" NOT NULL DEFAULT 'MEDIUM',
    "sales_user_id" TEXT,
    "pm_user_id" TEXT,
    "start_date" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    "status" VARCHAR(100) NOT NULL DEFAULT 'PROSPECT',

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "so_number" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "customer_po_number" TEXT NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL,
    "top_days_agreed" INTEGER,
    "contract_value" DECIMAL(18,2) NOT NULL,
    "po_document_url" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_activities" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "activity_type" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "project_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "EstimationStatus" NOT NULL,
    "total_direct_hpp" DECIMAL(18,2) NOT NULL,
    "total_overhead_allocation" DECIMAL(18,2) NOT NULL,
    "total_hpp" DECIMAL(18,2) NOT NULL,
    "total_sell_price" DECIMAL(18,2) NOT NULL,
    "assigned_to_user_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "requested_by_user_id" TEXT,
    "technical_brief" TEXT,
    "attachments" JSONB,
    "ce_number" VARCHAR(50),
    "ce_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "so_number" VARCHAR(50),
    "so_date" DATE,
    "sales_order_id" TEXT,
    "ce_period_start" TIMESTAMPTZ(6),
    "ce_period_end" TIMESTAMPTZ(6),
    "client_name" VARCHAR(255),
    "submitted_by_user_id" UUID,
    "submitted_at" TIMESTAMPTZ(6),
    "approved_by_user_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "gross_margin_percentage" DECIMAL(5,2),
    "sales_pic" VARCHAR(255),
    "date_requested" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "date_assigned" TIMESTAMPTZ(6),
    "date_started" TIMESTAMPTZ(6),
    "date_completed" TIMESTAMPTZ(6),
    "client_id" TEXT,

    CONSTRAINT "estimations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimation_items" (
    "id" TEXT NOT NULL,
    "estimation_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "source" "SourceType" NOT NULL,
    "hpp_at_estimation" DECIMAL(18,2) NOT NULL,
    "sell_price_at_estimation" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "estimation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ce_line_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ce_document_id" UUID NOT NULL,
    "wbs_code" VARCHAR(20),
    "task_name" VARCHAR(255),
    "line_sequence" INTEGER,
    "cost_type" VARCHAR(50),
    "sbu" VARCHAR(100),
    "system_name" VARCHAR(100),
    "subsystem_name" VARCHAR(100),
    "cost_per_unit" DECIMAL(15,2),
    "markup_percentage" DECIMAL(5,2),
    "total_markup" DECIMAL(15,2),
    "pic_employee_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ce_task_timeline" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ce_document_id" UUID NOT NULL,
    "wbs_code" VARCHAR(20),
    "task_name" VARCHAR(255),
    "predecessor_wbs_code" VARCHAR(20),
    "start_date" DATE,
    "end_date" DATE,
    "duration_days" INTEGER,
    "pct_complete" DECIMAL(5,2),
    "working_days" DECIMAL(8,2),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_task_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ce_cost_summary" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ce_document_id" UUID NOT NULL,
    "grouping_type" VARCHAR(50),
    "group_key" VARCHAR(100),
    "group_label" VARCHAR(255),
    "item_count" INTEGER,
    "total_direct_cost" DECIMAL(15,2),
    "total_markup" DECIMAL(15,2),
    "total_sell_price" DECIMAL(15,2),
    "pct_of_total_price" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_cost_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_boms" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "project_boms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_templates" (
    "id" SERIAL NOT NULL,
    "template_name" TEXT NOT NULL,
    "project_type" TEXT,
    "milestones" JSONB NOT NULL,

    CONSTRAINT "milestone_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_milestones" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL,

    CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "milestone_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assignee_id" TEXT,
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorCategoryLookup" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorCategoryLookup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorClassificationLookup" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorClassificationLookup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_rekenings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" VARCHAR NOT NULL,
    "bank_name" TEXT,
    "account_number" TEXT NOT NULL,
    "account_holder" TEXT,

    CONSTRAINT "customer_rekenings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_policies" (
    "id" SERIAL NOT NULL,
    "user_role" VARCHAR(100) NOT NULL,
    "max_discount_percentage" DECIMAL(5,2) NOT NULL,
    "requires_approval_above" DECIMAL(5,2),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overhead_cost_allocations" (
    "id" SERIAL NOT NULL,
    "cost_category" VARCHAR(255) NOT NULL,
    "target_percentage" DECIMAL(5,2),
    "allocation_percentage_to_hpp" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "overhead_cost_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" SERIAL NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "markup_percentage" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "systems_system_code_key" ON "systems"("system_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");

-- CreateIndex
CREATE INDEX "idx_material_kategori_sistem_id" ON "Material"("kategori_sistem_id");

-- CreateIndex
CREATE INDEX "idx_material_sub_sistem_id" ON "Material"("sub_sistem_id");

-- CreateIndex
CREATE UNIQUE INDEX "Service_service_code_key" ON "Service"("service_code");

-- CreateIndex
CREATE INDEX "Service_kategori_sistem_id_idx" ON "Service"("kategori_sistem_id");

-- CreateIndex
CREATE INDEX "Service_sub_sistem_id_idx" ON "Service"("sub_sistem_id");

-- CreateIndex
CREATE INDEX "Service_kategori_jasa_id_idx" ON "Service"("kategori_jasa_id");

-- CreateIndex
CREATE INDEX "Service_jenis_jasa_spesifik_id_idx" ON "Service"("jenis_jasa_spesifik_id");

-- CreateIndex
CREATE INDEX "Service_deskripsi_id_idx" ON "Service"("deskripsi_id");

-- CreateIndex
CREATE INDEX "Service_rekomendasi_tim_id_idx" ON "Service"("rekomendasi_tim_id");

-- CreateIndex
CREATE INDEX "Service_fase_proyek_id_idx" ON "Service"("fase_proyek_id");

-- CreateIndex
CREATE INDEX "Service_sbu_id_idx" ON "Service"("sbu_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employees_employee_id_key" ON "hr_employees"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employees_email_key" ON "hr_employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "hr_attendances_employee_id_date_key" ON "hr_attendances"("employee_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccounts_account_code_key" ON "ChartOfAccounts"("account_code");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_currency_from_currency_to_effective_date_key" ON "exchange_rates"("currency_from", "currency_to", "effective_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rates_tax_name_key" ON "tax_rates"("tax_name");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rates_tax_code_key" ON "tax_rates"("tax_code");

-- CreateIndex
CREATE INDEX "vendor_pricelist_vendor_id_idx" ON "vendor_pricelist"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_pricelist_material_id_idx" ON "vendor_pricelist"("material_id");

-- CreateIndex
CREATE INDEX "journal_entries_account_id_idx" ON "journal_entries"("account_id");

-- CreateIndex
CREATE INDEX "journal_entries_reference_id_idx" ON "journal_entries"("reference_id");

-- CreateIndex
CREATE INDEX "journal_entries_transaction_date_idx" ON "journal_entries"("transaction_date");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSystemCategory_name_key" ON "ServiceSystemCategory"("name");

-- CreateIndex
CREATE INDEX "ServiceSubSystem_system_category_id_idx" ON "ServiceSubSystem"("system_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSubSystem_name_system_category_id_key" ON "ServiceSubSystem"("name", "system_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_name_key" ON "ServiceCategory"("name");

-- CreateIndex
CREATE INDEX "ServiceSpecificType_category_id_idx" ON "ServiceSpecificType"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSpecificType_name_category_id_key" ON "ServiceSpecificType"("name", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRecommendation_name_key" ON "TeamRecommendation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FaseProyekLookup_name_key" ON "FaseProyekLookup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SBULookup_name_key" ON "SBULookup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialSystemCategory_name_key" ON "MaterialSystemCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "material_subsystem_name_category_unique" ON "MaterialSubSystem"("name", "system_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_number_key" ON "projects"("project_number");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_so_number_key" ON "sales_orders"("so_number");

-- CreateIndex
CREATE INDEX "sales_orders_project_id_idx" ON "sales_orders"("project_id");

-- CreateIndex
CREATE INDEX "sales_orders_so_number_idx" ON "sales_orders"("so_number");

-- CreateIndex
CREATE UNIQUE INDEX "estimations_ce_number_key" ON "estimations"("ce_number");

-- CreateIndex
CREATE UNIQUE INDEX "estimations_project_version_unique" ON "estimations"("project_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ux_estimations_project_id_version" ON "estimations"("project_id", "version");

-- CreateIndex
CREATE INDEX "idx_ce_line_items_ce_document_id" ON "ce_line_items"("ce_document_id");

-- CreateIndex
CREATE INDEX "idx_ce_task_timeline_ce_document_id" ON "ce_task_timeline"("ce_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_ce_task_timeline_ce_wbs" ON "ce_task_timeline"("ce_document_id", "wbs_code");

-- CreateIndex
CREATE INDEX "idx_ce_cost_summary_ce_document_id" ON "ce_cost_summary"("ce_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_templates_template_name_key" ON "milestone_templates"("template_name");

-- CreateIndex
CREATE UNIQUE INDEX "VendorCategoryLookup_value_key" ON "VendorCategoryLookup"("value");

-- CreateIndex
CREATE INDEX "vendor_category_lookup_value_idx" ON "VendorCategoryLookup"("value");

-- CreateIndex
CREATE UNIQUE INDEX "VendorClassificationLookup_value_key" ON "VendorClassificationLookup"("value");

-- CreateIndex
CREATE INDEX "vendor_classification_lookup_value_idx" ON "VendorClassificationLookup"("value");

-- CreateIndex
CREATE INDEX "idx_customer_rekenings_customer_id" ON "customer_rekenings"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "discount_policies_user_role_key" ON "discount_policies"("user_role");

-- CreateIndex
CREATE UNIQUE INDEX "overhead_cost_allocations_cost_category_key" ON "overhead_cost_allocations"("cost_category");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_rules_category_key" ON "pricing_rules"("category");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "material_kategori_sistem_fk" FOREIGN KEY ("kategori_sistem_id") REFERENCES "MaterialSystemCategory"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "material_sbu_fk" FOREIGN KEY ("sbu_id") REFERENCES "SBULookup"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "material_sub_sistem_fk" FOREIGN KEY ("sub_sistem_id") REFERENCES "MaterialSubSystem"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_deskripsi_id_fkey" FOREIGN KEY ("deskripsi_id") REFERENCES "ServiceDescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_fase_proyek_id_fkey" FOREIGN KEY ("fase_proyek_id") REFERENCES "FaseProyekLookup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_jenis_jasa_spesifik_id_fkey" FOREIGN KEY ("jenis_jasa_spesifik_id") REFERENCES "ServiceSpecificType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_kategori_jasa_id_fkey" FOREIGN KEY ("kategori_jasa_id") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_kategori_sistem_id_fkey" FOREIGN KEY ("kategori_sistem_id") REFERENCES "ServiceSystemCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_rekomendasi_tim_id_fkey" FOREIGN KEY ("rekomendasi_tim_id") REFERENCES "TeamRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_sub_sistem_id_fkey" FOREIGN KEY ("sub_sistem_id") REFERENCES "ServiceSubSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_attendances" ADD CONSTRAINT "hr_attendances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_performance_reviews" ADD CONSTRAINT "hr_performance_reviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_training_records" ADD CONSTRAINT "hr_training_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_documents" ADD CONSTRAINT "hr_employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_pricelist" ADD CONSTRAINT "vendor_pricelist_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_pricelist" ADD CONSTRAINT "vendor_pricelist_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ChartOfAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialSubSystem" ADD CONSTRAINT "material_subsystem_fk_system" FOREIGN KEY ("system_category_id") REFERENCES "MaterialSystemCategory"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_pm_user_id_fkey" FOREIGN KEY ("pm_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_sales_user_id_fkey" FOREIGN KEY ("sales_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimations" ADD CONSTRAINT "estimations_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimations" ADD CONSTRAINT "estimations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimations" ADD CONSTRAINT "estimations_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimations" ADD CONSTRAINT "fk_estimations_client_id" FOREIGN KEY ("client_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "estimations" ADD CONSTRAINT "estimations_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_items" ADD CONSTRAINT "estimation_items_estimation_id_fkey" FOREIGN KEY ("estimation_id") REFERENCES "estimations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_boms" ADD CONSTRAINT "project_boms_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "project_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_rekenings" ADD CONSTRAINT "fk_customer_rekenings_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
