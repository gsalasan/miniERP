import dotenv from 'dotenv';
import app from './app';

// Load environment variables
dotenv.config();

const PORT = 3003;

app.listen(PORT, () => {
  console.log(`Procurement service running on port ${PORT}`);
});