# ✅ Deployment Checklist: PricingEngine & OverheadEngine

**Project:** miniERP - Engineering Service  
**Feature:** PricingEngine & OverheadEngine  
**Date:** 2025-11-20  
**Status:** Ready for Deployment

---

## 📋 Pre-Deployment Checklist

### 1. Code Review
- [x] PricingEngine.service.ts implemented
- [x] OverheadEngine.service.ts implemented
- [x] estimationService.ts updated
- [x] All methods have proper TypeScript types
- [x] Error handling implemented
- [x] Custom exceptions defined
- [x] Logging added for debugging

### 2. Testing
- [x] Test file created (test-pricing-overhead-engines.ts)
- [x] 23+ test cases written
- [x] PricingEngine tests (8 tests)
- [x] OverheadEngine tests (10 tests)
- [x] Integration tests (1 test)
- [x] Error handling tests (4 tests)
- [ ] **TODO: Run all tests and verify passing**

### 3. Documentation
- [x] Complete guide created (900+ lines)
- [x] Quick start guide created
- [x] Implementation summary created
- [x] Inline code comments added
- [x] SQL seeder documented
- [x] API examples provided

### 4. Database
- [x] SQL seeder created (seed-pricing-overhead-data.sql)
- [x] 23 pricing rules defined
- [x] 22 overhead categories defined
- [x] Verification queries included
- [ ] **TODO: Run seeder in database**
- [ ] **TODO: Verify data integrity**

---

## 🚀 Deployment Steps

### Step 1: Database Setup

```bash
# 1. Backup database (IMPORTANT!)
pg_dump -U your_user your_database > backup_before_pricing_overhead_$(date +%Y%m%d).sql

# 2. Run seeder
psql -U your_user -d your_database -f seed-pricing-overhead-data.sql

# 3. Verify data
psql -U your_user -d your_database -c "
  SELECT 
    (SELECT COUNT(*) FROM pricing_rules) as pricing_rules_count,
    (SELECT COUNT(*) FROM overhead_cost_allocations) as overhead_policies_count,
    (SELECT SUM(allocation_percentage_to_hpp) FROM overhead_cost_allocations) as total_overhead_percentage;
"
```

**Expected Output:**
```
pricing_rules_count | overhead_policies_count | total_overhead_percentage
--------------------+------------------------+-------------------------
        23          |          22            |         22.00
```

---

### Step 2: Code Deployment

```bash
cd services/engineering-service

# 1. Install dependencies (if any new)
npm install

# 2. Compile TypeScript
npx tsc

# 3. Verify compilation
ls -la dist/services/PricingEngine.service.js
ls -la dist/services/OverheadEngine.service.js
```

---

### Step 3: Testing

```bash
# Run test suite
node dist/tests/test-pricing-overhead-engines.js

# Expected: All tests pass
# Output should show:
# ✅ Tests Passed: 23+
# ❌ Tests Failed: 0
```

---

### Step 4: Cache Initialization (Optional)

```typescript
// Add to server startup (app.ts or server.ts)
import { PricingEngine } from './services/PricingEngine.service';
import { OverheadEngine } from './services/OverheadEngine.service';

// On server startup
async function initializeCaches() {
  console.log('🔄 Initializing caches...');
  
  // Preload pricing rules
  await PricingEngine.refreshPricingRulesCache();
  
  // Preload overhead policies
  await OverheadEngine.refreshOverheadPoliciesCache();
  
  // Preload common categories
  await PricingEngine.preloadCommonCategories([
    'MATERIAL_DEFAULT',
    'SERVICE_DEFAULT',
    'ELECTRICAL',
    'MECHANICAL',
    'CIVIL'
  ]);
  
  console.log('✅ Caches initialized');
}

// Call on startup
initializeCaches().catch(console.error);
```

---

### Step 5: Service Restart

```bash
# Development
npm run dev

# Production
pm2 restart engineering-service
# OR
docker-compose restart engineering-service
# OR
systemctl restart engineering-service
```

---

### Step 6: Smoke Tests

```bash
# Test API endpoints (if created)
curl -X POST http://localhost:3000/api/estimations/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test-project",
    "items": [
      {
        "item_id": "mat-1",
        "item_type": "MATERIAL",
        "quantity": 10
      }
    ],
    "overhead_percentage": 0,
    "profit_margin_percentage": 10,
    "save_to_db": false
  }'
```

---

## 🔍 Post-Deployment Verification

### 1. Database Verification

```sql
-- Check pricing rules
SELECT COUNT(*) FROM pricing_rules;
-- Expected: 23

-- Check overhead policies
SELECT COUNT(*) FROM overhead_cost_allocations;
-- Expected: 22

-- Check total overhead percentage
SELECT SUM(allocation_percentage_to_hpp) as total 
FROM overhead_cost_allocations;
-- Expected: ~22.00 (should be <= 100)

-- Sample pricing rules
SELECT category, markup_percentage 
FROM pricing_rules 
WHERE category IN ('MATERIAL_DEFAULT', 'SERVICE_DEFAULT')
ORDER BY category;
-- Expected:
-- MATERIAL_DEFAULT | 25.00
-- SERVICE_DEFAULT  | 30.00
```

---

### 2. Functionality Verification

```typescript
// Test in Node.js console or API endpoint

import { PricingEngine } from './services/PricingEngine.service';
import { OverheadEngine } from './services/OverheadEngine.service';

// Test PricingEngine
const pricingResult = await PricingEngine.calculateSellPrice({
  item_id: 'test-1',
  item_type: 'MATERIAL',
  hpp_per_unit: 100000,
  quantity: 10,
  category: 'MATERIAL_DEFAULT'
});

console.log('Pricing Test:', {
  hpp: pricingResult.hpp_per_unit,
  markup: pricingResult.markup_percentage,
  sellPrice: pricingResult.sell_price_per_unit
});
// Expected: hpp: 100000, markup: 25, sellPrice: 125000

// Test OverheadEngine
const overheadResult = await OverheadEngine.calculateOverheadAllocation({
  total_direct_hpp: 10000000
});

console.log('Overhead Test:', {
  directHpp: overheadResult.total_direct_hpp,
  overheadPct: overheadResult.overhead_percentage,
  overhead: overheadResult.overhead_allocation,
  totalHpp: overheadResult.total_hpp_with_overhead
});
// Expected: Overhead should be calculated based on policies
```

---

### 3. Cache Verification

```typescript
// Check cache stats
const pricingStats = PricingEngine.getCacheStats();
const overheadStats = OverheadEngine.getCacheStats();

console.log('Pricing Cache:', pricingStats);
console.log('Overhead Cache:', overheadStats);

// Expected:
// - size > 0
// - lastRefresh should be recent
// - isExpired should be false
```

---

### 4. Integration Verification

```typescript
// Test full estimation calculation
import { calculateEstimation } from './services/estimationService';

const result = await calculateEstimation({
  project_id: 'test-project-123',
  items: [
    {
      item_id: 'existing-material-id',
      item_type: 'MATERIAL',
      quantity: 100,
      source: 'INTERNAL'
    }
  ],
  overhead_percentage: 0, // Use system policy
  profit_margin_percentage: 10,
  save_to_db: false
});

console.log('Full Calculation:', {
  directHpp: result.summary.total_direct_hpp,
  overhead: result.summary.total_overhead_allocation,
  totalHpp: result.summary.total_hpp,
  sellPrice: result.summary.total_sell_price,
  netProfit: result.summary.net_profit
});

// Verify:
// - All calculations are correct
// - Overhead breakdown is present
// - Items have markup applied
// - Net profit is positive
```

---

## 📊 Monitoring

### Key Metrics to Monitor

1. **Performance**
   - Cache hit rate
   - Average calculation time
   - Database query time

2. **Accuracy**
   - Markup percentages applied
   - Overhead allocation correctness
   - Total calculations accuracy

3. **Usage**
   - Number of calculations per day
   - Most used categories
   - Cache refresh frequency

### Logging

```typescript
// Add monitoring logs
console.log('📊 PricingEngine Stats:', PricingEngine.getCacheStats());
console.log('📊 OverheadEngine Stats:', OverheadEngine.getCacheStats());

// Monitor calculation time
const startTime = Date.now();
const result = await calculateEstimation(...);
const duration = Date.now() - startTime;
console.log(`⏱️ Calculation took ${duration}ms`);
```

---

## 🚨 Rollback Plan

### If Issues Occur

1. **Database Rollback**
   ```bash
   # Restore from backup
   psql -U your_user -d your_database < backup_before_pricing_overhead_YYYYMMDD.sql
   ```

2. **Code Rollback**
   ```bash
   # Revert Git commit
   git revert HEAD
   git push
   
   # Redeploy previous version
   pm2 restart engineering-service
   ```

3. **Quick Fix: Disable New Features**
   ```typescript
   // In estimationService.ts - temporarily use old logic
   const USE_NEW_ENGINES = false;
   
   if (USE_NEW_ENGINES) {
     // New logic with PricingEngine & OverheadEngine
   } else {
     // Old logic (fallback)
   }
   ```

---

## ✅ Final Checklist

Before marking deployment as complete:

- [ ] Database seeded successfully
- [ ] All tests passing
- [ ] Service restarted without errors
- [ ] Smoke tests passed
- [ ] Cache initialized
- [ ] Logs showing correct behavior
- [ ] Sample calculation verified
- [ ] Documentation accessible
- [ ] Team notified of new features
- [ ] Monitoring in place

---

## 📝 Known Issues & Limitations

### Current Limitations
1. Service HPP defaults to 0 (need to implement cost calculation)
2. Cache TTL is fixed (not configurable)
3. No user-specific markup rules yet
4. No project-type specific overhead yet

### Future Enhancements
1. Add configurable cache TTL
2. Implement service cost calculation
3. Add user/role-based markup rules
4. Add project-type overhead allocation
5. Add historical pricing comparison
6. Add bulk policy updates API
7. Add export functionality for reports

---

## 🎯 Success Criteria

✅ **Deployment is successful if:**
1. All tests pass (23+ test cases)
2. Database has all required data (45 categories)
3. Service starts without errors
4. Sample calculations return correct results
5. Cache statistics show proper initialization
6. No errors in logs for 24 hours
7. Performance is acceptable (< 1s per calculation)

---

## 📞 Support Contacts

**Engineering Team:**
- Lead: [Name]
- Email: engineering@company.com
- Slack: #engineering

**Database Team:**
- Lead: [Name]
- Email: dba@company.com
- Slack: #database

**DevOps:**
- Lead: [Name]
- Email: devops@company.com
- Slack: #devops

---

## 📚 Reference Documents

- `PRICING_OVERHEAD_ENGINE_GUIDE.md` - Complete guide
- `PRICING_OVERHEAD_QUICK_START.md` - Quick reference
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `seed-pricing-overhead-data.sql` - Database seeder

---

**Deployment Date:** [TO BE FILLED]  
**Deployed By:** [TO BE FILLED]  
**Version:** 1.0.0  
**Status:** ⏳ Pending → ✅ Complete

---

## 🎉 Post-Deployment

After successful deployment:

1. ✅ Update team on new features
2. ✅ Schedule training session (if needed)
3. ✅ Monitor for 24-48 hours
4. ✅ Collect feedback from users
5. ✅ Plan next iteration enhancements

---

**END OF CHECKLIST**
