// src/utils/app.ts
import express from "express";
import chartOfAccountsRoutes from "../routes/chartofaccounts.route";
import taxRatesRoutes from "../routes/taxrates.route";
import exchangeRatesRoutes from "../routes/exchangerates.route";

const app = express();

// Middleware bawaan Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes utama (finance)
app.use("/api", chartOfAccountsRoutes);
app.use("/api", taxRatesRoutes);
app.use("/api", exchangeRatesRoutes);

// Default route untuk test server
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Finance Service API is running 🚀",
  });
});

export default app;
