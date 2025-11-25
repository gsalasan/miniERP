import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes/projectRoutes';
import milestoneRoutes from './routes/milestoneRoutes';
import taskRoutes from './routes/taskRoutes';
import { projectEventListener } from './events/projectEventListener';
import templateRoutes from './routes/templateRoutes';

dotenv.config();

const app = express();

// Get allowed origins from environment or use defaults
const getAllowedOrigins = () => {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }
  
  // Default origins for development
  return [
    'http://localhost:3000',
    'http://localhost:3010',
    'http://localhost:3011',
    'http://localhost:3012',
    'http://localhost:3013',
    'http://localhost:3015',
    'http://localhost:3016',
    'http://127.0.0.1:3016',
  ];
};

// Configure CORS for all frontends
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins();
      
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      // Check if origin matches any allowed origin (exact match or pattern)
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed === '*') return true;
        if (allowed.endsWith('*')) {
          const pattern = allowed.slice(0, -1);
          return origin.startsWith(pattern);
        }
        return origin === allowed;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Health check
app.get('/health', (_, res) => res.json({ ok: true, service: 'project-service' }));

// Routes
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/projects', milestoneRoutes);
app.use('/api/v1/projects', taskRoutes);
app.use('/api/v1/templates', templateRoutes);

// Event listener route (for receiving events from other services)
app.post('/events/project-won', express.json(), async (req, res) => {
  try {
    await projectEventListener.handleProjectWon(req.body);
    res.status(200).json({ success: true, message: 'Event processed' });
  } catch (error: any) {
    console.error('Error processing event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Initialize event listener
projectEventListener.initialize();

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Express error handler caught error:', err?.stack || err?.message || err);
  if (res.headersSent) return next(err);
  res.status(err?.status || 500).json({
    success: false,
    message: err?.message || 'Internal Server Error',
  });
});

export default app;
