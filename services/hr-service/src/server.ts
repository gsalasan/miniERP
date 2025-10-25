import app from './app';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from hr-service directory specifically with override
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

console.log('HR Service DEBUG - Environment variables:');
console.log('process.env.PORT:', process.env.PORT);
console.log('dotenv path:', path.join(__dirname, '..', '.env'));

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`HR Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
