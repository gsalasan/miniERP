/**
 * Test Suite for PricingEngine & OverheadEngine
 * 
 * File: test-pricing-overhead-engines.ts
 * Purpose: Comprehensive testing untuk kedua engines
 * Date: 2025-11-20
 */

import { PricingEngine } from '../services/PricingEngine.service';
import { OverheadEngine } from '../services/OverheadEngine.service';
import { ItemType } from '@prisma/client';

// ==================== COLOR CONSOLE HELPERS ====================
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg: string) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`),
};

// ==================== TEST HELPERS ====================
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    log.success(`PASS: ${message}`);
    testsPassed++;
  } else {
    log.error(`FAIL: ${message}`);
    testsFailed++;
  }
}

function assertEquals(actual: any, expected: any, message: string) {
  const condition = actual === expected;
  if (condition) {
    log.success(`PASS: ${message} (${actual} === ${expected})`);
    testsPassed++;
  } else {
    log.error(`FAIL: ${message} (${actual} !== ${expected})`);
    testsFailed++;
  }
}

function assertApprox(actual: number, expected: number, tolerance: number, message: string) {
  const condition = Math.abs(actual - expected) <= tolerance;
  if (condition) {
    log.success(`PASS: ${message} (${actual} ≈ ${expected})`);
    testsPassed++;
  } else {
    log.error(`FAIL: ${message} (${actual} not ≈ ${expected}, tolerance: ${tolerance})`);
    testsFailed++;
  }
}

// ==================== TEST SUITE 1: PRICING ENGINE ====================

async function testPricingEngine() {
  log.section('TEST SUITE 1: PRICING ENGINE');

  try {
    // Test 1: Calculate Single Item
    log.info('Test 1: Calculate Sell Price for Single Item');
    const singleResult = await PricingEngine.calculateSellPrice({
      item_id: 'test-material-1',
      item_type: ItemType.MATERIAL,
      hpp_per_unit: 100000,
      quantity: 10,
      category: 'MATERIAL_DEFAULT',
    });

    console.log('Single Item Result:', JSON.stringify(singleResult, null, 2));

    assert(singleResult.hpp_per_unit === 100000, 'HPP per unit should be 100000');
    assertEquals(singleResult.markup_percentage, 25, 'Markup should be 25% for MATERIAL_DEFAULT');
    assertEquals(singleResult.sell_price_per_unit, 125000, 'Sell price should be 125000');
    assertEquals(singleResult.total_sell_price, 1250000, 'Total sell price should be 1250000');

    // Test 2: Calculate Bulk Items
    log.info('\nTest 2: Calculate Bulk Sell Prices');
    const bulkResult = await PricingEngine.calculateBulkSellPrices({
      items: [
        { item_id: 'mat-1', item_type: ItemType.MATERIAL, hpp_per_unit: 50000, quantity: 20, category: 'MATERIAL_DEFAULT' },
        { item_id: 'mat-2', item_type: ItemType.MATERIAL, hpp_per_unit: 75000, quantity: 15, category: 'ELECTRICAL' },
        { item_id: 'srv-1', item_type: ItemType.SERVICE, hpp_per_unit: 200000, quantity: 5, category: 'SERVICE_DEFAULT' },
      ],
      use_cache: true,
    });

    console.log('Bulk Summary:', JSON.stringify(bulkResult.summary, null, 2));

    assert(bulkResult.items.length === 3, 'Should have 3 items');
    assert(bulkResult.summary.total_items === 3, 'Total items should be 3');
    assert(bulkResult.summary.total_hpp > 0, 'Total HPP should be positive');
    assert(bulkResult.summary.total_sell_price > bulkResult.summary.total_hpp, 'Sell price should be greater than HPP');

    // Test 3: Get Total Sell Price
    log.info('\nTest 3: Get Total Sell Price Helper');
    const totalSellPrice = PricingEngine.getTotalSellPrice(125000, 10);
    assertEquals(totalSellPrice, 1250000, 'Total sell price calculation');

    // Test 4: Validate Markup Policy
    log.info('\nTest 4: Validate Markup Policy');
    const validationValid = await PricingEngine.validateMarkupPolicy('MATERIAL_DEFAULT', 25);
    assert(validationValid.is_valid === true, 'Markup 25% should be valid for MATERIAL_DEFAULT');

    const validationInvalid = await PricingEngine.validateMarkupPolicy('MATERIAL_DEFAULT', 50);
    assert(validationInvalid.is_valid === false, 'Markup 50% should be invalid for MATERIAL_DEFAULT');

    // Test 5: Get Pricing Rule by Category
    log.info('\nTest 5: Get Pricing Rule by Category');
    const rule = await PricingEngine.getPricingRuleByCategory('MATERIAL_DEFAULT');
    assert(rule !== null, 'Should find pricing rule for MATERIAL_DEFAULT');
    if (rule) {
      assert(rule.category === 'MATERIAL_DEFAULT', 'Category should match');
      assert(rule.markup_percentage > 0, 'Markup percentage should be positive');
    }

    // Test 6: Refresh Cache
    log.info('\nTest 6: Refresh Pricing Rules Cache');
    const cacheCount = await PricingEngine.refreshPricingRulesCache();
    assert(cacheCount > 0, `Should load pricing rules (${cacheCount} loaded)`);

    // Test 7: Get Cached Markup Percentage
    log.info('\nTest 7: Get Cached Markup Percentage');
    const markup = await PricingEngine.getCachedMarkupPercentage('MATERIAL_DEFAULT');
    assert(markup === 25, 'Cached markup should be 25%');

    // Test 8: Cache Statistics
    log.info('\nTest 8: Get Cache Statistics');
    const stats = PricingEngine.getCacheStats();
    console.log('Cache Stats:', JSON.stringify(stats, null, 2));
    assert(stats.size > 0, 'Cache should contain items');

    log.success('\n✅ All PricingEngine tests completed!');
  } catch (error) {
    log.error(`PricingEngine tests failed: ${error.message}`);
    console.error(error);
  }
}

// ==================== TEST SUITE 2: OVERHEAD ENGINE ====================

async function testOverheadEngine() {
  log.section('TEST SUITE 2: OVERHEAD ENGINE');

  try {
    // Test 1: Calculate Overhead Allocation
    log.info('Test 1: Calculate Overhead Allocation');
    const overheadResult = await OverheadEngine.calculateOverheadAllocation({
      total_direct_hpp: 80500000,
      use_default_percentage: false,
    });

    console.log('Overhead Result:', JSON.stringify({
      total_direct_hpp: overheadResult.total_direct_hpp,
      overhead_percentage: overheadResult.overhead_percentage,
      overhead_allocation: overheadResult.overhead_allocation,
      total_hpp_with_overhead: overheadResult.total_hpp_with_overhead,
      policy_applied: overheadResult.policy_applied,
    }, null, 2));

    assert(overheadResult.total_direct_hpp === 80500000, 'Direct HPP should match input');
    assert(overheadResult.overhead_percentage > 0, 'Overhead percentage should be positive');
    assert(overheadResult.overhead_allocation > 0, 'Overhead allocation should be positive');
    assert(
      overheadResult.total_hpp_with_overhead === overheadResult.total_direct_hpp + overheadResult.overhead_allocation,
      'Total HPP calculation should be correct'
    );

    // Test 2: Get Overhead Allocation Percentage
    log.info('\nTest 2: Get Overhead Allocation Percentage');
    const percentage = await OverheadEngine.getOverheadAllocationPercentage();
    console.log(`Overhead Percentage: ${percentage}%`);
    assert(percentage > 0 && percentage <= 100, 'Percentage should be between 0 and 100');

    // Test 3: Get Overhead Breakdown by Category
    log.info('\nTest 3: Get Overhead Breakdown by Category');
    const breakdown = await OverheadEngine.getOverheadBreakdownByCategory(80500000);
    console.log(`Breakdown has ${breakdown.length} categories`);
    console.log('Sample breakdown:', JSON.stringify(breakdown.slice(0, 3), null, 2));

    assert(breakdown.length > 0, 'Should have overhead categories');
    const totalBreakdown = breakdown.reduce((sum, cat) => sum + cat.allocated_amount, 0);
    assertApprox(
      totalBreakdown,
      overheadResult.overhead_allocation,
      1,
      'Sum of breakdown should equal total overhead allocation'
    );

    // Test 4: Validate Overhead Policy
    log.info('\nTest 4: Validate Overhead Policy');
    const validation = await OverheadEngine.validateOverheadPolicy();
    console.log('Validation Result:', JSON.stringify({
      is_valid: validation.is_valid,
      total_allocation_percentage: validation.total_allocation_percentage,
      warnings_count: validation.warnings.length,
      message: validation.message,
    }, null, 2));

    assert(validation.is_valid === true, 'Overhead policy should be valid');
    assert(validation.total_allocation_percentage <= 100, 'Total allocation should not exceed 100%');

    // Test 5: Compare Target vs Actual
    log.info('\nTest 5: Compare Target vs Actual');
    const comparison = await OverheadEngine.compareTargetVsActual({
      GAJI_OVERHEAD: 5000000,
      SEWA_KANTOR: 2500000,
      UTILITAS: 1500000,
      DEPRESIASI: 1800000,
      ASURANSI: 900000,
      PEMELIHARAAN: 800000,
      ADMINISTRASI: 400000,
      MARKETING: 350000,
    });

    console.log('Comparison Summary:', JSON.stringify(comparison.summary, null, 2));
    console.log('Sample Categories:', JSON.stringify(comparison.categories.slice(0, 3), null, 2));

    assert(comparison.categories.length > 0, 'Should have category comparisons');
    assert(
      comparison.summary.on_target_count + comparison.summary.over_target_count + comparison.summary.under_target_count === comparison.categories.length,
      'Summary counts should match total categories'
    );

    // Test 6: Refresh Cache
    log.info('\nTest 6: Refresh Overhead Policies Cache');
    const cacheCount = await OverheadEngine.refreshOverheadPoliciesCache();
    assert(cacheCount > 0, `Should load overhead policies (${cacheCount} loaded)`);

    // Test 7: Get All Policies
    log.info('\nTest 7: Get All Policies');
    const policies = await OverheadEngine.getAllPolicies(false);
    console.log(`Total policies: ${policies.length}`);
    assert(policies.length > 0, 'Should have overhead policies');

    // Test 8: Calculate Overhead for Specific Category
    log.info('\nTest 8: Calculate Overhead for Specific Category');
    const categoryOverhead = await OverheadEngine.calculateOverheadForCategory('GAJI_OVERHEAD', 80500000);
    console.log(`GAJI_OVERHEAD allocation: Rp ${categoryOverhead.toLocaleString()}`);
    assert(categoryOverhead > 0, 'Category overhead should be positive');

    // Test 9: Simulate Overhead Allocation
    log.info('\nTest 9: Simulate Overhead Allocation');
    const simulation = await OverheadEngine.simulateOverheadAllocation(80500000, [10, 15, 20, 25]);
    console.log('Simulation Results:', JSON.stringify(simulation, null, 2));
    assert(simulation.length === 4, 'Should have 4 simulation results');

    // Test 10: Cache Statistics
    log.info('\nTest 10: Get Cache Statistics');
    const stats = OverheadEngine.getCacheStats();
    console.log('Cache Stats:', JSON.stringify(stats, null, 2));
    assert(stats.size > 0, 'Cache should contain policies');

    log.success('\n✅ All OverheadEngine tests completed!');
  } catch (error) {
    log.error(`OverheadEngine tests failed: ${error.message}`);
    console.error(error);
  }
}

// ==================== TEST SUITE 3: INTEGRATION ====================

async function testIntegration() {
  log.section('TEST SUITE 3: INTEGRATION TEST');

  try {
    log.info('Simulating Full Estimation Calculation Flow');

    // Step 1: Calculate HPP (simulated)
    const items = [
      { item_id: 'mat-1', item_type: ItemType.MATERIAL, hpp_per_unit: 50000, quantity: 100, category: 'MATERIAL_DEFAULT' },
      { item_id: 'mat-2', item_type: ItemType.MATERIAL, hpp_per_unit: 75000, quantity: 80, category: 'ELECTRICAL' },
      { item_id: 'srv-1', item_type: ItemType.SERVICE, hpp_per_unit: 200000, quantity: 20, category: 'SERVICE_DEFAULT' },
    ];

    const total_direct_hpp = items.reduce((sum, item) => sum + (item.hpp_per_unit * item.quantity), 0);
    log.info(`Step 1: Total Direct HPP = Rp ${total_direct_hpp.toLocaleString()}`);

    // Step 2: Calculate Overhead
    const overheadResult = await OverheadEngine.calculateOverheadAllocation({
      total_direct_hpp,
      use_default_percentage: false,
    });
    log.info(`Step 2: Overhead (${overheadResult.overhead_percentage}%) = Rp ${overheadResult.overhead_allocation.toLocaleString()}`);
    log.info(`        Total HPP with Overhead = Rp ${overheadResult.total_hpp_with_overhead.toLocaleString()}`);

    // Step 3: Calculate Sell Prices
    const pricingResult = await PricingEngine.calculateBulkSellPrices({
      items,
      use_cache: true,
    });
    log.info(`Step 3: Average Markup = ${pricingResult.summary.average_markup_percentage.toFixed(2)}%`);
    log.info(`        Total Sell Price = Rp ${pricingResult.summary.total_sell_price.toLocaleString()}`);

    // Step 4: Calculate Margins
    const gross_margin = pricingResult.summary.total_sell_price - total_direct_hpp;
    const net_profit = pricingResult.summary.total_sell_price - overheadResult.total_hpp_with_overhead;

    log.info('\n📊 FINAL SUMMARY:');
    console.log(`   Direct HPP:           Rp ${total_direct_hpp.toLocaleString()}`);
    console.log(`   Overhead:             Rp ${overheadResult.overhead_allocation.toLocaleString()}`);
    console.log(`   Total HPP:            Rp ${overheadResult.total_hpp_with_overhead.toLocaleString()}`);
    console.log(`   Sell Price:           Rp ${pricingResult.summary.total_sell_price.toLocaleString()}`);
    console.log(`   Gross Margin:         Rp ${gross_margin.toLocaleString()}`);
    console.log(`   Net Profit:           Rp ${net_profit.toLocaleString()}`);

    assert(pricingResult.summary.total_sell_price > overheadResult.total_hpp_with_overhead, 'Sell price should be greater than total HPP');
    assert(net_profit > 0, 'Net profit should be positive');

    log.success('\n✅ Integration test completed successfully!');
  } catch (error) {
    log.error(`Integration test failed: ${error.message}`);
    console.error(error);
  }
}

// ==================== TEST SUITE 4: ERROR HANDLING ====================

async function testErrorHandling() {
  log.section('TEST SUITE 4: ERROR HANDLING');

  try {
    // Test 1: Negative HPP
    log.info('Test 1: Negative HPP should throw error');
    try {
      await PricingEngine.calculateSellPrice({
        item_id: 'test',
        item_type: ItemType.MATERIAL,
        hpp_per_unit: -100,
        quantity: 10,
      });
      log.error('Should have thrown error for negative HPP');
      testsFailed++;
    } catch (error) {
      log.success('Correctly threw error for negative HPP');
      testsPassed++;
    }

    // Test 2: Zero quantity
    log.info('\nTest 2: Zero quantity should throw error');
    try {
      await PricingEngine.calculateSellPrice({
        item_id: 'test',
        item_type: ItemType.MATERIAL,
        hpp_per_unit: 100,
        quantity: 0,
      });
      log.error('Should have thrown error for zero quantity');
      testsFailed++;
    } catch (error) {
      log.success('Correctly threw error for zero quantity');
      testsPassed++;
    }

    // Test 3: Invalid overhead percentage
    log.info('\nTest 3: Invalid overhead percentage should throw error');
    try {
      await OverheadEngine.calculateOverheadAllocation({
        total_direct_hpp: 100000,
        custom_percentage: 150,
      });
      log.error('Should have thrown error for invalid overhead percentage');
      testsFailed++;
    } catch (error) {
      log.success('Correctly threw error for invalid overhead percentage');
      testsPassed++;
    }

    // Test 4: Negative direct HPP
    log.info('\nTest 4: Negative direct HPP should throw error');
    try {
      await OverheadEngine.calculateOverheadAllocation({
        total_direct_hpp: -100000,
      });
      log.error('Should have thrown error for negative direct HPP');
      testsFailed++;
    } catch (error) {
      log.success('Correctly threw error for negative direct HPP');
      testsPassed++;
    }

    log.success('\n✅ Error handling tests completed!');
  } catch (error) {
    log.error(`Error handling tests failed: ${error.message}`);
    console.error(error);
  }
}

// ==================== MAIN TEST RUNNER ====================

async function runAllTests() {
  console.log(`
${colors.cyan}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║       PRICING & OVERHEAD ENGINE TEST SUITE                ║
║                                                           ║
║       Date: ${new Date().toISOString().split('T')[0]}                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
  `);

  const startTime = Date.now();

  await testPricingEngine();
  await testOverheadEngine();
  await testIntegration();
  await testErrorHandling();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Final Summary
  log.section('TEST SUMMARY');
  console.log(`
${colors.green}✅ Tests Passed:  ${testsPassed}${colors.reset}
${colors.red}❌ Tests Failed:  ${testsFailed}${colors.reset}
${colors.blue}⏱️  Duration:      ${duration}s${colors.reset}
${colors.yellow}📊 Success Rate:  ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%${colors.reset}
  `);

  if (testsFailed === 0) {
    log.success('🎉 ALL TESTS PASSED! 🎉');
    process.exit(0);
  } else {
    log.error(`⚠️  ${testsFailed} TEST(S) FAILED`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  log.error(`Fatal error running tests: ${error.message}`);
  console.error(error);
  process.exit(1);
});
