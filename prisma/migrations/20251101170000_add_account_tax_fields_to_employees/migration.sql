-- Add account & tax fields to legacy employees table if not exist
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS npwp TEXT,
  ADD COLUMN IF NOT EXISTS ptkp TEXT;
