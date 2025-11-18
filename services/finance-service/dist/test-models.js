"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function testPrisma() {
    try {
        console.log('Testing Tax Rates...');
        const taxRates = await prisma.tax_rates.findMany();
        console.log('✅ Tax Rates:', taxRates.length, 'records');
        console.log('Testing Exchange Rates...');
        const exchangeRates = await prisma.exchange_rates.findMany();
        console.log('✅ Exchange Rates:', exchangeRates.length, 'records');
        console.log('\n🎉 All working!');
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testPrisma();
