// src/utils/app.ts
import express from "express";
import chartOfAccountsRoutes from "../routes/chartofaccounts.route";
import journalEntriesRoutes from "../routes/journalentries.route";
import taxRatesRoutes from "../routes/taxrates.route";
import exchangeRatesRoutes from "../routes/exchangerates.route";
import pricingRulesRoutes from "../routes/pricingrules.routes";
import overheadAllocationsRoutes from "../routes/overheadallocations.routes";
import discountPoliciesRoutes from "../routes/discountpolicies.routes";
import invoicesRoutes from "../routes/invoices.route";
import reportsRoutes from "../routes/reports.route";

const app = express();

// Middleware bawaan Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes utama (finance) - FULL KOKPIT FINANSIAL
console.log("📍 Loading ALL finance routes for Kokpit Finansial...");
app.use("/api", chartOfAccountsRoutes);                      // Chart of Accounts
app.use("/api/journal-entries", journalEntriesRoutes);       // Journal Entries (FITUR 3.4.C)
app.use("/api", taxRatesRoutes);                             // Tax Rates (FITUR 3.4.F - Kokpit) ✅
app.use("/api", exchangeRatesRoutes);                        // Exchange Rates (FITUR 3.4.F - Kokpit) ✅
app.use("/api/pricing-rules", pricingRulesRoutes);           // Pricing Rules (FITUR 3.4.F - Kokpit)
app.use("/api/overhead-allocations", overheadAllocationsRoutes); // Overhead (FITUR 3.4.F - Kokpit)
app.use("/api/discount-policies", discountPoliciesRoutes);   // Discount Policies (FITUR 3.4.F - Kokpit)
app.use("/api/invoices", invoicesRoutes);                    // Invoices (FITUR 3.4.A & B)
app.use("/api/reports", reportsRoutes);                      // Financial Reports (FITUR 3.4.D - Automation) ⭐
console.log("✅ FULL Kokpit Finansial ACTIVE! Tax Rates ✅ Exchange Rates ✅");

// Default route untuk test server
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Finance Service API is running 🚀",
  });
});

// Global error handler - COMMENTED OUT FOR DEBUGGING
// app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
//   console.error('❌ GLOBAL ERROR HANDLER:', err);
//   res.status(500).json({
//     success: false,
//     message: 'Internal server error',
//     error: err.message,
//     stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
//   });
// });

export default app;
