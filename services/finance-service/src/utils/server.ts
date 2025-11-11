// src/utils/server.ts
import dotenv from "dotenv";
import path from "path";

// ✅ CRITICAL: Load .env BEFORE importing app (which imports prisma)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
console.log("🔧 DATABASE_URL:", process.env.DATABASE_URL ? "✅ Loaded" : "❌ NOT FOUND");
console.log("🔧 DB Host:", process.env.DATABASE_URL?.includes('192.168.1.72') ? "✅ Correct (192.168.1.72)" : "❌ Wrong host");

// NOW import app after .env is loaded
import app from "./app";

const PORT = process.env.PORT || 5002;

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
