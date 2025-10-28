import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🚀 Creating tax_rates table...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "tax_rates" (
        "id" SERIAL NOT NULL,
        "tax_name" TEXT NOT NULL,
        "tax_code" TEXT NOT NULL,
        "rate" DECIMAL(5,2) NOT NULL,
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "tax_rates_tax_name_key" ON "tax_rates"("tax_name");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "tax_rates_tax_code_key" ON "tax_rates"("tax_code");
    `);

    console.log('✅ tax_rates table created successfully!');

    console.log('🚀 Creating exchange_rates table...');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "exchange_rates" (
        "id" SERIAL NOT NULL,
        "currency_from" VARCHAR(3) NOT NULL,
        "currency_to" VARCHAR(3) NOT NULL,
        "rate" DECIMAL(18,6) NOT NULL,
        "effective_date" DATE NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "exchange_rates_currency_from_currency_to_effective_date_key" 
      ON "exchange_rates"("currency_from", "currency_to", "effective_date");
    `);

    console.log('✅ exchange_rates table created successfully!');

    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Run: cd services/finance-service');
    console.log('2. Run: npx prisma generate');
    console.log('3. Restart your finance service');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
