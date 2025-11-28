/**
 * Simple Event Bus Test (In-process only, no Redis required)
 * Tests the basic event bus functionality without distributed events
 */

import { createEventBus } from './services/shared-event-bus/dist/index.js';
import { EventNames } from './services/shared-event-bus/dist/events.js';

console.log('🧪 Event Bus Test Script (In-Process Only)');
console.log('==========================================\n');

// Create event bus instances (without Redis for simple test)
process.env.REDIS_URL = ''; // Disable Redis for this test

const crmEventBus = createEventBus('crm-service-test');
const financeEventBus = createEventBus('finance-service-test');

// Test results
const tests = [];

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: In-process event (same service)
console.log('📋 Test 1: In-process Event (Same Service)');
console.log('------------------------------------------');

let test1Passed = false;
crmEventBus.subscribe(EventNames.CUSTOMER_CREATED, async (payload) => {
  console.log('  ✓ Received customer:created event:', payload.data.customerName);
  if (payload.data.customerId === 'test-customer-1') {
    test1Passed = true;
  }
});

await crmEventBus.publish(EventNames.CUSTOMER_CREATED, {
  customerId: 'test-customer-1',
  customerName: 'Test Customer',
  channel: 'ONLINE',
  city: 'Jakarta',
  status: 'ACTIVE',
});

await wait(500);

if (test1Passed) {
  console.log('  ✅ Test 1 PASSED\n');
  tests.push({ name: 'In-process Event', passed: true });
} else {
  console.log('  ❌ Test 1 FAILED\n');
  tests.push({ name: 'In-process Event', passed: false });
}

// Test 2: Multiple subscribers (same service)
console.log('📋 Test 2: Multiple Subscribers (Same Service)');
console.log('----------------------------------------------');

let subscriber1Received = false;
let subscriber2Received = false;

crmEventBus.subscribe(EventNames.CUSTOMER_UPDATED, async (payload) => {
  console.log('  ✓ Subscriber 1 received customer:updated');
  subscriber1Received = true;
});

crmEventBus.subscribe(EventNames.CUSTOMER_UPDATED, async (payload) => {
  console.log('  ✓ Subscriber 2 received customer:updated');
  subscriber2Received = true;
});

await crmEventBus.publish(EventNames.CUSTOMER_UPDATED, {
  customerId: 'test-customer-2',
  customerName: 'Updated Customer',
  changes: { status: 'INACTIVE' },
});

await wait(500);

if (subscriber1Received && subscriber2Received) {
  console.log('  ✅ Test 2 PASSED\n');
  tests.push({ name: 'Multiple Subscribers', passed: true });
} else {
  console.log('  ❌ Test 2 FAILED\n');
  tests.push({ name: 'Multiple Subscribers', passed: false });
}

// Test 3: Different event types
console.log('📋 Test 3: Different Event Types');
console.log('--------------------------------');

let projectEventReceived = false;
let invoiceEventReceived = false;

crmEventBus.subscribe(EventNames.PROJECT_STATUS_CHANGED, async (payload) => {
  console.log(`  ✓ Received project:status:changed: ${payload.data.previousStatus} → ${payload.data.newStatus}`);
  projectEventReceived = true;
});

financeEventBus.subscribe(EventNames.INVOICE_CREATED, async (payload) => {
  console.log(`  ✓ Received invoice:created: ${payload.data.invoiceNumber}`);
  invoiceEventReceived = true;
});

await crmEventBus.publish(EventNames.PROJECT_STATUS_CHANGED, {
  projectId: 'test-project-1',
  projectName: 'Test Project',
  customerId: 'test-customer-1',
  previousStatus: 'PROSPECT',
  newStatus: 'WON',
  estimatedValue: 1000000,
  contractValue: 1200000,
});

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

await wait(500);

if (projectEventReceived && invoiceEventReceived) {
  console.log('  ✅ Test 3 PASSED\n');
  tests.push({ name: 'Different Event Types', passed: true });
} else {
  console.log('  ❌ Test 3 FAILED');
  console.log(`     Project event: ${projectEventReceived}, Invoice event: ${invoiceEventReceived}\n`);
  tests.push({ name: 'Different Event Types', passed: false });
}

// Test 4: Event payload structure
console.log('📋 Test 4: Event Payload Structure');
console.log('----------------------------------');

let payloadValid = false;

const engineeringEventBus = createEventBus('engineering-service-test');
engineeringEventBus.subscribe(EventNames.ESTIMATION_APPROVED, async (payload) => {
  console.log('  ✓ Received estimation:approved event');
  // Check payload structure
  if (
    payload.eventId &&
    payload.timestamp &&
    payload.source === 'engineering-service-test' &&
    payload.data.estimationId &&
    payload.data.projectId &&
    payload.data.totalAmount
  ) {
    payloadValid = true;
    console.log('  ✓ Payload structure is valid');
    console.log(`     Event ID: ${payload.eventId}`);
    console.log(`     Source: ${payload.source}`);
    console.log(`     Timestamp: ${payload.timestamp}`);
  }
});

await engineeringEventBus.publish(EventNames.ESTIMATION_APPROVED, {
  estimationId: 'test-estimation-1',
  projectId: 'test-project-1',
  projectName: 'Test Project',
  approvedBy: 'test-user-1',
  approvedAt: new Date(),
  totalAmount: 5000000,
});

await wait(500);

if (payloadValid) {
  console.log('  ✅ Test 4 PASSED\n');
  tests.push({ name: 'Event Payload Structure', passed: true });
} else {
  console.log('  ❌ Test 4 FAILED\n');
  tests.push({ name: 'Event Payload Structure', passed: false });
}

// Summary
console.log('\n📊 Test Summary');
console.log('================');
tests.forEach((test, index) => {
  const status = test.passed ? '✅' : '❌';
  console.log(`${status} Test ${index + 1}: ${test.name}`);
});

const passed = tests.filter(t => t.passed).length;
const failed = tests.filter(t => !t.passed).length;

console.log('\n📈 Overall Results:');
console.log(`  ✅ Passed: ${passed}/${tests.length}`);
console.log(`  ❌ Failed: ${failed}/${tests.length}`);

if (failed === 0) {
  console.log('\n🎉 All tests PASSED!');
  console.log('\n💡 Note: This test only covers in-process events.');
  console.log('   For distributed events (Redis), ensure Redis is running and use test-event-bus.mjs');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests FAILED');
  process.exit(1);
}

