# 📚 Panduan Lengkap PricingEngine & OverheadEngine

## 🎯 Overview

Dokumen ini menjelaskan cara menggunakan `PricingEngine.service.ts` dan `OverheadEngine.service.ts` yang telah diintegrasikan ke dalam Engineering Service untuk kalkulasi estimasi biaya proyek.

---

## 📦 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (BoQ Submission)                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              estimationService.calculateEstimation()         │
│                                                              │
│  Step 1: Calculate HPP per Item                             │
│  Step 2: OverheadEngine.calculateOverheadAllocation()       │
│  Step 3: PricingEngine.calculateBulkSellPrices()            │
│  Step 4: Merge Results                                      │
│  Step 5: Calculate Final Summary (Margins & Profit)         │
│  Step 6: Save to Database (Optional)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 PricingEngine.service.ts

### Fungsi Utama

Bertanggung jawab untuk menghitung **harga jual (sell price)** berdasarkan HPP dan markup rules.

### Formula

```
Sell Price = HPP + (HPP × Markup Percentage)
```

**Contoh:**
- HPP = Rp 100.000
- Markup = 25%
- Sell Price = Rp 100.000 + (Rp 100.000 × 0.25) = **Rp 125.000**

---

### 📝 Methods

#### 1. `calculateSellPrice(input: PricingCalculationInput)`

Menghitung harga jual untuk **satu item**.

**Input:**
```typescript
{
  item_id: string;
  item_type: ItemType; // MATERIAL | SERVICE
  hpp_per_unit: number;
  quantity: number;
  category?: string; // Optional, akan auto-detect jika tidak ada
}
```

**Output:**
```typescript
{
  item_id: string;
  item_type: ItemType;
  hpp_per_unit: number;
  markup_percentage: number;
  markup_amount_per_unit: number;
  sell_price_per_unit: number;
  quantity: number;
  total_hpp: number;
  total_markup: number;
  total_sell_price: number;
  category: string;
  rule_applied: string;
}
```

**Contoh Penggunaan:**
```typescript
import { PricingEngine } from './PricingEngine.service';

const result = await PricingEngine.calculateSellPrice({
  item_id: 'abc-123',
  item_type: 'MATERIAL',
  hpp_per_unit: 100000,
  quantity: 10
});

console.log(result);
// {
//   markup_percentage: 25,
//   sell_price_per_unit: 125000,
//   total_sell_price: 1250000,
//   ...
// }
```

---

#### 2. `calculateBulkSellPrices(bulkInput: BulkPricingInput)`

Batch calculation untuk **multiple items** - lebih efisien!

**Input:**
```typescript
{
  items: PricingCalculationInput[];
  use_cache?: boolean; // default: true
}
```

**Output:**
```typescript
{
  items: PricingCalculationResult[];
  summary: {
    total_items: number;
    total_hpp: number;
    total_markup: number;
    total_sell_price: number;
    average_markup_percentage: number;
  };
}
```

**Contoh Penggunaan:**
```typescript
const result = await PricingEngine.calculateBulkSellPrices({
  items: [
    { item_id: 'mat-1', item_type: 'MATERIAL', hpp_per_unit: 50000, quantity: 20 },
    { item_id: 'srv-1', item_type: 'SERVICE', hpp_per_unit: 200000, quantity: 5 },
  ],
  use_cache: true
});

console.log(result.summary);
// {
//   total_items: 2,
//   total_hpp: 2000000,
//   total_markup: 500000,
//   total_sell_price: 2500000,
//   average_markup_percentage: 25
// }
```

---

#### 3. `getTotalSellPrice(sellPricePerUnit: number, quantity: number)`

Helper untuk menghitung total harga jual.

**Contoh:**
```typescript
const total = PricingEngine.getTotalSellPrice(125000, 10);
console.log(total); // 1250000
```

---

#### 4. `validateMarkupPolicy(category: string, requestedMarkup: number)`

Validasi apakah markup percentage sesuai kebijakan.

**Output:**
```typescript
{
  is_valid: boolean;
  category: string;
  requested_markup: number;
  allowed_markup: number;
  message: string;
}
```

**Contoh:**
```typescript
const validation = await PricingEngine.validateMarkupPolicy('MATERIAL_DEFAULT', 30);
console.log(validation);
// {
//   is_valid: false,
//   requested_markup: 30,
//   allowed_markup: 25,
//   message: "Markup 30% is outside allowed range..."
// }
```

---

#### 5. `getPricingRuleByCategory(category: string)`

Ambil pricing rule dari database.

**Contoh:**
```typescript
const rule = await PricingEngine.getPricingRuleByCategory('MATERIAL_DEFAULT');
console.log(rule);
// { id: 1, category: 'MATERIAL_DEFAULT', markup_percentage: 25, ... }
```

---

#### 6. `refreshPricingRulesCache()`

Refresh cache dengan data terbaru dari database.

**Contoh:**
```typescript
const count = await PricingEngine.refreshPricingRulesCache();
console.log(`${count} pricing rules loaded`);
// ✅ Pricing rules cache refreshed: 5 rules loaded
```

---

#### 7. `getCachedMarkupPercentage(category: string)`

Ambil markup percentage dari cache atau database dengan fallback ke default.

**Contoh:**
```typescript
const markup = await PricingEngine.getCachedMarkupPercentage('SERVICE_DEFAULT');
console.log(markup); // 30
```

---

### 🗂️ Default Markup Percentages

Jika tidak ada pricing rule di database:

```typescript
{
  'MATERIAL_DEFAULT': 25.0,
  'SERVICE_DEFAULT': 30.0,
  'UNKNOWN': 20.0
}
```

---

### ⚡ Performance Optimization

**Caching:**
- Cache TTL: **5 menit**
- Auto-refresh saat expired
- Manual refresh dengan `refreshPricingRulesCache()`

**Preload Common Categories:**
```typescript
await PricingEngine.preloadCommonCategories([
  'MATERIAL_DEFAULT',
  'SERVICE_DEFAULT',
  'ELECTRICAL',
  'MECHANICAL'
]);
// ✅ Preloaded 4 pricing rules for common categories
```

---

## 🏭 OverheadEngine.service.ts

### Fungsi Utama

Bertanggung jawab untuk menghitung **alokasi overhead** ke HPP (indirect costs seperti Gaji, Sewa, Utilitas).

### Formula

```
Overhead Allocation = Total Direct HPP × Overhead Allocation Percentage
Total HPP = Direct HPP + Overhead Allocation
```

**Contoh:**
- Direct HPP = Rp 80.500.000
- Overhead Allocation = 15%
- Overhead = Rp 80.500.000 × 0.15 = **Rp 12.075.000**
- Total HPP = Rp 80.500.000 + Rp 12.075.000 = **Rp 92.575.000**

---

### 📝 Methods

#### 1. `calculateOverheadAllocation(input: OverheadCalculationInput)`

Menghitung alokasi overhead ke HPP.

**Input:**
```typescript
{
  total_direct_hpp: number;
  project_type?: string;
  use_default_percentage?: boolean;
  custom_percentage?: number;
}
```

**Output:**
```typescript
{
  total_direct_hpp: number;
  overhead_percentage: number;
  overhead_allocation: number;
  total_hpp_with_overhead: number;
  overhead_breakdown: OverheadCategoryBreakdown[];
  policy_applied: string;
  calculation_date: Date;
}
```

**Contoh Penggunaan:**
```typescript
import { OverheadEngine } from './OverheadEngine.service';

const result = await OverheadEngine.calculateOverheadAllocation({
  total_direct_hpp: 80500000,
  use_default_percentage: false // Gunakan system policy
});

console.log(result);
// {
//   overhead_percentage: 15,
//   overhead_allocation: 12075000,
//   total_hpp_with_overhead: 92575000,
//   overhead_breakdown: [
//     { category: 'GAJI_OVERHEAD', allocated_amount: 4000000, ... },
//     { category: 'SEWA_KANTOR', allocated_amount: 3000000, ... },
//     ...
//   ],
//   policy_applied: 'System Policy (15%)'
// }
```

---

#### 2. `getOverheadAllocationPercentage()`

Ambil total % alokasi overhead dari database/cache.

**Contoh:**
```typescript
const percentage = await OverheadEngine.getOverheadAllocationPercentage();
console.log(percentage); // 15
```

---

#### 3. `getOverheadBreakdownByCategory(total_direct_hpp: number)`

Detail alokasi overhead per kategori.

**Output:**
```typescript
[
  {
    category: 'GAJI_OVERHEAD',
    target_percentage: 5,
    allocation_percentage_to_hpp: 5,
    allocated_amount: 4025000,
    description: 'Gaji indirect staff (admin, support)'
  },
  {
    category: 'SEWA_KANTOR',
    target_percentage: 3,
    allocation_percentage_to_hpp: 3,
    allocated_amount: 2415000,
    description: 'Sewa gedung dan fasilitas kantor'
  },
  ...
]
```

**Contoh:**
```typescript
const breakdown = await OverheadEngine.getOverheadBreakdownByCategory(80500000);
console.log(breakdown);
```

---

#### 4. `validateOverheadPolicy()`

Validasi total alokasi overhead ≤ 100% dan reasonable.

**Output:**
```typescript
{
  is_valid: boolean;
  total_allocation_percentage: number;
  max_allowed_percentage: number;
  breakdown: OverheadCategoryBreakdown[];
  warnings: string[];
  message: string;
}
```

**Contoh:**
```typescript
const validation = await OverheadEngine.validateOverheadPolicy();
console.log(validation);
// {
//   is_valid: true,
//   total_allocation_percentage: 15,
//   warnings: [],
//   message: 'Overhead policy is valid. Total allocation: 15.00%'
// }
```

---

#### 5. `compareTargetVsActual(actual_costs: Record<string, number>)`

Bandingkan target vs actual allocation untuk cost control.

**Input:**
```typescript
{
  'GAJI_OVERHEAD': 5000000,
  'SEWA_KANTOR': 2500000,
  'UTILITAS': 1500000,
  ...
}
```

**Output:**
```typescript
{
  total_target: 15,
  total_actual: 100,
  total_variance: -85,
  categories: [
    {
      category: 'GAJI_OVERHEAD',
      target_percentage: 5,
      actual_percentage: 6.2,
      variance: 1.2,
      variance_percentage: 24,
      status: 'OVER' // 'ON_TARGET' | 'OVER' | 'UNDER'
    },
    ...
  ],
  summary: {
    on_target_count: 3,
    over_target_count: 2,
    under_target_count: 1
  }
}
```

**Contoh:**
```typescript
const comparison = await OverheadEngine.compareTargetVsActual({
  'GAJI_OVERHEAD': 5000000,
  'SEWA_KANTOR': 2500000,
  'UTILITAS': 1500000
});

console.log(comparison.summary);
```

---

#### 6. `refreshOverheadPoliciesCache()`

Refresh cache dengan data terbaru.

**Contoh:**
```typescript
const count = await OverheadEngine.refreshOverheadPoliciesCache();
console.log(`${count} overhead policies loaded`);
// ✅ Overhead policies cache refreshed: 8 policies loaded, total allocation: 15.00%
```

---

### 🗂️ Default Settings

- **Default Overhead Percentage:** 15%
- **Max Overhead Percentage:** 100%
- **Variance Tolerance:** 5%
- **Cache TTL:** 10 menit

---

## 🔗 Integration dengan estimationService.ts

### Flow Lengkap

```typescript
// estimationService.ts

export const calculateEstimation = async (input: CalculationInput) => {
  // STEP 1: Calculate HPP per Item
  // ... loop materials & services ...
  
  // STEP 2: Calculate Overhead Allocation
  const overheadResult = await OverheadEngine.calculateOverheadAllocation({
    total_direct_hpp,
    use_default_percentage: overhead_percentage === 0,
    custom_percentage: overhead_percentage > 0 ? overhead_percentage : undefined
  });
  
  // STEP 3: Calculate Sell Prices using PricingEngine
  const pricingResult = await PricingEngine.calculateBulkSellPrices({
    items: pricingInputs,
    use_cache: true
  });
  
  // STEP 4: Merge Results
  // STEP 5: Calculate Final Summary
  // STEP 6: Save to Database (Optional)
  
  return result;
};
```

---

## 📊 Database Schema Required

### Table: `pricing_rules`

```sql
CREATE TABLE pricing_rules (
  id SERIAL PRIMARY KEY,
  category VARCHAR(255) UNIQUE NOT NULL,
  markup_percentage DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Sample Data:**
```sql
INSERT INTO pricing_rules (category, markup_percentage) VALUES
('MATERIAL_DEFAULT', 25.00),
('SERVICE_DEFAULT', 30.00),
('ELECTRICAL', 28.00),
('MECHANICAL', 27.00),
('CIVIL', 22.00);
```

---

### Table: `overhead_cost_allocations`

```sql
CREATE TABLE overhead_cost_allocations (
  id SERIAL PRIMARY KEY,
  cost_category VARCHAR(255) UNIQUE NOT NULL,
  target_percentage DECIMAL(5,2),
  allocation_percentage_to_hpp DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Sample Data:**
```sql
INSERT INTO overhead_cost_allocations (cost_category, target_percentage, allocation_percentage_to_hpp) VALUES
('GAJI_OVERHEAD', 5.00, 5.00),
('SEWA_KANTOR', 3.00, 3.00),
('UTILITAS', 2.00, 2.00),
('DEPRESIASI', 2.00, 2.00),
('ASURANSI', 1.00, 1.00),
('PEMELIHARAAN', 1.00, 1.00),
('ADMINISTRASI', 0.50, 0.50),
('MARKETING', 0.50, 0.50);
```

---

## 🧪 Testing Guide

### Test PricingEngine

```typescript
import { PricingEngine } from './services/PricingEngine.service';

// Test 1: Single Item Calculation
const singleResult = await PricingEngine.calculateSellPrice({
  item_id: 'test-material-1',
  item_type: 'MATERIAL',
  hpp_per_unit: 100000,
  quantity: 10
});
console.log('✅ Single Item:', singleResult);

// Test 2: Bulk Calculation
const bulkResult = await PricingEngine.calculateBulkSellPrices({
  items: [
    { item_id: 'mat-1', item_type: 'MATERIAL', hpp_per_unit: 50000, quantity: 20 },
    { item_id: 'mat-2', item_type: 'MATERIAL', hpp_per_unit: 75000, quantity: 15 },
    { item_id: 'srv-1', item_type: 'SERVICE', hpp_per_unit: 200000, quantity: 5 }
  ],
  use_cache: true
});
console.log('✅ Bulk Summary:', bulkResult.summary);

// Test 3: Validation
const validation = await PricingEngine.validateMarkupPolicy('MATERIAL_DEFAULT', 28);
console.log('✅ Validation:', validation);
```

---

### Test OverheadEngine

```typescript
import { OverheadEngine } from './services/OverheadEngine.service';

// Test 1: Calculate Overhead
const overheadResult = await OverheadEngine.calculateOverheadAllocation({
  total_direct_hpp: 80500000
});
console.log('✅ Overhead:', overheadResult);

// Test 2: Get Breakdown
const breakdown = await OverheadEngine.getOverheadBreakdownByCategory(80500000);
console.log('✅ Breakdown:', breakdown);

// Test 3: Validate Policy
const validation = await OverheadEngine.validateOverheadPolicy();
console.log('✅ Policy Validation:', validation);

// Test 4: Compare Target vs Actual
const comparison = await OverheadEngine.compareTargetVsActual({
  'GAJI_OVERHEAD': 5000000,
  'SEWA_KANTOR': 2500000,
  'UTILITAS': 1500000,
  'DEPRESIASI': 1800000,
  'ASURANSI': 900000,
  'PEMELIHARAAN': 800000,
  'ADMINISTRASI': 400000,
  'MARKETING': 350000
});
console.log('✅ Comparison:', comparison);
```

---

### Test Integration (Full Flow)

```typescript
import { calculateEstimation } from './services/estimationService';

const result = await calculateEstimation({
  project_id: 'proj-123',
  items: [
    {
      item_id: 'mat-1',
      item_type: 'MATERIAL',
      quantity: 100,
      source: 'INTERNAL'
    },
    {
      item_id: 'srv-1',
      item_type: 'SERVICE',
      quantity: 20,
      source: 'INTERNAL'
    }
  ],
  overhead_percentage: 0, // Use system policy
  profit_margin_percentage: 10,
  save_to_db: false
});

console.log('✅ Full Calculation Result:', result);
```

---

## 🚀 API Endpoints (Recommended)

### 1. Calculate Estimation

```
POST /api/estimations/calculate
```

**Body:**
```json
{
  "project_id": "proj-123",
  "items": [
    {
      "item_id": "mat-1",
      "item_type": "MATERIAL",
      "quantity": 100
    }
  ],
  "overhead_percentage": 0,
  "profit_margin_percentage": 10,
  "save_to_db": true,
  "version": 1,
  "status": "DRAFT"
}
```

---

### 2. Get Pricing Rules

```
GET /api/pricing-rules
GET /api/pricing-rules/:category
```

---

### 3. Get Overhead Policies

```
GET /api/overhead-policies
GET /api/overhead-policies/validate
```

---

### 4. Refresh Caches

```
POST /api/pricing-rules/refresh-cache
POST /api/overhead-policies/refresh-cache
```

---

## 🛠️ Troubleshooting

### Error: "Pricing rule not found for category"

**Solusi:**
1. Pastikan tabel `pricing_rules` sudah di-seed
2. Atau akan menggunakan default markup (25% untuk material, 30% untuk service)

### Error: "Overhead policies not found"

**Solusi:**
1. Seed tabel `overhead_cost_allocations`
2. Atau akan menggunakan default 15%

### Error: "Invalid overhead percentage"

**Solusi:**
1. Pastikan percentage antara 0-100
2. Check validasi di `validateOverheadPolicy()`

---

## 📈 Best Practices

### 1. Preload Common Categories
```typescript
// Di startup aplikasi
await PricingEngine.preloadCommonCategories([
  'MATERIAL_DEFAULT',
  'SERVICE_DEFAULT',
  'ELECTRICAL',
  'MECHANICAL'
]);

await OverheadEngine.refreshOverheadPoliciesCache();
```

### 2. Use Bulk Operations
```typescript
// ❌ Bad - Loop manual
for (const item of items) {
  await PricingEngine.calculateSellPrice(item);
}

// ✅ Good - Bulk operation
const result = await PricingEngine.calculateBulkSellPrices({ items });
```

### 3. Handle Errors Gracefully
```typescript
try {
  const result = await PricingEngine.calculateSellPrice(input);
} catch (error) {
  if (error instanceof PricingRuleNotFoundError) {
    // Handle missing pricing rule
  } else if (error instanceof InvalidMarkupError) {
    // Handle invalid markup
  } else {
    // Handle generic error
  }
}
```

### 4. Monitor Cache Performance
```typescript
// Check cache stats
const pricingStats = PricingEngine.getCacheStats();
const overheadStats = OverheadEngine.getCacheStats();

console.log('Pricing Cache:', pricingStats);
console.log('Overhead Cache:', overheadStats);
```

---

## 📞 Support

Untuk pertanyaan atau bug reports, silakan kontak:
- **Engineering Team**
- **Email:** engineering@company.com

---

**Last Updated:** 2025-11-20
**Version:** 1.0.0
