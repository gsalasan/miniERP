import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import customerRoutes from './routes/customerRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Prefix route
app.use('/api/v1/customers', customerRoutes);

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

export default app;
