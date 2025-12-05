# 🚀 Quick Start: PricingEngine & OverheadEngine

## 📋 Ringkasan

Dua service engines untuk kalkulasi estimasi biaya proyek:

1. **PricingEngine** - Hitung harga jual dengan markup
2. **OverheadEngine** - Hitung alokasi overhead ke HPP

---

## ⚡ Quick Usage

### PricingEngine - Hitung Harga Jual

```typescript
import { PricingEngine } from './services/PricingEngine.service';

// Single item
const result = await PricingEngine.calculateSellPrice({
  item_id: 'mat-123',
  item_type: 'MATERIAL',
  hpp_per_unit: 100000,
  quantity: 10
});
// Result: sell_price_per_unit = 125000 (markup 25%)

// Bulk items (lebih efisien!)
const bulkResult = await PricingEngine.calculateBulkSellPrices({
  items: [
    { item_id: 'mat-1', item_type: 'MATERIAL', hpp_per_unit: 50000, quantity: 20 },
    { item_id: 'srv-1', item_type: 'SERVICE', hpp_per_unit: 200000, quantity: 5 }
  ]
});
```

### OverheadEngine - Hitung Overhead

```typescript
import { OverheadEngine } from './services/OverheadEngine.service';

const result = await OverheadEngine.calculateOverheadAllocation({
  total_direct_hpp: 80500000
});
// Result: 
// - overhead_percentage: 15%
// - overhead_allocation: 12,075,000
// - total_hpp_with_overhead: 92,575,000
```

---

## 📊 Formula

### PricingEngine
```
Sell Price = HPP + (HPP × Markup %)
Contoh: Rp 100.000 + (Rp 100.000 × 25%) = Rp 125.000
```

### OverheadEngine
```
Overhead = Direct HPP × Overhead %
Total HPP = Direct HPP + Overhead
Contoh: Rp 80.500.000 × 15% = Rp 12.075.000
```

---

## 🗄️ Database Setup

### 1. Jalankan Migration (jika belum)

```bash
cd services/engineering-service
npx prisma migrate dev
```

### 2. Seed Data

```bash
psql -U your_user -d your_database -f seed-pricing-overhead-data.sql
```

**Atau dengan Prisma:**
```typescript
import prisma from './prisma/client';

// Run seeder script
await prisma.$executeRawUnsafe(`
  -- Copy isi dari seed-pricing-overhead-data.sql
`);
```

---

## 🎯 Integration ke EstimationService

File `estimationService.ts` sudah diupdate dengan flow:

```typescript
1. Calculate HPP per Item
2. OverheadEngine.calculateOverheadAllocation() 
3. PricingEngine.calculateBulkSellPrices()
4. Merge Results
5. Calculate Final Summary
6. Save to Database
```

**Cara pakai:**
```typescript
import { calculateEstimation } from './services/estimationService';

const result = await calculateEstimation({
  project_id: 'proj-123',
  items: [
    { item_id: 'mat-1', item_type: 'MATERIAL', quantity: 100 },
    { item_id: 'srv-1', item_type: 'SERVICE', quantity: 20 }
  ],
  overhead_percentage: 0, // 0 = use system policy
  profit_margin_percentage: 10,
  save_to_db: true,
  version: 1,
  status: 'DRAFT'
});
```

---

## 🧪 Testing

```bash
cd services/engineering-service

# Compile TypeScript
npx tsc

# Run tests
node dist/tests/test-pricing-overhead-engines.js
```

---

## 📦 File Structure

```
services/engineering-service/src/
├── services/
│   ├── PricingEngine.service.ts      ✅ BARU
│   ├── OverheadEngine.service.ts     ✅ BARU
│   └── estimationService.ts          ✅ UPDATED
├── tests/
│   └── test-pricing-overhead-engines.ts  ✅ BARU
└── prisma/
    └── client.ts

Root directory:
├── PRICING_OVERHEAD_ENGINE_GUIDE.md     ✅ Dokumentasi lengkap
├── PRICING_OVERHEAD_QUICK_START.md      ✅ Quick reference (file ini)
└── seed-pricing-overhead-data.sql       ✅ Seeder SQL
```

---

## 🔧 Methods Utama

### PricingEngine

| Method | Purpose |
|--------|---------|
| `calculateSellPrice()` | Single item calculation |
| `calculateBulkSellPrices()` | Batch calculation (recommended) |
| `validateMarkupPolicy()` | Validasi markup percentage |
| `getPricingRuleByCategory()` | Get pricing rule by category |
| `refreshPricingRulesCache()` | Refresh cache |

### OverheadEngine

| Method | Purpose |
|--------|---------|
| `calculateOverheadAllocation()` | Hitung overhead allocation |
| `getOverheadBreakdownByCategory()` | Detail per kategori |
| `validateOverheadPolicy()` | Validasi policy |
| `compareTargetVsActual()` | Compare untuk analisis |
| `refreshOverheadPoliciesCache()` | Refresh cache |

---

## 🎨 Default Values

### Markup Percentages
- Material Default: **25%**
- Service Default: **30%**
- Unknown: **20%**

### Overhead
- Default Percentage: **15%**
- Max Allowed: **100%**
- Cache TTL: **10 minutes**

---

## ⚠️ Troubleshooting

### Error: "Pricing rule not found"
**Fix:** Akan fallback ke default markup (25% material, 30% service)

### Error: "Overhead policies not found"
**Fix:** Akan fallback ke 15% default

### Error: "Invalid overhead percentage"
**Fix:** Pastikan percentage 0-100

---

## 📚 Dokumentasi Lengkap

Lihat `PRICING_OVERHEAD_ENGINE_GUIDE.md` untuk:
- Penjelasan detail semua methods
- Contoh penggunaan lengkap
- Error handling guide
- Best practices
- API endpoints recommendations

---

## 🎯 Next Steps

1. ✅ Jalankan seed data
2. ✅ Test dengan `test-pricing-overhead-engines.ts`
3. ✅ Integrate ke frontend
4. ✅ Add API endpoints (optional)
5. ✅ Monitor performance dengan cache stats

---

## 📞 Support

Ada pertanyaan? Lihat dokumentasi lengkap atau kontak Engineering Team.

**Last Updated:** 2025-11-20  
**Version:** 1.0.0
