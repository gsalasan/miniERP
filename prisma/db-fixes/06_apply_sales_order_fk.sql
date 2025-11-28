-- Ensure index exists
CREATE INDEX IF NOT EXISTS idx_estimations_sales_order_id ON estimations(sales_order_id);

-- Idempotent FK creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_estimations_sales_order_id'
  ) THEN
    ALTER TABLE estimations
      ADD CONSTRAINT fk_estimations_sales_order_id
      FOREIGN KEY (sales_order_id)
      REFERENCES sales_orders(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END
$$;