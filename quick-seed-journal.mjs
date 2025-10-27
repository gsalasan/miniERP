import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickSeed() {
  try {
    console.log('🚀 Quick Seed Journal Entries\n');

    // Check accounts
    const accounts = await prisma.chartOfAccounts.findMany();
    console.log(`Found ${accounts.length} COA accounts`);

    if (accounts.length < 2) {
      console.log('Creating sample COA accounts...');
      await prisma.chartOfAccounts.createMany({
        data: [
          { account_code: '1100', account_name: 'Cash', account_type: 'Asset', description: 'Cash account' },
          { account_code: '4100', account_name: 'Sales Revenue', account_type: 'Revenue', description: 'Revenue account' },
        ],
      });
    }

    // Get fresh accounts
    const freshAccounts = await prisma.chartOfAccounts.findMany();
    const cashAccount = freshAccounts.find(a => a.account_type === 'Asset');
    const revenueAccount = freshAccounts.find(a => a.account_type === 'Revenue');

    if (!cashAccount || !revenueAccount) {
      throw new Error('Need at least one Asset and one Revenue account');
    }

    console.log(`\nCreating journal entries...`);
    console.log(`Cash Account: ${cashAccount.account_code} - ${cashAccount.account_name}`);
    console.log(`Revenue Account: ${revenueAccount.account_code} - ${revenueAccount.account_name}\n`);

    // Create sample entries
    const entries = [
      {
        transaction_date: new Date('2024-01-15'),
        description: 'Cash sale - Invoice #001',
        account_id: cashAccount.id,
        debit: 1000000,
        reference_type: 'invoice',
        reference_id: '550e8400-e29b-41d4-a716-446655440001',
        created_by: 'admin',
      },
      {
        transaction_date: new Date('2024-01-15'),
        description: 'Cash sale - Invoice #001',
        account_id: revenueAccount.id,
        credit: 1000000,
        reference_type: 'invoice',
        reference_id: '550e8400-e29b-41d4-a716-446655440001',
        created_by: 'admin',
      },
      {
        transaction_date: new Date('2024-01-20'),
        description: 'Cash sale - Invoice #002',
        account_id: cashAccount.id,
        debit: 1500000,
        reference_type: 'invoice',
        reference_id: '550e8400-e29b-41d4-a716-446655440002',
        created_by: 'admin',
      },
      {
        transaction_date: new Date('2024-01-20'),
        description: 'Cash sale - Invoice #002',
        account_id: revenueAccount.id,
        credit: 1500000,
        reference_type: 'invoice',
        reference_id: '550e8400-e29b-41d4-a716-446655440002',
        created_by: 'admin',
      },
    ];

    for (const entry of entries) {
      await prisma.journalEntry.create({ data: entry });
      const type = entry.debit ? 'DEBIT' : 'CREDIT';
      const amount = entry.debit || entry.credit;
      console.log(`✅ ${type} Rp ${amount.toLocaleString('id-ID')} - ${entry.description}`);
    }

    console.log(`\n✅ Created ${entries.length} journal entries!`);

    // Show summary
    const allEntries = await prisma.journalEntry.findMany({
      include: { account: true },
    });

    console.log(`\n📊 Summary:`);
    console.log(`Total entries: ${allEntries.length}`);

    const totals = allEntries.reduce(
      (acc, entry) => ({
        debit: acc.debit + Number(entry.debit || 0),
        credit: acc.credit + Number(entry.credit || 0),
      }),
      { debit: 0, credit: 0 }
    );

    console.log(`Total Debit: Rp ${totals.debit.toLocaleString('id-ID')}`);
    console.log(`Total Credit: Rp ${totals.credit.toLocaleString('id-ID')}`);
    console.log(`${totals.debit === totals.credit ? '✅ Balanced!' : '❌ Not balanced'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

quickSeed();
