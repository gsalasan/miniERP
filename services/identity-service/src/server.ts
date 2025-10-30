import app from './app';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8080;
const prisma = new PrismaClient();

// Database connection check
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  console.log('\n🔄 Shutting down gracefully...');
  
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
  
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start server
async function startServer() {
  try {
    // Check required environment variables
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is required in environment variables');
      process.exit(1);
    }

    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is required in environment variables');
      process.exit(1);
    }

    // Connect to database
    await connectDatabase();

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(' Identity Service started successfully');
      console.log(` Server running on port ${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/health`);
      console.log(` Auth API: http://localhost:${PORT}/api/v1/auth`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();