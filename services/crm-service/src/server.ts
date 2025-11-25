import dotenv from 'dotenv';
import app from './app';

// Load environment variables
dotenv.config();

// Use CRM_SERVICE_PORT environment variable
const PORT = Number(process.env.CRM_SERVICE_PORT) || 4002;

console.log('Starting CRM Service on port:', PORT);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`CRM Service running on port ${PORT}`);
});
