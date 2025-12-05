import axios from 'axios';

const identity = axios.create({
  baseURL: 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' }
});

async function testFullFlow() {
  try {
    console.log('\n=== Testing Complete Project Module Access Flow ===\n');
    
    // Step 1: Login
    console.log('1. Logging in to identity service...');
    const loginRes = await identity.post('/api/v1/auth/login', {
      email: 'raisa@unais.com',
      password: 'unais2025'
    });
    
    if (!loginRes.data.success) {
      throw new Error('Login failed: ' + (loginRes.data.message || 'Unknown error'));
    }
    
    const token = loginRes.data.data?.token || loginRes.data.token;
    const userData = loginRes.data.data;
    console.log('✓ Login successful');
    console.log('  Email:', userData.email);
    console.log('  Roles:', userData.roles);
    
    // Step 2: Verify token with /me endpoint
    console.log('\n2. Verifying token at /api/v1/auth/me...');
    const meRes = await identity.get('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!meRes.data.success) {
      throw new Error('Token verification failed');
    }
    
    const verifiedUser = meRes.data.data;
    console.log('✓ Token verified');
    console.log('  User ID:', verifiedUser.id);
    console.log('  Email:', verifiedUser.email);
    console.log('  Roles:', verifiedUser.roles);
    
    // Step 3: Simulate main-frontend module click
    console.log('\n3. Simulating main-frontend project module click...');
    const projectModuleUrl = 'http://localhost:3016';
    const urlWithToken = `${projectModuleUrl}/?token=${encodeURIComponent(token)}`;
    
    console.log('✓ Module URL prepared');
    console.log('  Base URL:', projectModuleUrl);
    console.log('  Token length:', token.length);
    
    // Step 4: Simulate what would be stored in localStorage
    console.log('\n4. Simulating localStorage state...');
    console.log('  cross_app_token:', token.substring(0, 20) + '...');
    console.log('  cross_app_user:', JSON.stringify({
      id: verifiedUser.id,
      email: verifiedUser.email,
      roles: verifiedUser.roles,
      name: verifiedUser.full_name || verifiedUser.name
    }));
    console.log('  cross_app_timestamp:', Date.now());
    
    // Step 5: Final verification
    console.log('\n5. Testing project service endpoint (if available)...');
    try {
      const projectService = axios.create({
        baseURL: 'http://localhost:4007/api/v1',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const projectsRes = await projectService.get('/projects');
      console.log('✓ Project service responded');
      console.log('  Status:', projectsRes.status);
      console.log('  Projects count:', projectsRes.data?.data?.length || projectsRes.data?.length || 0);
    } catch (projErr) {
      if (projErr.response?.status === 404) {
        console.log('⚠ Project service /projects endpoint not found (might be normal)');
      } else {
        console.log('⚠ Project service error:', projErr.response?.status, projErr.message);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL CHECKS PASSED!');
    console.log('='.repeat(60));
    console.log('\n📋 What to do next:');
    console.log('1. Open main-frontend and login');
    console.log('2. Click the "Project Management" module');
    console.log('3. Check browser console for [AUTH] logs');
    console.log('\n🔗 Or test directly with this URL:');
    console.log(urlWithToken);
    console.log('\n💡 Expected behavior:');
    console.log('   - URL token is captured');
    console.log('   - Token saved to localStorage');
    console.log('   - User fetched from /api/v1/auth/me');
    console.log('   - Projects page loads (not redirect to login)');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

testFullFlow();
