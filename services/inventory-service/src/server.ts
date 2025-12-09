import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import inventoryRoutes from './routes/inventoryRoutes';
import fs from 'fs';

// Load service-local .env first to avoid inheriting a different PORT from parent cwd
// __dirname -> services/inventory-service/src, so one level up is the service folder
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
// Fallback to default dotenv behavior for any other env file if needed
dotenv.config();

// Parse service-local .env to prefer its PORT regardless of inherited environment
// __dirname -> services/inventory-service/src, so one level up is the service folder
const serviceEnvPath = path.resolve(__dirname, '..', '.env');
let servicePort: number | undefined;
try {
  const envText = fs.readFileSync(serviceEnvPath, 'utf8');
  const m = envText.match(/^\s*PORT\s*=\s*"?(\d+)"?\s*$/m);
  if (m) servicePort = Number(m[1]);
} catch (err) {
  // ignore if no .env present
}

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/inventory', inventoryRoutes);
// health route
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({ success: true, service: 'inventory-service' });
});

const port = servicePort || Number(process.env.PORT) || 4005;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Inventory Service running on port ${port} (source: ${servicePort ? 'service .env' : process.env.PORT ? 'process.env' : 'default'})`
  );
});


