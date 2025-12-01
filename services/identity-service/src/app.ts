import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
// Allow multiple origins via environment variable `ALLOWED_ORIGINS` (comma-separated).
const getAllowedOrigins = () => {
  const raw = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN;
  if (!raw) return [
    'http://localhost:3000',
    'http://localhost:3010',
    'http://localhost:3011',
    'http://localhost:3012',
    'http://localhost:3013',
    'http://localhost:3015',
    'http://localhost:3016'
  ];
  return raw.split(',').map(s => s.trim());
};

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5174', 'http://localhost:3013'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Identity Service is running',
    timestamp: new Date().toISOString(),
    service: 'identity-service'
  });
});

// API Routes with versioning
app.use('/api/v1/auth', authRoutes);
// Employee-related endpoints were removed from identity-service.
// Employee CRUD now belongs to HR service (`/services/hr-service`).

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
