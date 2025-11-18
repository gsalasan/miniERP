-- Migration: Add phone and tax_id columns to employees table
-- Date: 2025-11-03
-- Purpose: Support phone number and KTP/tax ID in employee records

-- Add phone column
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add tax_id column (for KTP/Nomor Identitas)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN employees.phone IS 'Nomor telepon/HP karyawan';
COMMENT ON COLUMN employees.tax_id IS 'Nomor KTP/identitas pajak karyawan';

-- Verify columns added
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name IN ('phone', 'tax_id');
