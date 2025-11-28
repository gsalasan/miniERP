# 📇 Developer Quick Reference Card

## 🎯 PricingEngine & OverheadEngine

**Location:** `services/engineering-service/src/services/`

---

## ⚡ Quick Import

```typescript
import { PricingEngine } from './services/PricingEngine.service';
import { OverheadEngine } from './services/OverheadEngine.service';
```

---

## 💰 PricingEngine

### Formula
```
Sell Price = HPP + (HPP × Markup %)
```

### Most Used Methods

```typescript
// 1. Single Item
const result = await PricingEngine.calculateSellPrice({
  item_id: 'mat-123',
  item_type: 'MATERIAL', // or 'SERVICE'
  hpp_per_unit: 100000,
  quantity: 10
});
// Returns: sell_price_per_unit, total_sell_price, markup_percentage, etc.

// 2. Bulk Items (RECOMMENDED)
const bulk = await PricingEngine.calculateBulkSellPrices({
  items: [
    { item_id: 'mat-1', item_type: 'MATERIAL', hpp_per_unit: 50000, quantity: 20 },
    { item_id: 'srv-1', item_type: 'SERVICE', hpp_per_unit: 200000, quantity: 5 }
  ],
  use_cache: true
});
// Returns: items array + summary with totals

// 3. Refresh Cache (on policy update)
await PricingEngine.refreshPricingRulesCache();
```

### Default Markups
```typescript
MATERIAL_DEFAULT: 25%
SERVICE_DEFAULT: 30%
UNKNOWN: 20%
```

---

## 🏭 OverheadEngine

### Formula
```
Overhead = Direct HPP × Overhead %
Total HPP = Direct HPP + Overhead
```

### Most Used Methods

```typescript
// 1. Calculate Overhead
const result = await OverheadEngine.calculateOverheadAllocation({
  total_direct_hpp: 80500000,
  use_default_percentage: false // false = use system policy
});
// Returns: overhead_allocation, total_hpp_with_overhead, breakdown, etc.

// 2. Get Breakdown
const breakdown = await OverheadEngine.getOverheadBreakdownByCategory(80500000);
// Returns: array of categories with allocated amounts

// 3. Refresh Cache (on policy update)
await OverheadEngine.refreshOverheadPoliciesCache();
```

### Default Overhead
```typescript
DEFAULT: 15%
MAX: 100%
```

---

## 🔗 Full Integration Example

```typescript
import { calculateEstimation } from './services/estimationService';

const result = await calculateEstimation({
  project_id: 'proj-123',
  items: [
    { item_id: 'mat-1', item_type: 'MATERIAL', quantity: 100 },
    { item_id: 'srv-1', item_type: 'SERVICE', quantity: 20 }
  ],
  overhead_percentage: 0, // 0 = use system policy, or set custom
  profit_margin_percentage: 10,
  save_to_db: true,
  version: 1,
  status: 'DRAFT'
});

// Result structure:
// {
//   items: [...], // with sell prices
//   summary: {
//     total_direct_hpp,
//     overhead_allocation,
//     total_hpp,
//     total_sell_price,
//     gross_margin,
//     net_profit
//   },
//   overhead_breakdown: [...]
// }
```

---

## 🗄️ Database Tables

### pricing_rules
```sql
SELECT category, markup_percentage FROM pricing_rules;
-- Categories: MATERIAL_DEFAULT, SERVICE_DEFAULT, ELECTRICAL, etc.
```

### overhead_cost_allocations
```sql
SELECT cost_category, allocation_percentage_to_hpp 
FROM overhead_cost_allocations;
-- Categories: GAJI_OVERHEAD, SEWA_KANTOR, UTILITAS, etc.
```

---

## 🔧 Utility Methods

```typescript
// Cache Stats
PricingEngine.getCacheStats();
OverheadEngine.getCacheStats();

// Clear Cache
PricingEngine.clearCache();
OverheadEngine.clearCache();

// Validation
await PricingEngine.validateMarkupPolicy('MATERIAL_DEFAULT', 28);
await OverheadEngine.validateOverheadPolicy();

// Simulation
await OverheadEngine.simulateOverheadAllocation(1000000, [10, 15, 20, 25]);
```

---

## ⚠️ Error Handling

```typescript
import { 
  PricingRuleNotFoundError, 
  InvalidMarkupError,
  OverheadPolicyNotFoundError,
  InvalidOverheadPercentageError
} from './services/...';

try {
  const result = await PricingEngine.calculateSellPrice(...);
} catch (error) {
  if (error instanceof PricingRuleNotFoundError) {
    // Handle: Will fallback to default markup
  } else if (error instanceof InvalidMarkupError) {
    // Handle: Invalid markup percentage
  }
}
```

---

## 🚀 Performance Tips

1. ✅ **Use bulk operations**
   ```typescript
   // ❌ Bad
   for (const item of items) {
     await PricingEngine.calculateSellPrice(item);
   }
   
   // ✅ Good
   await PricingEngine.calculateBulkSellPrices({ items });
   ```

2. ✅ **Preload on startup**
   ```typescript
   // In server.ts or app.ts
   await PricingEngine.refreshPricingRulesCache();
   await OverheadEngine.refreshOverheadPoliciesCache();
   ```

3. ✅ **Use cache in production**
   ```typescript
   await PricingEngine.calculateBulkSellPrices({
     items,
     use_cache: true // Always true in production
   });
   ```

---

## 📊 Sample Calculation

```typescript
// Input
const direct_hpp = 10_000_000;
const items = [
  { item_id: 'mat-1', hpp_per_unit: 50000, quantity: 100 }, // Material
  { item_id: 'srv-1', hpp_per_unit: 200000, quantity: 25 }  // Service
];

// Process
// 1. Direct HPP: Rp 10,000,000
// 2. Overhead (15%): Rp 1,500,000
// 3. Total HPP: Rp 11,500,000
// 4. Markup (Material 25%, Service 30%)
//    - Material sell: Rp 6,250,000
//    - Service sell: Rp 6,500,000
// 5. Total Sell: Rp 12,750,000
// 6. Net Profit: Rp 1,250,000 (10.9%)
```

---

## 🧪 Testing

```bash
# Run tests
cd services/engineering-service
npx tsc
node dist/tests/test-pricing-overhead-engines.js

# Expected: All tests pass (23+)
```

---

## 📚 Documentation

- **Complete Guide:** `PRICING_OVERHEAD_ENGINE_GUIDE.md`
- **Quick Start:** `PRICING_OVERHEAD_QUICK_START.md`
- **Summary:** `IMPLEMENTATION_SUMMARY.md`
- **Deployment:** `DEPLOYMENT_CHECKLIST.md`

---

## 🔍 Common Issues

### Issue: "Pricing rule not found"
**Solution:** Will fallback to default (25% or 30%)

### Issue: "Overhead policy not found"
**Solution:** Will fallback to 15%

### Issue: Cache not working
**Solution:** Check TTL, refresh manually

### Issue: Wrong calculations
**Solution:** Verify database seed data

---

## 💡 Pro Tips

1. Monitor cache stats periodically
2. Refresh cache after policy updates
3. Use bulk operations for multiple items
4. Always handle fallback scenarios
5. Log calculation details for debugging

---

## 📞 Quick Help

- **Docs:** See `PRICING_OVERHEAD_ENGINE_GUIDE.md`
- **Issues:** Check error code and message
- **Testing:** Run test suite first
- **Performance:** Check cache stats

---

**Last Updated:** 2025-11-20  
**Version:** 1.0.0

---

## 🎯 TL;DR

```typescript
// Pricing
const pricing = await PricingEngine.calculateBulkSellPrices({ items });

// Overhead
const overhead = await OverheadEngine.calculateOverheadAllocation({ 
  total_direct_hpp 
});

// Full Estimation
const result = await calculateEstimation({ 
  project_id, 
  items, 
  overhead_percentage: 0 
});
```

**That's it!** 🚀

---

**Print this card or bookmark for quick reference!**
