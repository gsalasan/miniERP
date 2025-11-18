import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import customerRoutes from './routes/customerRoutes';
import customerContactRoutes from './routes/customerContactsRoutes';
import pipelineRoutes from './routes/pipelineRoutes';
import quotationRoutes from './routes/quotationRoutes';

dotenv.config();

const app = express();

// Configure CORS for development
app.use(cors({
  origin: ['http://localhost:3010', 'http://127.0.0.1:3010', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Prefix routes
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/customer-contacts', customerContactRoutes);
app.use('/api/v1/pipeline', pipelineRoutes);
app.use('/api/v1/quotations', quotationRoutes);

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

export default app;