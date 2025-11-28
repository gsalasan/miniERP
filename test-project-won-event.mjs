import axios from 'axios';

async function testProjectWonEvent() {
  try {
    console.log('=== Testing Project.Won Event Listener ===\n');

    // 1. Get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:4000/api/v1/auth/login', {
      email: 'raisa@unais.com',
      password: 'unais2025',
    });
    const token = loginResponse.data.token;
    console.log('✓ Login successful\n');

    // 2. Get a customer ID (we need this for the test)
    console.log('2. Fetching customers...');
    const customersResponse = await axios.get('http://localhost:4002/api/v1/customers', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const customers = customersResponse.data.data;
    
    if (!customers || customers.length === 0) {
      console.log('⚠️  No customers found. Please create a customer first.');
      return;
    }
    
    const customerId = customers[0].id;
    console.log(`✓ Using customer: ${customers[0].company_name} (${customerId})\n`);

    // 3. Send project.won event
    console.log('3. Sending project.won event...');
    const eventData = {
      projectName: `Test Project Auto-Created ${Date.now()}`,
      customerId: customerId,
      salesUserId: loginResponse.data.data.id,
      salesOrderId: `SO-TEST-${Date.now()}`,
      soNumber: `SO-2025-TEST-${Date.now()}`,
      totalValue: 5000000,
      description: 'Test project created via event listener',
      estimationId: 'est-test-123'
    };

    console.log('Event data:', JSON.stringify(eventData, null, 2));
    
    const eventResponse = await axios.post(
      'http://localhost:4007/events/project-won',
      eventData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Event processed successfully!');
    console.log('Response:', eventResponse.data);

    // 4. Verify project was created
    console.log('\n4. Verifying project was created...');
    const projectsResponse = await axios.get('http://localhost:4007/api/v1/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const projects = projectsResponse.data.data;
    const createdProject = projects.find((p) => p.project_name === eventData.projectName);

    if (createdProject) {
      console.log('\n✅ PROJECT WORKSPACE CREATED SUCCESSFULLY!');
      console.log('═'.repeat(60));
      console.log(`📋 Project Details:`);
      console.log(`   ID: ${createdProject.id}`);
      console.log(`   Number: ${createdProject.project_number}`);
      console.log(`   Name: ${createdProject.project_name}`);
      console.log(`   Status: ${createdProject.status} ✅`);
      console.log(`   Customer: ${createdProject.customer?.company_name || 'N/A'}`);
      console.log(`   Sales User: ${createdProject.sales_user?.email || 'N/A'}`);
      console.log(`   Total Value: Rp ${createdProject.total_value?.toLocaleString('id-ID') || 0}`);
      console.log(`   Created: ${new Date(createdProject.created_at).toLocaleString('id-ID')}`);
      console.log('═'.repeat(60));
      
      if (createdProject.status === 'Planning') {
        console.log('\n✅ Status is correctly set to "Planning"');
      } else {
        console.log(`\n⚠️  Expected status "Planning" but got "${createdProject.status}"`);
      }
    } else {
      console.log('\n❌ Project not found in database!');
      console.log('Available projects:', projects.map(p => p.project_name));
    }

    console.log('\n=== Test Completed ===');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Make sure the following services are running:');
      console.error('   - Identity Service (port 4000)');
      console.error('   - CRM Service (port 4002)');
      console.error('   - Project Service (port 4007)');
    }
  }
}

testProjectWonEvent();
