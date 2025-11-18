"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Singleton pattern untuk PrismaClient
const globalForPrisma = global;
console.log("🔧 Creating Prisma Client instance...");
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: ['query', 'error', 'warn'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });
console.log("✅ Prisma Client created");
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
