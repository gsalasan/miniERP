
import dotenv from 'dotenv';
import path from 'path';
// Load environment variables from hr-service directory specifically
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import express from 'express';
import cors from 'cors';
import employeeRoutes from './routes/employee.routes';
import attendanceRoutes from './routes/attendance.routes';
import { getPrisma } from './utils/prisma';
import { startAutoCheckoutJob } from './jobs/auto-checkout.job';

// Initialize express app only; defer Prisma until used

const app = express();

// Start auto check-out cron job
startAutoCheckoutJob();

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
    version: '1.0.0',
  });
});

// Test HR models endpoint
app.get('/api/v1/test-hr-models', async (req, res) => {
  try {
    const prisma = getPrisma();
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
        hr_leave_requests: leaveCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing HR models',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API routes
app.use('/api/v1', employeeRoutes);
app.use('/api/v1/attendances', attendanceRoutes);
// API routes will be added here
// app.use('/api/v1/employees', employeeRoutes);

// app.use('/api/v1/leaves', leaveRoutes);
// app.use('/api/v1/performance', performanceRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handler
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

export default app;
