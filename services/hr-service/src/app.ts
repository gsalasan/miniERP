import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
<<<<<<< HEAD
  res.json({ 
    ok: true, 
    service: 'HR Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
=======
  res.json({
    ok: true,
    service: 'HR Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
>>>>>>> main
  });
});

// Test HR models endpoint
app.get('/api/v1/test-hr-models', async (req, res) => {
  try {
    // Test HR models are accessible
    const employeeCount = await prisma.hr_employees.count();
    const attendanceCount = await prisma.hr_attendances.count();
    const leaveCount = await prisma.hr_leave_requests.count();
<<<<<<< HEAD
    
=======

>>>>>>> main
    res.json({
      success: true,
      message: 'HR models are working correctly',
      data: {
        hr_employees: employeeCount,
        hr_attendances: attendanceCount,
<<<<<<< HEAD
        hr_leave_requests: leaveCount
      }
=======
        hr_leave_requests: leaveCount,
      },
>>>>>>> main
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing HR models',
<<<<<<< HEAD
      error: error instanceof Error ? error.message : 'Unknown error'
=======
      error: error instanceof Error ? error.message : 'Unknown error',
>>>>>>> main
    });
  }
});

// API routes will be added here
// app.use('/api/v1/employees', employeeRoutes);
// app.use('/api/v1/attendance', attendanceRoutes);
// app.use('/api/v1/leaves', leaveRoutes);
// app.use('/api/v1/performance', performanceRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
<<<<<<< HEAD
    path: req.originalUrl
=======
    path: req.originalUrl,
>>>>>>> main
  });
});

// Error handler
<<<<<<< HEAD
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});
=======
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Something went wrong',
    });
  }
);
>>>>>>> main

export default app;
