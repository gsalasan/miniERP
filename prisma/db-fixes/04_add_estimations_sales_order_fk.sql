-- 04_add_estimations_sales_order_fk.sql
-- Purpose: Link estimations to sales_orders via nullable FK

-- Column for FK
ALTER TABLE "estimations"
  ADD COLUMN IF NOT EXISTS sales_order_id uuid;

-- Index to speed up lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_estimations_sales_order_id'
  ) THEN
    CREATE INDEX idx_estimations_sales_order_id ON "estimations" (sales_order_id);
  END IF;
END$$;

-- Foreign key constraint (safe create)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'estimations'
      AND tc.constraint_name = 'fk_estimations_sales_order_id'
  ) THEN
    ALTER TABLE "estimations"
      ADD CONSTRAINT fk_estimations_sales_order_id
      FOREIGN KEY (sales_order_id)
      REFERENCES "sales_orders" (id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END$$;
