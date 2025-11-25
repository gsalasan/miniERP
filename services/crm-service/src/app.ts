import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import customerRoutes from './routes/customerRoutes';
import customerContactRoutes from './routes/customerContactsRoutes';
import pipelineRoutes from './routes/pipelineRoutes';
import quotationRoutes from './routes/quotationRoutes';
import discountApprovalRoutes from './routes/discountApprovalRoutes';
import salesOrderRoutes from './routes/salesOrderRoutes';

dotenv.config();

const app = express();

// Configure CORS for all frontends
app.use(cors({
  origin: [
    'http://localhost:3000',  // main-frontend
    'http://localhost:3010',  // crm-frontend
    'http://localhost:3011',  // engineering-frontend
    'http://localhost:3012',  // finance-frontend
    'http://localhost:3013',  // hr-frontend
    'http://localhost:3015',  // procurement-frontend
    'http://localhost:3016',  // project-frontend
    'http://127.0.0.1:3010',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files dari folder uploads
// Working directory saat npm run dev adalah services/crm-service/
// Jadi uploads folder ada di ./uploads/po-documents
const uploadsPath = path.join(process.cwd(), 'uploads', 'po-documents');
const fs = require('fs');

console.log('📁 Static files directory:', uploadsPath);
console.log('📁 Directory exists?', fs.existsSync(uploadsPath));

// Create directory if not exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Serve static files
app.use('/uploads', (req, res, next) => {
  console.log('📥 Static file request:', req.path);
  next();
});

app.use('/uploads', express.static(uploadsPath));

// Prefix routes
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/customer-contacts', customerContactRoutes);
app.use('/api/v1/pipeline', pipelineRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/estimations', discountApprovalRoutes);
app.use('/api/v1/sales-orders', salesOrderRoutes);

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

// Error handler - log errors and return JSON for easier debugging during development
// This will catch errors thrown by middleware like multer and show stacktrace in server console
// Note: keep this last, after all routes
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Express error handler caught error:', err && (err.stack || err.message || err));
  if (res.headersSent) return next(err);
  res.status(err?.status || 500).json({ success: false, message: err?.message || 'Internal Server Error' });
});

export default app;
