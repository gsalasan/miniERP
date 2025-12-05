-- 03_add_estimations_so_fields.sql
-- Purpose: Add Sales Order reference fields to estimations
-- Fields:
--   - so_number VARCHAR(50): Sales Order reference
--   - so_date   DATE        : Sales Order date

ALTER TABLE "estimations"
  ADD COLUMN IF NOT EXISTS so_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS so_date DATE;
