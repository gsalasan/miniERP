"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/utils/server.ts
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const app_1 = __importDefault(require("./app"));
// Load variabel environment dari .env (root project)
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../../.env') });
console.log("🔧 DATABASE_URL:", process.env.DATABASE_URL ? "✅ Loaded" : "❌ NOT FOUND");
const PORT = process.env.PORT || 5002;
// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});
// Jalankan server
const server = app_1.default.listen(PORT, () => {
    console.log(`Finance Service running on http://localhost:${PORT}`);
});
// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server Error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
});
