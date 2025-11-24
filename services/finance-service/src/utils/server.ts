// src/utils/server.ts
import dotenv from "dotenv";
import path from "path";
import app from "./app";
import { eventBus } from "./eventBus";
import { EventNames, CustomerCreatedPayload, CustomerUpdatedPayload, ProjectStatusChangedPayload } from '../../../shared-event-bus/src/events';

// Load variabel environment dari .env dengan override untuk menghindari konflik
dotenv.config({ path: require('path').join(__dirname, '../../.env'), override: false });

// Force PORT dari .env local jika ada, atau gunakan default
const envPort = process.env.PORT;
const PORT = envPort && !isNaN(parseInt(envPort)) ? parseInt(envPort) : 8080;

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Stack:', reason);
  // Don't exit - keep server running
});

// Catch uncaught exceptions  
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit immediately - keep server running
});

// Subscribe to customer events
eventBus.subscribe<CustomerCreatedPayload>(EventNames.CUSTOMER_CREATED, async (payload) => {
  console.log(`[Finance Service] Received customer created: ${payload.data.customerId} - ${payload.data.customerName}`);
  // TODO: Sync customer data to finance service database if needed
  // For example, create customer record in finance module
});

eventBus.subscribe<CustomerUpdatedPayload>(EventNames.CUSTOMER_UPDATED, async (payload) => {
  console.log(`[Finance Service] Received customer updated: ${payload.data.customerId}`);
  // TODO: Update customer data in finance service database
  // For example, update credit limit, tax info (NPWP, SPPKP)
});

// Subscribe to project status changed events
eventBus.subscribe<ProjectStatusChangedPayload>(EventNames.PROJECT_STATUS_CHANGED, async (payload) => {
  console.log(`[Finance Service] Received project status change: ${payload.data.projectId} from ${payload.data.previousStatus} to ${payload.data.newStatus}`);
  // TODO: Update project financial status based on project status
  // For example, if project moves to WON, create financial records
});

// Jalankan server
const server = app.listen(PORT, () => {
  console.log(`Finance Service running on http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (error: any) => {
  console.error('❌ Server Error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});
