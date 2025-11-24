import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes/projectRoutes';
import { projectEventListener } from './events/projectEventListener';

dotenv.config();

const app = express();

// Configure CORS for all frontends
app.use(
  cors({
    origin: [
      'http://localhost:3000', // main-frontend
      'http://localhost:3010', // crm-frontend
      'http://localhost:3011', // engineering-frontend
      'http://localhost:3012', // finance-frontend
      'http://localhost:3013', // hr-frontend
      'http://localhost:3015', // procurement-frontend
      'http://localhost:3016', // project-frontend
      'http://127.0.0.1:3016',
    ],
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
