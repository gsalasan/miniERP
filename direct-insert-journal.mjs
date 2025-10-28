import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function directInsert() {
  try {
    console.log('🚀 Direct SQL Insert for Journal Entries\n');

    // Get accounts
    const accounts = await prisma.chartOfAccounts.findMany();
    console.log(`Found ${accounts.length} COA accounts\n`);

    const cashAccount = accounts.find(a => a.account_code === '1100');
    const revenueAccount = accounts.find(a => a.account_code === '4100');

    if (!cashAccount || !revenueAccount) {
      console.error('❌ Need Cash (1100) and Revenue (4100) accounts');
      return;
    }

    console.log(`Cash Account ID: ${cashAccount.id}`);
    console.log(`Revenue Account ID: ${revenueAccount.id}\n`);

    // Insert using raw SQL
    const entries = [
      { date: '2024-01-15', desc: 'Cash sale - Invoice #001', account_id: cashAccount.id, debit: 1000000 },
      { date: '2024-01-15', desc: 'Cash sale - Invoice #001', account_id: revenueAccount.id, credit: 1000000 },
      { date: '2024-01-20', desc: 'Cash sale - Invoice #002', account_id: cashAccount.id, debit: 1500000 },
      { date: '2024-01-20', desc: 'Cash sale - Invoice #002', account_id: revenueAccount.id, credit: 1500000 },
      { date: '2024-01-25', desc: 'Cash sale - Invoice #003', account_id: cashAccount.id, debit: 2000000 },
      { date: '2024-01-25', desc: 'Cash sale - Invoice #003', account_id: revenueAccount.id, credit: 2000000 },
    ];

    console.log('Inserting journal entries...\n');

    for (const entry of entries) {
      if (entry.debit) {
        await prisma.$executeRaw`
          INSERT INTO journal_entries (transaction_date, description, account_id, debit, reference_type, reference_id, created_by, created_at, updated_at)
          VALUES (${entry.date}::date, ${entry.desc}, ${entry.account_id}, ${entry.debit}, 'invoice', gen_random_uuid(), 'admin', NOW(), NOW())
        `;
        console.log(`✅ DEBIT Rp ${entry.debit.toLocaleString('id-ID')} - ${entry.desc}`);
      } else {
        await prisma.$executeRaw`
          INSERT INTO journal_entries (transaction_date, description, account_id, credit, reference_type, reference_id, created_by, created_at, updated_at)
          VALUES (${entry.date}::date, ${entry.desc}, ${entry.account_id}, ${entry.credit}, 'invoice', gen_random_uuid(), 'admin', NOW(), NOW())
        `;
        console.log(`✅ CREDIT Rp ${entry.credit.toLocaleString('id-ID')} - ${entry.desc}`);
      }
    }

    // Verify
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM journal_entries`;
    console.log(`\n✅ Total entries in database: ${count[0].count}`);

    // Show totals
    const totals = await prisma.$queryRaw`
      SELECT 
        SUM(debit) as total_debit,
        SUM(credit) as total_credit
      FROM journal_entries
    `;
    
    console.log(`Total Debit: Rp ${Number(totals[0].total_debit || 0).toLocaleString('id-ID')}`);
    console.log(`Total Credit: Rp ${Number(totals[0].total_credit || 0).toLocaleString('id-ID')}`);
    console.log(totals[0].total_debit === totals[0].total_credit ? '✅ Balanced!' : '❌ Not balanced');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

directInsert();
