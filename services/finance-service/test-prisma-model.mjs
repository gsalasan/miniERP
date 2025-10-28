import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('Available models:', Object.keys(prisma));
console.log('\nTrying to find TaxRates model...');

// Test berbagai kemungkinan nama
const possibleNames = ['taxRates', 'TaxRates', 'tax_rates', 'taxrates'];

for (const name of possibleNames) {
  if (prisma[name]) {
    console.log(`✅ Found model with name: "${name}"`);
  } else {
    console.log(`❌ No model with name: "${name}"`);
  }
}
