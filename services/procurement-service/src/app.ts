import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import vendorRoutes from './routes/vendorRoutes';
import vendorPricelistRoutes from './routes/vendorPricelistRoutes';
import materialsProxyRoutes from './routes/materialsProxyRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/vendor-pricelist', vendorPricelistRoutes);
app.use('/api/v1/materials-proxy', materialsProxyRoutes);
app.get('/health', (_, res) => res.json({ ok: true }));

export default app;
