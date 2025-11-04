-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "department" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "marital_status" "MaritalStatus",
ADD COLUMN     "blood_type" "BloodType",
ADD COLUMN     "employment_type" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "education_level" "EducationLevel";