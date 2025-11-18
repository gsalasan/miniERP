"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllChartOfAccounts = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllChartOfAccounts = async () => {
    const accounts = await prisma.chartOfAccounts.findMany({
        orderBy: { id: 'asc' },
    });
    return accounts;
};
exports.getAllChartOfAccounts = getAllChartOfAccounts;
