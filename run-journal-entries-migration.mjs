import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Starting Journal Entries migration...\n');

    console.log('📄 Creating journal_entries table...');
    console.log('=' .repeat(60));
    
    // Step 1: Create table
    console.log('\n⚡ Step 1: Creating table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "journal_entries" (
        "id" BIGSERIAL PRIMARY KEY,
        "transaction_date" DATE NOT NULL,
        "description" TEXT,
        "account_id" INTEGER NOT NULL,
        "debit" DECIMAL(15,2),
        "credit" DECIMAL(15,2),
        "reference_id" UUID,
        "reference_type" VARCHAR(50),
        "created_by" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "journal_entries_account_id_fkey" FOREIGN KEY ("account_id") 
          REFERENCES "ChartOfAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    console.log('✅ Table created');

    // Step 2: Create indexes
    console.log('\n⚡ Step 2: Creating indexes...');
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "journal_entries_account_id_idx" ON "journal_entries"("account_id")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "journal_entries_transaction_date_idx" ON "journal_entries"("transaction_date")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "journal_entries_reference_id_idx" ON "journal_entries"("reference_id")`);
      console.log('✅ Indexes created');
    } catch (e) {
      console.log('⚠️  Indexes already exist or error:', e.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Journal Entries migration completed successfully!\n');

    // Test the table
    console.log('🔍 Testing journal_entries table...');
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM journal_entries`;
    console.log('✅ Table is ready:', count);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
