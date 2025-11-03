import app from './app';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from hr-service directory specifically with override
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

console.log('HR Service DEBUG - Environment variables:');
console.log('process.env.PORT:', process.env.PORT);
console.log('dotenv path:', path.join(__dirname, '..', '.env'));

const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`HR Service running on http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
});
