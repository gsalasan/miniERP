"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
// CORS configuration: support multiple allowed origins (comma-separated)
const defaultOrigins = [
    'http://localhost:3000', // main-frontend
    'http://localhost:3010', // crm-frontend
    'http://localhost:3011', // engineering
    'http://localhost:3012', // finance
    'http://localhost:3013', // hr
];
const allowedOrigins = (process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : defaultOrigins);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // allow non-browser requests (like Postman) where origin may be undefined
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Identity Service is running',
        timestamp: new Date().toISOString(),
        service: 'identity-service'
    });
});
// API Routes with versioning
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1', employee_routes_1.default);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint tidak ditemukan',
        path: req.originalUrl
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map