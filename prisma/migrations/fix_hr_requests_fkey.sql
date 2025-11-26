-- Fix foreign key constraints for HR requests to point to employees table instead of hr_employees

-- 1. Drop existing foreign key constraints
ALTER TABLE hr_permission_requests 
DROP CONSTRAINT IF EXISTS hr_permission_requests_employee_id_fkey;

ALTER TABLE hr_overtime_requests 
DROP CONSTRAINT IF EXISTS hr_overtime_requests_employee_id_fkey;

ALTER TABLE hr_reimbursement_requests 
DROP CONSTRAINT IF EXISTS hr_reimbursement_requests_employee_id_fkey;

-- 2. Add new foreign key constraints pointing to employees table
ALTER TABLE hr_permission_requests 
ADD CONSTRAINT hr_permission_requests_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE hr_overtime_requests 
ADD CONSTRAINT hr_overtime_requests_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE hr_reimbursement_requests 
ADD CONSTRAINT hr_reimbursement_requests_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
