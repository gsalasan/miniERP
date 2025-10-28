// src/utils/app.ts
import express from "express";
import cors from "cors";
import chartOfAccountsRoutes from "../routes/chartofaccounts.route";
import taxRatesRoutes from "../routes/taxrates.route";
import exchangeRatesRoutes from "../routes/exchangerates.route";

const app = express();

// CORS Configuration - Allow frontend to access API
app.use(cors({
  origin: function(origin, callback) {
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

// Routes utama (finance)
app.use("/api", chartOfAccountsRoutes);
app.use("/api", taxRatesRoutes);
app.use("/api", exchangeRatesRoutes);
app.use("/api", invoicesRoutes);
app.use("/api/journal-entries", journalEntriesRoutes);

// 404 handler - pastikan mengembalikan JSON (HARUS SETELAH SEMUA ROUTES)
app.use((req, res, next) => {
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
