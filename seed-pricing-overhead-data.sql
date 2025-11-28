-- ========================================
-- SEED DATA FOR PRICING & OVERHEAD ENGINES
-- ========================================
-- File: seed-pricing-overhead-data.sql
-- Purpose: Initialize pricing_rules and overhead_cost_allocations tables
-- Date: 2025-11-20
-- ========================================

-- ========================================
-- 1. PRICING RULES
-- ========================================

INSERT INTO pricing_rules (category, markup_percentage, created_at, updated_at) VALUES
-- Default categories
('MATERIAL_DEFAULT', 25.00, NOW(), NOW()),
('SERVICE_DEFAULT', 30.00, NOW(), NOW()),
('UNKNOWN', 20.00, NOW(), NOW()),

-- Engineering Systems
('ELECTRICAL', 28.00, NOW(), NOW()),
('MECHANICAL', 27.00, NOW(), NOW()),
('CIVIL', 22.00, NOW(), NOW()),
('INSTRUMENTATION', 32.00, NOW(), NOW()),
('PLUMBING', 24.00, NOW(), NOW()),
('HVAC', 29.00, NOW(), NOW()),
('FIRE_PROTECTION', 26.00, NOW(), NOW()),

-- Material Types
('MAIN_EQUIPMENT', 23.00, NOW(), NOW()),
('SUPPORTING_EQUIPMENT', 26.00, NOW(), NOW()),
('INSTALLATION_MATERIAL', 28.00, NOW(), NOW()),
('CONSUMABLES', 35.00, NOW(), NOW()),

-- Service Types
('ENGINEERING_DESIGN', 35.00, NOW(), NOW()),
('INSTALLATION', 30.00, NOW(), NOW()),
('COMMISSIONING', 32.00, NOW(), NOW()),
('MAINTENANCE', 28.00, NOW(), NOW()),
('CONSULTING', 40.00, NOW(), NOW()),
('TRAINING', 38.00, NOW(), NOW()),

-- Location-based
('LOCAL', 25.00, NOW(), NOW()),
('IMPORT', 22.00, NOW(), NOW())

ON CONFLICT (category) DO UPDATE SET
  markup_percentage = EXCLUDED.markup_percentage,
  updated_at = NOW();

-- ========================================
-- 2. OVERHEAD COST ALLOCATIONS
-- ========================================

INSERT INTO overhead_cost_allocations (cost_category, target_percentage, allocation_percentage_to_hpp, created_at, updated_at) VALUES
-- Personnel Overhead
('GAJI_OVERHEAD', 5.00, 5.00, NOW(), NOW()),
('TUNJANGAN_OVERHEAD', 1.50, 1.50, NOW(), NOW()),
('BONUS_INSENTIF', 1.00, 1.00, NOW(), NOW()),

-- Facility Overhead
('SEWA_KANTOR', 3.00, 3.00, NOW(), NOW()),
('SEWA_GUDANG', 1.00, 1.00, NOW(), NOW()),

-- Utilities
('LISTRIK', 1.20, 1.20, NOW(), NOW()),
('AIR', 0.30, 0.30, NOW(), NOW()),
('INTERNET_TELEPON', 0.50, 0.50, NOW(), NOW()),

-- Depreciation & Assets
('DEPRESIASI_PERALATAN', 1.50, 1.50, NOW(), NOW()),
('DEPRESIASI_KENDARAAN', 0.50, 0.50, NOW(), NOW()),

-- Insurance
('ASURANSI_KARYAWAN', 0.80, 0.80, NOW(), NOW()),
('ASURANSI_ASET', 0.50, 0.50, NOW(), NOW()),

-- Maintenance
('PEMELIHARAAN_KANTOR', 0.70, 0.70, NOW(), NOW()),
('PEMELIHARAAN_PERALATAN', 0.50, 0.50, NOW(), NOW()),
('PEMELIHARAAN_KENDARAAN', 0.30, 0.30, NOW(), NOW()),

-- Administration
('ADMINISTRASI_UMUM', 0.50, 0.50, NOW(), NOW()),
('ATK_SUPPLIES', 0.30, 0.30, NOW(), NOW()),
('LEGAL_NOTARIS', 0.20, 0.20, NOW(), NOW()),

-- Marketing & Sales
('MARKETING', 0.50, 0.50, NOW(), NOW()),
('PROMOSI', 0.30, 0.30, NOW(), NOW()),

-- Others
('TRANSPORTASI', 0.40, 0.40, NOW(), NOW()),
('KONSUMSI', 0.30, 0.30, NOW(), NOW()),
('LAIN_LAIN', 0.50, 0.50, NOW(), NOW())

ON CONFLICT (cost_category) DO UPDATE SET
  target_percentage = EXCLUDED.target_percentage,
  allocation_percentage_to_hpp = EXCLUDED.allocation_percentage_to_hpp,
  updated_at = NOW();

-- ========================================
-- 3. VERIFICATION QUERIES
-- ========================================

-- Check total pricing rules
SELECT COUNT(*) as total_pricing_rules FROM pricing_rules;

-- Check total overhead policies
SELECT COUNT(*) as total_overhead_policies FROM overhead_cost_allocations;

-- Check total overhead allocation percentage
SELECT 
  SUM(allocation_percentage_to_hpp) as total_allocation_percentage,
  CASE 
    WHEN SUM(allocation_percentage_to_hpp) <= 100 THEN '✅ Valid (≤100%)'
    ELSE '❌ Invalid (>100%)'
  END as validation_status
FROM overhead_cost_allocations;

-- View all pricing rules
SELECT 
  id,
  category,
  markup_percentage,
  created_at
FROM pricing_rules
ORDER BY category;

-- View all overhead policies with breakdown
SELECT 
  id,
  cost_category,
  target_percentage,
  allocation_percentage_to_hpp,
  created_at
FROM overhead_cost_allocations
ORDER BY allocation_percentage_to_hpp DESC;

-- Show overhead breakdown example (for Rp 100,000,000)
SELECT 
  cost_category,
  allocation_percentage_to_hpp,
  ROUND((100000000 * allocation_percentage_to_hpp / 100)::numeric, 2) as allocated_amount_rp,
  target_percentage
FROM overhead_cost_allocations
ORDER BY allocation_percentage_to_hpp DESC;

-- ========================================
-- 4. SAMPLE CALCULATION TEST
-- ========================================

-- Test calculation for a sample project
WITH sample_project AS (
  SELECT 
    80500000 as direct_hpp,
    25.00 as markup_percentage,
    (SELECT SUM(allocation_percentage_to_hpp) FROM overhead_cost_allocations) as overhead_percentage
),
calculation AS (
  SELECT 
    direct_hpp,
    markup_percentage,
    overhead_percentage,
    ROUND((direct_hpp * overhead_percentage / 100)::numeric, 2) as overhead_allocation,
    ROUND((direct_hpp + (direct_hpp * overhead_percentage / 100))::numeric, 2) as total_hpp,
    ROUND((direct_hpp * (1 + markup_percentage / 100))::numeric, 2) as sell_price_after_markup
  FROM sample_project
)
SELECT 
  '=== SAMPLE CALCULATION ===' as title,
  direct_hpp as "Direct HPP",
  overhead_percentage || '%' as "Overhead %",
  overhead_allocation as "Overhead Allocation",
  total_hpp as "Total HPP",
  markup_percentage || '%' as "Markup %",
  sell_price_after_markup as "Sell Price",
  ROUND((sell_price_after_markup - total_hpp)::numeric, 2) as "Net Profit"
FROM calculation;

-- ========================================
-- END OF FILE
-- ========================================
