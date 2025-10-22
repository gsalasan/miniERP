// src/utils/app.ts
import express from "express";
import chartOfAccountsRoutes from "../routes/chartofaccounts.route";

const app = express();

// Middleware bawaan Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes utama (finance)
app.use("/api", chartOfAccountsRoutes);

// Default route untuk test server
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Finance Service API is running 🚀",
  });
});

export default app;
