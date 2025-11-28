import axios from 'axios';

const identity = axios.create({
  baseURL: 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' }
});

async function test() {
  try {
    // Login
    console.log('Attempting login...');
    const loginRes = await identity.post('/api/v1/auth/login', {
      email: 'raisa@unais.com',
      password: 'unais2025'
    });
    
    const token = loginRes.data.data?.token || loginRes.data.token;
    console.log('✓ Token received:', token.substring(0, 20) + '...');
    
    // Verify token works
    console.log('\nVerifying token...');
    const verifyRes = await identity.get('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✓ User data:', verifyRes.data?.data || verifyRes.data);
    console.log('\n✓ Login successful! Use this URL:');
    console.log(`http://localhost:3017/?token=${token}`);
    
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
}

test();
