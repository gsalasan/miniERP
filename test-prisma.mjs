import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing Prisma Client...');
    
    // Test TaxRates
    const taxRatesCount = await prisma.taxRates.count();
    console.log(`✅ TaxRates table accessible! Count: ${taxRatesCount}`);
    
    // Test ExchangeRates
    const exchangeRatesCount = await prisma.exchangeRates.count();
    console.log(`✅ ExchangeRates table accessible! Count: ${exchangeRatesCount}`);
    
    console.log('\n🎉 All tables are working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
