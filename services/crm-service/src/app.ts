<<<<<<< HEAD
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import customerRoutes from './routes/customerRoutes';
import customerContactRoutes from './routes/customerContactsRoutes';
=======
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import customerRoutes from "./routes/customerRoutes";
>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
// Prefix routes
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/customer-contacts', customerContactRoutes);

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));
=======
// Prefix route
app.use("/api/v1/customers", customerRoutes);

// Health check
app.get("/health", (_, res) => res.json({ ok: true }));
>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987

export default app;
