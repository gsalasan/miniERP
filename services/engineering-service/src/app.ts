import express from 'express';
import cors from 'cors';
import materialsRoutes from './routes/materialsRoutes';
import serviceRoutes from './routes/serviceRoutes';
import searchRoutes from './routes/searchRoutes';
import projectRoutes from './routes/projectRoutes';
import estimationRoutes from './routes/estimationRoutes';
import taxonomyRoutes from './routes/taxonomyRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

const app = express();

// Health check endpoint for Cloud Run
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({ 
    success: true, 
    service: 'engineering-service',
    timestamp: new Date().toISOString()
  });
});

// CORS configuration - allow requests from frontend
app.use(
  cors({
    origin: [
      'http://localhost:3000', // main-frontend
      'http://localhost:3011', // engineering-frontend
      'http://localhost:3001', // identity-service (if needed)
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  })
);

app.use(express.json());

// Mount engineering-related routes - more specific routes first
app.use('/', searchRoutes);
app.use('/', materialsRoutes);
app.use('/', serviceRoutes);
app.use('/', taxonomyRoutes);
app.use('/', projectRoutes);
app.use('/', estimationRoutes);
app.use('/', dashboardRoutes);

// 404 handler
app.use('*', (_req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: _req.originalUrl,
    service: 'engineering-service'
  });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;