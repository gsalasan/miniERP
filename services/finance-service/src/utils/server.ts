// src/utils/server.ts
import dotenv from "dotenv";
import path from "path";

// Load variabel environment dari .env dengan override untuk menghindari konflik
dotenv.config({ path: require('path').join(__dirname, '../../.env'), override: false });

// Force PORT dari .env local jika ada, atau gunakan default
const envPort = process.env.PORT;
const PORT = envPort && !isNaN(parseInt(envPort)) ? parseInt(envPort) : 8080;

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Stack:', reason);
  // Don't exit - keep server running
});

// Catch uncaught exceptions  
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit immediately - keep server running
});

// Jalankan server
const server = app.listen(PORT, () => {
  console.log(`Finance Service running on http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (error: any) => {
  console.error('❌ Server Error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});
