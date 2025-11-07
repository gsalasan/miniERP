import app from './app';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load .env from hr-service directory specifically with override
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

console.log('HR Service DEBUG - Environment variables:');
console.log('process.env.PORT:', process.env.PORT);
console.log('dotenv path:', path.join(__dirname, '..', '.env'));

const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';

const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$connect();
    console.log('Connected to database successfully.');
  } catch (err) {
    console.error('Error connecting to database:', err instanceof Error ? err.message : err);
  } finally {
    app.listen(PORT, () => {
      console.log(`HR Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  }
})();
