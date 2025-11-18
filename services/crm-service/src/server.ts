import dotenv from 'dotenv';
import app from './app';

// Load environment variables
dotenv.config();

// Use PORT environment variable for Cloud Run compatibility
const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`CRM Service running on port ${PORT}`);
});
