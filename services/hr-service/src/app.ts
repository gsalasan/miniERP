import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import employeeRoutes from './routes/employee.routes';

// Load environment variables from hr-service directory specifically
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Prisma Client with error handling
let prismaClient: any = null;

const initializePrisma = () => {
  if (!prismaClient) {
    try {
      const { PrismaClient } = require('@prisma/client');
      prismaClient = new PrismaClient();
      console.log('HR Service: Prisma client initialized successfully');
    } catch (error) {
      console.error('HR Service: Failed to initialize Prisma client:', error);
      console.log('HR Service: Falling back to basic functionality');
    }
  }
  return prismaClient;
};

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'HR Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Test HR models endpoint
app.get('/api/v1/test-hr-models', async (req, res) => {
  try {
    const prisma = initializePrisma();
    
    if (prisma) {
      // Test HR models are accessible
      const employeeCount = await prisma.hr_employees.count();
      const attendanceCount = await prisma.hr_attendances.count();
      const leaveCount = await prisma.hr_leave_requests.count();
      
      res.json({
        success: true,
        message: 'HR models are working correctly',
        data: {
          hr_employees: employeeCount,
          hr_attendances: attendanceCount,
          hr_leave_requests: leaveCount
        },
        database_connected: true
      });
    } else {
      res.json({
        success: true,
        message: 'HR Service is running (using fallback mode)',
        data: {
          hr_employees: 0,
          hr_attendances: 0,
          hr_leave_requests: 0
        },
        database_connected: false
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing HR models',
      error: error instanceof Error ? error.message : 'Unknown error',
      database_connected: false
    });
  }
});

// API routes
app.use('/api/v1', employeeRoutes);
// app.use('/api/v1/attendance', attendanceRoutes);
// app.use('/api/v1/leaves', leaveRoutes);
// app.use('/api/v1/performance', performanceRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

export default app;
