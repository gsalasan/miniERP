"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// src/utils/prisma.ts
const client_1 = require("@prisma/client");
// Singleton pattern for Prisma Client
// Prevents multiple instances which can cause connection issues
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
exports.default = exports.prisma;
