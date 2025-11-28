import jwt from 'jsonwebtoken';

// Secret key yang digunakan di backend
const SECRET_KEY = 'test-secret-key'; // Sesuaikan dengan backend

// Payload untuk Sales user
const payload = {
  id: 'user1',
  name: 'Diki Priyanto',
  email: 'diki@company.com',
  roles: ['SALES'],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
};

// Generate valid token
const validToken = jwt.sign(payload, SECRET_KEY);

console.log('Valid JWT Token:');
console.log(validToken);
console.log('\nPayload:');
console.log(jwt.decode(validToken));