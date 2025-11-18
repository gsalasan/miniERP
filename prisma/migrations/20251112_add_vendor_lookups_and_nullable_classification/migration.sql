-- Migration: add vendor lookup tables if missing and make vendors.classification nullable
-- Run this file with psql or `npx prisma db execute --file=...` against your database.

-- Ensure extension for gen_random_uuid exists (pgcrypto). If not present, create it (may require superuser):
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create VendorCategoryLookup table if it doesn't exist
CREATE TABLE IF NOT EXISTS public."VendorCategoryLookup" (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create VendorClassificationLookup table if it doesn't exist
CREATE TABLE IF NOT EXISTS public."VendorClassificationLookup" (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Make vendors.classification nullable so we can nullify references when forcing delete
-- This assumes table public.vendors exists. If not, skip.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'classification') THEN
    EXECUTE 'ALTER TABLE public.vendors ALTER COLUMN classification DROP NOT NULL';
  END IF;
END$$;

-- Optionally create indexes for lookups for faster lookup
CREATE INDEX IF NOT EXISTS vendor_category_lookup_value_idx ON public."VendorCategoryLookup" (value);
CREATE INDEX IF NOT EXISTS vendor_classification_lookup_value_idx ON public."VendorClassificationLookup" (value);

-- Touch: update timestamps trigger (if your project uses triggers to maintain updated_at, you can adapt this)

-- Done
