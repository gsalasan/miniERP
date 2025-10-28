import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting Journal Entries seed...\n');

    // First, check if COA accounts exist
    console.log('📊 Checking Chart of Accounts...');
    const accounts = await prisma.chartOfAccounts.findMany({
      orderBy: { account_code: 'asc' },
    });

    if (accounts.length === 0) {
      console.log('⚠️  No COA accounts found. Creating sample accounts first...\n');
      
      // Create sample COA accounts
      const sampleAccounts = [
        { account_code: '1100', account_name: 'Cash', account_type: 'Asset', description: 'Cash on hand and in bank' },
        { account_code: '1200', account_name: 'Accounts Receivable', account_type: 'Asset', description: 'Money owed by customers' },
        { account_code: '2100', account_name: 'Accounts Payable', account_type: 'Liability', description: 'Money owed to suppliers' },
        { account_code: '3100', account_name: 'Capital', account_type: 'Equity', description: 'Owner capital' },
        { account_code: '4100', account_name: 'Sales Revenue', account_type: 'Revenue', description: 'Revenue from sales' },
        { account_code: '5100', account_name: 'Operating Expenses', account_type: 'Expense', description: 'General operating expenses' },
      ];

      for (const account of sampleAccounts) {
        await prisma.chartOfAccounts.create({ data: account });
        console.log(`✅ Created COA: ${account.account_code} - ${account.account_name}`);
      }
      
      // Refresh accounts list
      const newAccounts = await prisma.chartOfAccounts.findMany({
        orderBy: { account_code: 'asc' },
      });
      accounts.push(...newAccounts);
    } else {
      console.log(`✅ Found ${accounts.length} COA accounts\n`);
      accounts.forEach(acc => {
        console.log(`   ${acc.account_code} - ${acc.account_name} (${acc.account_type})`);
      });
    }

    console.log('\n📝 Creating Journal Entries...\n');

    // Find account IDs
    const cashAccount = accounts.find(a => a.account_type === 'Asset' && a.account_name.toLowerCase().includes('cash'));
    const revenueAccount = accounts.find(a => a.account_type === 'Revenue');
    const expenseAccount = accounts.find(a => a.account_type === 'Expense');
    const receivableAccount = accounts.find(a => a.account_type === 'Asset' && a.account_name.toLowerCase().includes('receivable'));
    const payableAccount = accounts.find(a => a.account_type === 'Liability');
    const capitalAccount = accounts.find(a => a.account_type === 'Equity');

    // Sample journal entries
    const journalEntries = [];

    // Transaction 1: Initial Capital Investment
    if (cashAccount && capitalAccount) {
      journalEntries.push(
        {
          transaction_date: new Date('2024-01-01'),
          description: 'Initial capital investment',
          account_id: cashAccount.id,
          debit: 10000000,
          reference_type: 'capital',
          reference_id: '550e8400-e29b-41d4-a716-446655440001',
          created_by: 'system',
        },
        {
          transaction_date: new Date('2024-01-01'),
          description: 'Initial capital investment',
          account_id: capitalAccount.id,
          credit: 10000000,
          reference_type: 'capital',
          reference_id: '550e8400-e29b-41d4-a716-446655440001',
          created_by: 'system',
        }
      );
    }

    // Transaction 2: Cash Sales
    if (cashAccount && revenueAccount) {
      journalEntries.push(
        {
          transaction_date: new Date('2024-01-15'),
          description: 'Cash sale - Invoice #INV-001',
          account_id: cashAccount.id,
          debit: 5000000,
          reference_type: 'invoice',
          reference_id: '550e8400-e29b-41d4-a716-446655440002',
          created_by: 'admin',
        },
        {
          transaction_date: new Date('2024-01-15'),
          description: 'Cash sale - Invoice #INV-001',
          account_id: revenueAccount.id,
          credit: 5000000,
          reference_type: 'invoice',
          reference_id: '550e8400-e29b-41d4-a716-446655440002',
          created_by: 'admin',
        }
      );
    }

    // Transaction 3: Credit Sales
    if (receivableAccount && revenueAccount) {
      journalEntries.push(
        {
          transaction_date: new Date('2024-01-20'),
          description: 'Credit sale - Invoice #INV-002',
          account_id: receivableAccount.id,
          debit: 3000000,
          reference_type: 'invoice',
          reference_id: '550e8400-e29b-41d4-a716-446655440003',
          created_by: 'admin',
        },
        {
          transaction_date: new Date('2024-01-20'),
          description: 'Credit sale - Invoice #INV-002',
          account_id: revenueAccount.id,
          credit: 3000000,
          reference_type: 'invoice',
          reference_id: '550e8400-e29b-41d4-a716-446655440003',
          created_by: 'admin',
        }
      );
    }

    // Transaction 4: Operating Expenses
    if (expenseAccount && cashAccount) {
      journalEntries.push(
        {
          transaction_date: new Date('2024-01-25'),
          description: 'Office supplies payment',
          account_id: expenseAccount.id,
          debit: 500000,
          reference_type: 'payment',
          reference_id: '550e8400-e29b-41d4-a716-446655440004',
          created_by: 'admin',
        },
        {
          transaction_date: new Date('2024-01-25'),
          description: 'Office supplies payment',
          account_id: cashAccount.id,
          credit: 500000,
          reference_type: 'payment',
          reference_id: '550e8400-e29b-41d4-a716-446655440004',
          created_by: 'admin',
        }
      );
    }

    // Transaction 5: Purchase on Credit
    if (expenseAccount && payableAccount) {
      journalEntries.push(
        {
          transaction_date: new Date('2024-01-30'),
          description: 'Purchase inventory on credit',
          account_id: expenseAccount.id,
          debit: 2000000,
          reference_type: 'purchase',
          reference_id: '550e8400-e29b-41d4-a716-446655440005',
          created_by: 'admin',
        },
        {
          transaction_date: new Date('2024-01-30'),
          description: 'Purchase inventory on credit',
          account_id: payableAccount.id,
          credit: 2000000,
          reference_type: 'purchase',
          reference_id: '550e8400-e29b-41d4-a716-446655440005',
          created_by: 'admin',
        }
      );
    }

    // Transaction 6: Payment to Supplier
    if (payableAccount && cashAccount) {
      journalEntries.push(
        {
          transaction_date: new Date('2024-02-05'),
          description: 'Payment to supplier',
          account_id: payableAccount.id,
          debit: 1000000,
          reference_type: 'payment',
          reference_id: '550e8400-e29b-41d4-a716-446655440006',
          created_by: 'admin',
        },
        {
          transaction_date: new Date('2024-02-05'),
          description: 'Payment to supplier',
          account_id: cashAccount.id,
          credit: 1000000,
          reference_type: 'payment',
          reference_id: '550e8400-e29b-41d4-a716-446655440006',
          created_by: 'admin',
        }
      );
    }

    // Transaction 7: Receive Payment from Customer
    if (cashAccount && receivableAccount) {
      journalEntries.push(
        {
          transaction_date: new Date('2024-02-10'),
          description: 'Received payment from customer',
          account_id: cashAccount.id,
          debit: 1500000,
          reference_type: 'payment',
          reference_id: '550e8400-e29b-41d4-a716-446655440007',
          created_by: 'admin',
        },
        {
          transaction_date: new Date('2024-02-10'),
          description: 'Received payment from customer',
          account_id: receivableAccount.id,
          credit: 1500000,
          reference_type: 'payment',
          reference_id: '550e8400-e29b-41d4-a716-446655440007',
          created_by: 'admin',
        }
      );
    }

    // Insert journal entries
    let successCount = 0;
    for (const entry of journalEntries) {
      try {
        await prisma.journalEntry.create({ data: entry });
        const type = entry.debit ? 'Debit' : 'Credit';
        const amount = entry.debit || entry.credit;
        const account = accounts.find(a => a.id === entry.account_id);
        console.log(`✅ ${type} ${amount.toLocaleString('id-ID')} - ${account?.account_name} - ${entry.description}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to create entry: ${entry.description}`, error.message);
      }
    }

    console.log(`\n✅ Successfully created ${successCount} journal entries!`);

    // Show summary
    console.log('\n📊 Journal Entries Summary:');
    const allEntries = await prisma.journalEntry.findMany({
      include: { account: true },
      orderBy: { transaction_date: 'asc' },
    });

    console.log(`Total entries: ${allEntries.length}`);
    
    // Calculate totals
    const totals = allEntries.reduce(
      (acc, entry) => {
        const debit = Number(entry.debit) || 0;
        const credit = Number(entry.credit) || 0;
        return {
          debit: acc.debit + debit,
          credit: acc.credit + credit,
        };
      },
      { debit: 0, credit: 0 }
    );

    console.log(`Total Debit: Rp ${totals.debit.toLocaleString('id-ID')}`);
    console.log(`Total Credit: Rp ${totals.credit.toLocaleString('id-ID')}`);
    console.log(`Balance: ${totals.debit === totals.credit ? '✅ Balanced' : '❌ Not Balanced'}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
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
