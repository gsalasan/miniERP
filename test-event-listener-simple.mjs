import axios from 'axios';

async function testProjectWonEventSimple() {
  try {
    console.log('=== Testing Project.Won Event Listener (Simplified) ===\n');

    // Test data dengan customer ID yang hardcoded (asumsi ada di DB)
    const eventData = {
      projectName: `Auto-Created Project ${Date.now()}`,
      customerId: 'c1234567-1234-1234-1234-123456789012', // Replace dengan customer ID real
      salesUserId: 'e7ac4f28-c807-48f1-8f2c-857a77bb2e57', // Raisa's user ID
      salesOrderId: `SO-${Date.now()}`,
      soNumber: `SO-2025-${String(Date.now()).slice(-6)}`,
      totalValue: 7500000,
      description: 'Project created automatically via project.won event',
    };

    console.log('📤 Sending project.won event to Project Service...');
    console.log('Event data:');
    console.log(JSON.stringify(eventData, null, 2));
    console.log('');

    try {
      const eventResponse = await axios.post(
        'http://localhost:4007/events/project-won',
        eventData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      console.log('✅ Event processed successfully!');
      console.log('Response:', eventResponse.data);
      
      console.log('\n' + '═'.repeat(70));
      console.log('✅ EVENT LISTENER WORKING CORRECTLY!');
      console.log('   - Event received by Project Service');
      console.log('   - Project Workspace should be created with status "Planning"');
      console.log('   - Check project service logs for details');
      console.log('═'.repeat(70));

    } catch (eventError) {
      if (eventError.response) {
        console.error('❌ Event processing failed:');
        console.error('   Status:', eventError.response.status);
        console.error('   Error:', eventError.response.data);
        
        // If it's a database error (like customer not found), that's expected
        if (eventError.response.data.message?.includes('customer') || 
            eventError.response.data.message?.includes('Foreign key')) {
          console.log('\n💡 Note: This error is expected if customer ID does not exist.');
          console.log('   The event listener is working, but needs valid customer ID.');
          console.log('   Please update customerId in the test script with a real customer ID.');
        }
      } else if (eventError.code === 'ECONNREFUSED') {
        console.error('❌ Cannot connect to Project Service (port 4007)');
        console.error('   Make sure Project Service is running:');
        console.error('   npm run dev:project');
      } else {
        throw eventError;
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Also test with curl command suggestion
console.log('Alternative: Test with curl command:\n');
console.log('curl -X POST http://localhost:4007/events/project-won \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{\n' +
  '    "projectName": "Test Project",\n' +
  '    "customerId": "your-customer-id-here",\n' +
  '    "salesUserId": "e7ac4f28-c807-48f1-8f2c-857a77bb2e57",\n' +
  '    "salesOrderId": "SO-123",\n' +
  '    "soNumber": "SO-2025-001",\n' +
  '    "totalValue": 5000000\n' +
  '  }\'\n');

testProjectWonEventSimple();
