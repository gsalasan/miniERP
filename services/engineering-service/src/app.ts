import express = require('express');
<<<<<<< HEAD
import materialsRoutes from './routes/materialsRoutes';

const app = express();
app.use(express.json());

// mount engineering-related routes (materials)
app.use('/', materialsRoutes);

=======
import cors from 'cors';
import materialsRoutes from './routes/materialsRoutes';
import serviceRoutes from './routes/serviceRoutes';
import searchRoutes from './routes/searchRoutes';

const app = express();

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

// mount engineering-related routes (search) - more specific routes first
app.use('/', searchRoutes);

// mount engineering-related routes (materials)
app.use('/', materialsRoutes);

// mount engineering-related routes (services)
app.use('/', serviceRoutes);

>>>>>>> main
export default app;
