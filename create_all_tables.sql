-- DROP existing tables if any
DROP TABLE IF EXISTS hr_employee_documents CASCADE;
DROP TABLE IF EXISTS hr_training_records CASCADE;
DROP TABLE IF EXISTS hr_performance_reviews CASCADE;
DROP TABLE IF EXISTS hr_leave_requests CASCADE;
DROP TABLE IF EXISTS hr_attendances CASCADE;
DROP TABLE IF EXISTS hr_employees CASCADE;
DROP TABLE IF EXISTS "Service" CASCADE;
DROP TABLE IF EXISTS "Material" CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- DROP existing enums
DROP TYPE IF EXISTS "AttendanceStatus" CASCADE;
DROP TYPE IF EXISTS "LeaveStatus" CASCADE;
DROP TYPE IF EXISTS "LeaveType" CASCADE;
DROP TYPE IF EXISTS "EducationLevel" CASCADE;
DROP TYPE IF EXISTS "BloodType" CASCADE;
DROP TYPE IF EXISTS "MaritalStatus" CASCADE;
DROP TYPE IF EXISTS "Gender" CASCADE;
DROP TYPE IF EXISTS "EmploymentType" CASCADE;
DROP TYPE IF EXISTS "EmployeeStatus" CASCADE;
DROP TYPE IF EXISTS "ServiceUnit" CASCADE;
DROP TYPE IF EXISTS "MaterialLocation" CASCADE;
DROP TYPE IF EXISTS "MaterialStatus" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;

-- Create enums
CREATE TYPE "UserRole" AS ENUM ('CEO', 'FINANCE_ADMIN', 'SALES', 'SALES_MANAGER', 'PROJECT_MANAGER', 'PROJECT_ENGINEER', 'HR_ADMIN', 'EMPLOYEE', 'PROCUREMENT_ADMIN', 'ASSET_ADMIN', 'SYSTEM_ADMIN');
CREATE TYPE "MaterialStatus" AS ENUM ('Active', 'EndOfLife', 'Discontinue');
CREATE TYPE "MaterialLocation" AS ENUM ('Local', 'Import');
CREATE TYPE "ServiceUnit" AS ENUM ('Jam', 'Hari');
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE', 'SUSPENDED');
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED');
CREATE TYPE "BloodType" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');
CREATE TYPE "EducationLevel" AS ENUM ('HIGH_SCHOOL', 'DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE', 'CERTIFICATION', 'OTHER');
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL_LEAVE', 'SICK_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'EMERGENCY_LEAVE', 'UNPAID_LEAVE', 'STUDY_LEAVE', 'COMPENSATORY_LEAVE');
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'WORK_FROM_HOME', 'ON_LEAVE');

-- Create tables
CREATE TABLE employees (
    id TEXT NOT NULL PRIMARY KEY,
    full_name TEXT NOT NULL,
    position TEXT NOT NULL,
    hire_date TIMESTAMP(3) NOT NULL,
    basic_salary DECIMAL(65,30) NOT NULL,
    allowances JSONB NOT NULL
);

CREATE TABLE users (
    id TEXT NOT NULL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    employee_id TEXT UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Material" (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    sbu TEXT,
    system TEXT,
    subsystem TEXT,
    components TEXT,
    item_name TEXT NOT NULL,
    brand TEXT,
    owner_pn TEXT,
    vendor TEXT,
    status "MaterialStatus",
    location "MaterialLocation",
    cost_ori DECIMAL(14,2),
    curr VARCHAR(3),
    satuan VARCHAR(50),
    cost_rp DECIMAL(14,2),
    cost_date TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cost_validity TIMESTAMPTZ(6),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Service" (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL,
    service_code TEXT NOT NULL UNIQUE,
    item_type TEXT NOT NULL DEFAULT 'Service',
    category TEXT,
    unit "ServiceUnit" NOT NULL,
    internal_cost_per_hour DECIMAL(14,2),
    freelance_cost_per_hour DECIMAL(14,2),
    default_duration DECIMAL(10,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hr_employees (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    personal_email TEXT,
    gender "Gender",
    date_of_birth TIMESTAMP(3),
    place_of_birth TEXT,
    nationality TEXT NOT NULL DEFAULT 'Indonesian',
    religion TEXT,
    marital_status "MaritalStatus",
    blood_type "BloodType",
    current_address TEXT,
    permanent_address TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    country TEXT NOT NULL DEFAULT 'Indonesia',
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    position TEXT NOT NULL,
    department TEXT,
    manager_id TEXT,
    employment_type "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    status "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    hire_date TIMESTAMP(3) NOT NULL,
    probation_end_date TIMESTAMP(3),
    confirmation_date TIMESTAMP(3),
    termination_date TIMESTAMP(3),
    last_working_date TIMESTAMP(3),
    basic_salary DECIMAL(15,2) NOT NULL,
    allowances JSONB,
    bank_account_number TEXT,
    bank_name TEXT,
    tax_id TEXT,
    social_security_id TEXT,
    work_location TEXT,
    work_schedule TEXT,
    working_hours_per_week DECIMAL(5,2),
    education_level "EducationLevel",
    university TEXT,
    major TEXT,
    graduation_year INTEGER,
    gpa DECIMAL(3,2),
    certifications JSONB,
    skills JSONB,
    languages JSONB,
    profile_picture TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    FOREIGN KEY (manager_id) REFERENCES hr_employees(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE hr_attendances (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    date DATE NOT NULL,
    check_in_time TIMESTAMP(3),
    check_out_time TIMESTAMP(3),
    break_start TIMESTAMP(3),
    break_end TIMESTAMP(3),
    status "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    total_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2),
    notes TEXT,
    location TEXT,
    ip_address TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(employee_id, date)
);

CREATE TABLE hr_leave_requests (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    leave_type "LeaveType" NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    approved_by TEXT,
    approved_at TIMESTAMP(3),
    rejection_reason TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE hr_performance_reviews (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    review_period TEXT NOT NULL,
    review_year INTEGER NOT NULL,
    review_quarter INTEGER,
    overall_rating DECIMAL(3,2) NOT NULL,
    goals_rating DECIMAL(3,2),
    skills_rating DECIMAL(3,2),
    attitude_rating DECIMAL(3,2),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_for_next_period TEXT,
    comments TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP(3),
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE hr_training_records (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    training_name TEXT NOT NULL,
    training_provider TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_hours DECIMAL(5,2),
    certificate_number TEXT,
    certificate_file TEXT,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    cost DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE hr_employee_documents (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    is_confidential BOOLEAN NOT NULL DEFAULT false,
    expiry_date DATE,
    uploaded_by TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE ON UPDATE CASCADE
);