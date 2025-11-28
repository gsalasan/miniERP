import axios from 'axios';

async function testProjectService() {
  try {
    console.log('=== Testing Project Service ===\n');
    
    // 1. Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:4000/api/v1/auth/login', {
      email: 'raisa@unais.com',
      password: 'password123',
    });
    
    const token = loginResponse.data.data.token;
    console.log('✓ Login successful');
    console.log(`  Token: ${token.substring(0, 20)}...`);
    
    // 2. Test /api/v1/projects endpoint
    console.log('\n2. Testing GET /api/v1/projects...');
    try {
      const projectsResponse = await axios.get('http://localhost:4007/api/v1/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✓ Projects retrieved successfully');
      console.log(`  Status: ${projectsResponse.status}`);
      console.log(`  Success: ${projectsResponse.data.success}`);
      console.log(`  Project count: ${projectsResponse.data.data?.length || 0}`);
      
      if (projectsResponse.data.data && projectsResponse.data.data.length > 0) {
        console.log('\n  First project:');
        const project = projectsResponse.data.data[0];
        console.log(`    ID: ${project.id}`);
        console.log(`    Name: ${project.project_name}`);
        console.log(`    Status: ${project.status}`);
      }
    } catch (error) {
      console.error('✗ Error calling /api/v1/projects:');
      console.error(`  Status: ${error.response?.status}`);
      console.error(`  Message: ${error.response?.data?.message}`);
      console.error(`  Full error:`, error.response?.data);
      
      // Log more details
      if (error.response?.status === 500) {
        console.error('\n  This is a 500 Internal Server Error.');
        console.error('  Check project service logs for more details.');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testProjectService();
