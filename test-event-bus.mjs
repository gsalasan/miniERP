/**
 * Test script for Event Bus
 * Tests both in-process and distributed (Redis) event publishing/subscribing
 */

import { createEventBus } from './services/shared-event-bus/dist/index.js';
import { EventNames } from './services/shared-event-bus/dist/events.js';

// Set Redis URL (use localhost for testing outside Docker)
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

console.log('🧪 Event Bus Test Script');
console.log('======================\n');

// Create event bus instances for different services
const crmEventBus = createEventBus('crm-service-test');
const financeEventBus = createEventBus('finance-service-test');
const engineeringEventBus = createEventBus('engineering-service-test');
const hrEventBus = createEventBus('hr-service-test');

// Test results
const testResults = {
  inProcess: { passed: 0, failed: 0 },
  distributed: { passed: 0, failed: 0 },
};

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: In-process event (same service)
console.log('📋 Test 1: In-process Event (Same Service)');
console.log('------------------------------------------');

let inProcessReceived = false;
crmEventBus.subscribe(EventNames.CUSTOMER_CREATED, async (payload) => {
  console.log('  ✓ Received customer:created event:', payload.data.customerName);
  inProcessReceived = true;
  testResults.inProcess.passed++;
});

// Publish in-process event
await crmEventBus.publish(EventNames.CUSTOMER_CREATED, {
  customerId: 'test-customer-1',
  customerName: 'Test Customer',
  channel: 'ONLINE',
  city: 'Jakarta',
  status: 'ACTIVE',
});

await wait(500);

if (inProcessReceived) {
  console.log('  ✅ In-process event test PASSED\n');
} else {
  console.log('  ❌ In-process event test FAILED\n');
  testResults.inProcess.failed++;
}

// Test 2: Distributed event (cross-service via Redis)
console.log('📋 Test 2: Distributed Event (Cross-Service via Redis)');
console.log('--------------------------------------------------------');

let distributedReceived = false;
let receivedPayload = null;

financeEventBus.subscribe(EventNames.CUSTOMER_CREATED, async (payload) => {
  console.log('  ✓ Finance Service received customer:created:', payload.data.customerName);
  distributedReceived = true;
  receivedPayload = payload;
  testResults.distributed.passed++;
});

// Wait a bit for subscription to be ready
await wait(1000);

// Publish from CRM service (should be received by Finance service)
console.log('  📤 Publishing from CRM service...');
await crmEventBus.publish(EventNames.CUSTOMER_CREATED, {
  customerId: 'test-customer-2',
  customerName: 'Distributed Test Customer',
  channel: 'RETAIL',
  city: 'Bandung',
  status: 'ACTIVE',
});

// Wait for distributed event
await wait(2000);

if (distributedReceived && receivedPayload && receivedPayload.source === 'crm-service-test') {
  console.log('  ✅ Distributed event test PASSED\n');
} else {
  console.log('  ❌ Distributed event test FAILED');
  console.log('     Received:', distributedReceived);
  console.log('     Source:', receivedPayload?.source);
  testResults.distributed.failed++;
}

// Test 3: Multiple subscribers
console.log('📋 Test 3: Multiple Subscribers');
console.log('----------------------------------');

let financeReceived = false;
let hrReceived = false;

financeEventBus.subscribe(EventNames.CUSTOMER_UPDATED, async (payload) => {
  console.log('  ✓ Finance Service received customer:updated');
  financeReceived = true;
});

hrEventBus.subscribe(EventNames.CUSTOMER_UPDATED, async (payload) => {
  console.log('  ✓ HR Service received customer:updated');
  hrReceived = true;
});

await wait(1000);

await crmEventBus.publish(EventNames.CUSTOMER_UPDATED, {
  customerId: 'test-customer-3',
  customerName: 'Updated Customer',
  changes: { status: 'INACTIVE' },
});

await wait(2000);

if (financeReceived && hrReceived) {
  console.log('  ✅ Multiple subscribers test PASSED\n');
} else {
  console.log('  ❌ Multiple subscribers test FAILED');
  console.log('     Finance received:', financeReceived);
  console.log('     HR received:', hrReceived);
}

// Test 4: Project status changed event
console.log('📋 Test 4: Project Status Changed Event');
console.log('-----------------------------------------');

let engineeringReceived = false;
let financeProjectReceived = false;

engineeringEventBus.subscribe(EventNames.PROJECT_STATUS_CHANGED, async (payload) => {
  console.log(`  ✓ Engineering Service received: ${payload.data.previousStatus} → ${payload.data.newStatus}`);
  engineeringReceived = true;
});

financeEventBus.subscribe(EventNames.PROJECT_STATUS_CHANGED, async (payload) => {
  console.log(`  ✓ Finance Service received: ${payload.data.previousStatus} → ${payload.data.newStatus}`);
  financeProjectReceived = true;
});

await wait(1000);

await crmEventBus.publish(EventNames.PROJECT_STATUS_CHANGED, {
  projectId: 'test-project-1',
  projectName: 'Test Project',
  customerId: 'test-customer-1',
  previousStatus: 'PROSPECT',
  newStatus: 'WON',
  estimatedValue: 1000000,
  contractValue: 1200000,
});

await wait(2000);

if (engineeringReceived && financeProjectReceived) {
  console.log('  ✅ Project status changed test PASSED\n');
} else {
  console.log('  ❌ Project status changed test FAILED');
  console.log('     Engineering received:', engineeringReceived);
  console.log('     Finance received:', financeProjectReceived);
}

// Test 5: Estimation approved event
console.log('📋 Test 5: Estimation Approved Event');
console.log('------------------------------------');

let crmEstimationReceived = false;

crmEventBus.subscribe(EventNames.ESTIMATION_APPROVED, async (payload) => {
  console.log(`  ✓ CRM Service received estimation approved: ${payload.data.estimationId}`);
  crmEstimationReceived = true;
});

await wait(1000);

await engineeringEventBus.publish(EventNames.ESTIMATION_APPROVED, {
  estimationId: 'test-estimation-1',
  projectId: 'test-project-1',
  projectName: 'Test Project',
  approvedBy: 'test-user-1',
  approvedAt: new Date(),
  totalAmount: 5000000,
});

await wait(2000);

if (crmEstimationReceived) {
  console.log('  ✅ Estimation approved test PASSED\n');
} else {
  console.log('  ❌ Estimation approved test FAILED');
}

// Test 6: Invoice created event
console.log('📋 Test 6: Invoice Created Event');
console.log('---------------------------------');

let crmInvoiceReceived = false;

crmEventBus.subscribe(EventNames.INVOICE_CREATED, async (payload) => {
  console.log(`  ✓ CRM Service received invoice created: ${payload.data.invoiceNumber}`);
  crmInvoiceReceived = true;
});

await wait(1000);

await financeEventBus.publish(EventNames.INVOICE_CREATED, {
  invoiceId: 'test-invoice-1',
  invoiceNumber: 'INV-2024-001',
  customerId: 'test-customer-1',
  customerName: 'Test Customer',
  totalAmount: 1500000,
  currency: 'IDR',
  status: 'DRAFT',
  invoiceDate: new Date(),
  dueDate: new Date(),
});

await wait(2000);

if (crmInvoiceReceived) {
  console.log('  ✅ Invoice created test PASSED\n');
} else {
  console.log('  ❌ Invoice created test FAILED');
}

// Summary
console.log('\n📊 Test Summary');
console.log('================');
console.log('In-process events:');
console.log(`  ✅ Passed: ${testResults.inProcess.passed}`);
console.log(`  ❌ Failed: ${testResults.inProcess.failed}`);
console.log('\nDistributed events:');
console.log(`  ✅ Passed: ${testResults.distributed.passed}`);
console.log(`  ❌ Failed: ${testResults.distributed.failed}`);

const totalPassed = testResults.inProcess.passed + testResults.distributed.passed;
const totalFailed = testResults.inProcess.failed + testResults.distributed.failed;

console.log('\n📈 Overall Results:');
console.log(`  ✅ Total Passed: ${totalPassed}`);
console.log(`  ❌ Total Failed: ${totalFailed}`);

if (totalFailed === 0) {
  console.log('\n🎉 All tests PASSED!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests FAILED');
  process.exit(1);
}

