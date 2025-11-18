-- Migration: add vendor lookup tables (VendorCategoryLookup, VendorClassificationLookup)
-- Created by automated helper to add lookup tables only (non-destructive to other tables)

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create VendorCategoryLookup table if not exists
CREATE TABLE IF NOT EXISTS public."VendorCategoryLookup" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create VendorClassificationLookup table if not exists
CREATE TABLE IF NOT EXISTS public."VendorClassificationLookup" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Safe no-op: ensure unique indexes exist
CREATE UNIQUE INDEX IF NOT EXISTS "VendorCategoryLookup_value_key" ON public."VendorCategoryLookup"(value);
CREATE UNIQUE INDEX IF NOT EXISTS "VendorClassificationLookup_value_key" ON public."VendorClassificationLookup"(value);
