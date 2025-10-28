import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`HR Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
