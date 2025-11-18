import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration: support multiple allowed origins (comma-separated)
const defaultOrigins = [
  'http://localhost:3000', // main-frontend
  'http://localhost:3010', // crm-frontend
  'http://localhost:3011', // engineering
  'http://localhost:3012', // finance
  'http://localhost:3013', // hr
];
// Merge defaults with env list (instead of overriding), to avoid missing ports during dev
const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)
  : [];
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

// Optional dev flag: allow all localhost origins (use only in development)
const allowAllLocalhost = process.env.ALLOW_ALL_ORIGINS === 'true';

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests (like Postman) where origin may be undefined
    if (!origin) return callback(null, true);

    if (allowAllLocalhost && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
        return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// For visibility during dev
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.log('[CORS] Allowed origins:', allowedOrigins.join(', '));
  if (allowAllLocalhost) {
    // eslint-disable-next-line no-console
    console.log('[CORS] All localhost origins are allowed via ALLOW_ALL_ORIGINS=true');
  }
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Identity Service is running',
    timestamp: new Date().toISOString(),
    service: 'identity-service',
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
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
