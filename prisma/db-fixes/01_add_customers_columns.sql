-- 01_add_customers_columns.sql
-- Adds 'district' and 'alamat' columns to customers if they don't exist.
-- Run this after taking a DB backup.

ALTER TABLE IF EXISTS public.customers
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS alamat TEXT;

-- Verify:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='customers' AND column_name IN ('district','alamat');
