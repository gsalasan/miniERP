import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const count = await prisma.chartOfAccounts.count();
    console.log('✅ Database connected! Chart of Accounts count:', count);
    
    const accounts = await prisma.chartOfAccounts.findMany({ take: 2 });
    console.log('Sample accounts:', JSON.stringify(accounts, null, 2));
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
