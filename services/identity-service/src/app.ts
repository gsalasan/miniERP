import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';

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
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins();
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    // Allow all localhost origins in development to simplify local integration
    if (origin.startsWith('http://localhost')) return callback(null, true);
    if (allowed.includes('*') || allowed.includes(origin)) return callback(null, true);
    // Support wildcard suffix like http://localhost:30*
    const matched = allowed.some(a => a.endsWith('*') && origin.startsWith(a.slice(0, -1)));
    if (matched) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
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
app.use('/api/v1', employeeRoutes);

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
