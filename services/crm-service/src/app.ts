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
<<<<<<< HEAD
=======
import customerContactRoutes from "./routes/customerContactsRoutes";
>>>>>>> main
>>>>>>> main

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
// Prefix routes
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/customer-contacts', customerContactRoutes);
=======
<<<<<<< HEAD
// Prefix route
app.use("/api/v1/customers", customerRoutes);
=======
// Prefix routes
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/customer-contacts", customerContactRoutes);
>>>>>>> main
>>>>>>> main

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

export default app;
