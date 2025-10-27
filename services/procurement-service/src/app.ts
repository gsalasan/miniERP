import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import vendorRoutes from "./routes/vendorRoutes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Prefix routes
app.use("/api/v1/vendors", vendorRoutes);

// Health check
app.get("/health", (_, res) => res.json({ ok: true }));

export default app;
