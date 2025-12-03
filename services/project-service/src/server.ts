import dotenv from 'dotenv';
import app from './app';

// Load environment variables
dotenv.config();

const PORT = Number(process.env.PROJECT_SERVICE_PORT) || 4007;

console.log('Starting Project Service on port:', PORT);

app.listen(PORT, () => {
  console.log(`Project Service running on port ${PORT}`);
});

