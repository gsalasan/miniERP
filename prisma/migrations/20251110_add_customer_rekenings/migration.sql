-- Manual migration: add customer_rekenings table
-- Run with: npx prisma migrate resolve --applied 20251110_add_customer_rekenings

CREATE TABLE IF NOT EXISTS public.customer_rekenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id varchar NOT NULL,
  bank_name text,
  account_number text NOT NULL,
  account_holder text,
  CONSTRAINT fk_customer_rekenings_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
);

-- Optional index for faster lookups by customer_id
CREATE INDEX IF NOT EXISTS idx_customer_rekenings_customer_id ON public.customer_rekenings(customer_id);
