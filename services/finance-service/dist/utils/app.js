"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/utils/app.ts
const express_1 = __importDefault(require("express"));
const chartofaccounts_route_1 = __importDefault(require("../routes/chartofaccounts.route"));
const app = (0, express_1.default)();
// Middleware bawaan Express
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes utama (finance) - Testing one by one
console.log("📍 Loading Chart of Accounts routes...");
app.use("/api", chartofaccounts_route_1.default);
console.log("✅ Chart of Accounts routes loaded");
// app.use("/api/journal-entries", journalEntriesRoutes); // TODO: Test after COA works
// app.use("/api", taxRatesRoutes);
// app.use("/api", exchangeRatesRoutes);
// app.use("/api/pricing-rules", pricingRulesRoutes);
// app.use("/api/overhead-allocations", overheadAllocationsRoutes);
// app.use("/api/discount-policies", discountPoliciesRoutes);
// app.use("/api/invoices", invoicesRoutes);
// app.use("/api/reports", reportsRoutes);
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
exports.default = app;
