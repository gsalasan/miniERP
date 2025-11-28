-- Add district column to customers if missing
ALTER TABLE IF EXISTS public.customers
ADD COLUMN IF NOT EXISTS district TEXT;

-- Ensure updatedAt is not null default if desired (optional):
-- ALTER TABLE IF EXISTS public.customers
-- ALTER COLUMN IF EXISTS updatedAt SET DEFAULT now();

-- (This migration adds the `district` column which Prisma schema expects.)