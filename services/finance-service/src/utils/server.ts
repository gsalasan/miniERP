// src/utils/server.ts
import dotenv from "dotenv";
import path from "path";
import app from "./app";

// Load variabel environment dari .env (root project)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
console.log("🔧 DATABASE_URL:", process.env.DATABASE_URL ? "✅ Loaded" : "❌ NOT FOUND");

const PORT = process.env.PORT || 5002;

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
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
