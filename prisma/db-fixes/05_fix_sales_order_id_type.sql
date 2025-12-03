-- 05_fix_sales_order_id_type.sql
-- Goal: Align sales_order_id column type with Prisma schema (String/text)
-- Current: sales_order_id is uuid, referenced sales_orders.id is text
-- Fix: Change sales_order_id to text, recreate FK constraint.

BEGIN;
ALTER TABLE "estimations" DROP CONSTRAINT IF EXISTS fk_estimations_sales_order_id;
ALTER TABLE "estimations" ALTER COLUMN sales_order_id TYPE text USING sales_order_id::text;
-- Optional: ensure index exists
CREATE INDEX IF NOT EXISTS idx_estimations_sales_order_id ON "estimations"(sales_order_id);
ALTER TABLE "estimations"
  ADD CONSTRAINT fk_estimations_sales_order_id
  FOREIGN KEY (sales_order_id)
  REFERENCES "sales_orders"(id)
  ON UPDATE CASCADE
  ON DELETE SET NULL;
COMMIT;
