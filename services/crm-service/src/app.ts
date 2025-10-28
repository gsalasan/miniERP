import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import customerRoutes from "./routes/customerRoutes";
import customerContactRoutes from "./routes/customerContactsRoutes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Prefix routes
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/customer-contacts", customerContactRoutes);

// Health check
app.get("/health", (_, res) => res.json({ ok: true }));

export default app;
