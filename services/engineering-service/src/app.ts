import express = require('express');
import cors from 'cors';
import materialsRoutes from './routes/materialsRoutes';
import serviceRoutes from './routes/serviceRoutes';
import searchRoutes from './routes/searchRoutes';
import projectRoutes from './routes/projectRoutes';
import estimationRoutes from './routes/estimationRoutes';

const app = express();
// Health check endpoint for Cloud Run
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({ success: true, service: 'engineering-service' });
});


// CORS configuration - allow requests from frontend
app.use(
  cors({
    origin: [
      'http://localhost:3000', // main-frontend
      'http://localhost:3010', // crm-frontend
      'http://localhost:3011', // engineering-frontend
      'http://localhost:3001', // identity-service (if needed)
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  })
);

app.use(express.json());

// mount engineering-related routes (search) - more specific routes first
app.use('/', searchRoutes);

// mount engineering-related routes (materials)
app.use('/', materialsRoutes);

// mount engineering-related routes (services)
app.use('/', serviceRoutes);

// mount engineering-related routes (projects)
app.use('/', projectRoutes);

// mount engineering-related routes (estimations)
app.use('/', estimationRoutes);

export default app;
