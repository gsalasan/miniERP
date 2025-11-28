import app from './app';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { eventBus } from './utils/eventBus';
import { EventNames, CustomerCreatedPayload, CustomerUpdatedPayload } from '../../shared-event-bus/src/events';

// Load .env from hr-service directory specifically with override
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

console.log('HR Service DEBUG - Environment variables:');
console.log('process.env.PORT:', process.env.PORT);
console.log('dotenv path:', path.join(__dirname, '..', '.env'));

const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';

const prisma = new PrismaClient();

// Subscribe to customer events
eventBus.subscribe<CustomerCreatedPayload>(EventNames.CUSTOMER_CREATED, async (payload) => {
  console.log(`[HR Service] Received customer created: ${payload.data.customerId} - ${payload.data.customerName}`);
  // TODO: Implement logic for potential employee assignments
  // For example, if customer is created with assigned_sales_id, track that relationship
});

eventBus.subscribe<CustomerUpdatedPayload>(EventNames.CUSTOMER_UPDATED, async (payload) => {
  console.log(`[HR Service] Received customer updated: ${payload.data.customerId}`);
  // TODO: Update employee-customer relationships if assigned_sales_id changes
  // For example, update sales employee's customer assignments
});

(async () => {
  try {
    await prisma.$connect();
    console.log('Connected to database successfully.');
  } catch (err) {
    console.error('Error connecting to database:', err instanceof Error ? err.message : err);
  } finally {
    app.listen(PORT, () => {
      console.log(`HR Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  }
})();
