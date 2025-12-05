import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import vendorRoutes from './routes/vendorRoutes';
import vendorPricelistRoutes from './routes/vendorPricelistRoutes';
import vendorLookupRoutes from './routes/vendorLookupRoutes';
import materialsProxyRoutes from './routes/materialsProxyRoutes';
import rfpRoutes from './routes/rfpRoutes';
import poRoutes from './routes/poRoutes';
import woRoutes from './routes/woRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/vendor-pricelist', vendorPricelistRoutes);
app.use('/api/v1', vendorLookupRoutes);
app.use('/api/v1/materials-proxy', materialsProxyRoutes);
app.use('/api/v1/rfp', rfpRoutes);
app.use('/api/v1/po', poRoutes);
app.use('/api/v1/wo', woRoutes);
app.get('/health', (_, res) => res.json({ ok: true }));

export default app;