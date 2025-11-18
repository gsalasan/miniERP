import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test query
    const accounts = await prisma.chartOfAccounts.findMany({ take: 1 });
    console.log('✅ Query successful, found', accounts.length, 'accounts');
  } catch (error: any) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
