// src/utils/app.ts
import express from "express";
import cors from "cors";
import chartOfAccountsRoutes from "../routes/chartofaccounts.route";
import journalEntriesRoutes from "../routes/journalentries.route";
import generalJournalRoutes from "../routes/general-journal.route";
import taxRatesRoutes from "../routes/taxrates.route";
import exchangeRatesRoutes from "../routes/exchangerates.route";
import pricingRulesRoutes from "../routes/pricingrules.routes";
import overheadAllocationsRoutes from "../routes/overheadallocations.routes";
import discountPoliciesRoutes from "../routes/discountpolicies.routes";
import paymentTermsRoutes from "../routes/paymentterms.routes";
import expenseClaimPoliciesRoutes from "../routes/expenseclaimpolicies.routes";
import invoicesRoutes from "../routes/invoices.route";
import paymentsRoutes from "../routes/payments.routes";
import reportsRoutes from "../routes/reports.route";
import dashboardRoutes from "../routes/dashboard.route";
import payablesRoutes from "../routes/payables.route";
import incentivesRoutes from "../routes/incentives.route";
import assetsRoutes from "../routes/assets.route";
import quotationsRoutes from "../routes/quotations.routes";
import arRoutes from "../routes/ar.route";
import milestoneInvoicesRoutes from "../routes/milestone-invoices.route";
import eventsRoutes from "../routes/events.route";
import { journalEvents } from "../services/journalEventListener";

const app = express();

// Initialize journal event listeners (MIN-139)
console.log('🎧 Initializing journal event listeners...');
journalEvents; // This triggers the constructor and setupListeners()

// CORS Configuration - Allow frontend to access API
app.use(cors({
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl, Postman, or local HTML files)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3012',
      'http://localhost:3013', 
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3012',
      'null' // For local file:// protocol
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin === 'null') {
      callback(null, true);
    } else {
      console.log('⚠️ CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
}));

// Middleware bawaan Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (payment proofs, receipts, etc.)
app.use('/uploads', express.static('uploads'));

// Routes utama (finance) - FULL KOKPIT FINANSIAL
console.log("📍 Loading ALL finance routes for Kokpit Finansial...");
app.use("/api", chartOfAccountsRoutes);                      // Chart of Accounts
app.use("/api/journal-entries", journalEntriesRoutes);       // Journal Entries (FITUR 3.4.C)
app.use("/api/journal-entries", generalJournalRoutes);       // General Journal Entry (FITUR 3.4.C) 📝
app.use("/api", taxRatesRoutes);                             // Tax Rates (FITUR 3.4.F - Kokpit) ✅
app.use("/api", exchangeRatesRoutes);                        // Exchange Rates (FITUR 3.4.F - Kokpit) ✅
app.use("/api/pricing-rules", pricingRulesRoutes);           // Pricing Rules (FITUR 3.4.F - Kokpit)
app.use("/api/overhead-allocations", overheadAllocationsRoutes); // Overhead (FITUR 3.4.F - Kokpit)
app.use("/api/discount-policies", discountPoliciesRoutes);   // Discount Policies (FITUR 3.4.F - Kokpit)
app.use("/api", paymentTermsRoutes);                         // Payment Terms (FITUR 3.4.F - Kokpit) 💳
app.use("/api", expenseClaimPoliciesRoutes);                 // Expense Claim Policies (FITUR 3.4.F - Kokpit) 💰
app.use("/api/invoices", invoicesRoutes);                    // Invoices (FITUR 3.4.A & B)
app.use("/api/invoices", paymentsRoutes);                    // Invoice Payments (MIN-137 FIN-11) 💳
app.use("/api/quotations", quotationsRoutes);                // Quotations - Update status dari CRM
app.use("/api/payables", payablesRoutes);                    // Accounts Payable (FITUR 3.4.B - AP)
app.use("/api/reports", reportsRoutes);                      // Financial Reports (FITUR 3.4.D - Automation) ⭐
app.use("/api/dashboards", dashboardRoutes);                 // Finance Dashboard (FITUR 3.4.G - Analytics) 📊
app.use("/api/incentives", incentivesRoutes);                // Incentive Simulation (FITUR 3.4.H - Incentives) 🎯
app.use("/api/assets", assetsRoutes);                        // Asset Management (FITUR 3.4.E - Assets & Depreciation) 🏢
app.use("/api/ar", arRoutes);                                // Accounts Receivable Dashboard (Real-time AR Data) 💰
app.use("/api/milestone-invoices", milestoneInvoicesRoutes); // Auto-generate Invoice dari Milestone (FITUR 3.4.A - FIN-09) 🔄
app.use("/api/events", eventsRoutes);                        // Event Listener for Auto-Journal (MIN-139 FIN-12) 🎧
console.log("✅ FULL Kokpit Finansial ACTIVE! AR ✅ AP ✅ Dashboard 📊 Incentives 🎯 Assets 🏢 + Auto-Invoice 🔄 + Event Listener 🎧");

// Health check endpoint for Cloud Run
app.get("/health", (req: express.Request, res: express.Response) => {
  res.status(200).json({
    success: true,
    message: "Finance Service is healthy",
    service: "finance-service",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Default route untuk test server
app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).json({
    success: true,
    message: "Finance Service API is running 🚀",
  });
});

// 404 handler - pastikan mengembalikan JSON (HARUS SETELAH SEMUA ROUTES)
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler - HARUS PALING AKHIR dengan 4 parameters
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err);
  
  // Pastikan response adalah JSON
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;
