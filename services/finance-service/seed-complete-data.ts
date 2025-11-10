import { PrismaClient, AccountType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCompleteData() {
  console.log('🌱 Starting complete data seeding...\n');

  try {
    // 1. SEED CHART OF ACCOUNTS
    console.log('📊 Seeding Chart of Accounts...');
    
    const chartOfAccounts = [
      // ASSETS
      { account_code: '1000', account_name: 'Kas', account_type: AccountType.Asset, description: 'Kas di tangan' },
      { account_code: '1100', account_name: 'Bank BCA', account_type: AccountType.Asset, description: 'Rekening Bank BCA' },
      { account_code: '1200', account_name: 'Piutang Usaha', account_type: AccountType.Asset, description: 'Tagihan ke customer' },
      { account_code: '1300', account_name: 'Persediaan Barang', account_type: AccountType.Asset, description: 'Stok barang' },
      
      // LIABILITIES
      { account_code: '2000', account_name: 'Hutang Usaha', account_type: AccountType.Liability, description: 'Hutang ke supplier' },
      { account_code: '2100', account_name: 'Hutang Bank', account_type: AccountType.Liability, description: 'Pinjaman bank' },
      
      // EQUITY
      { account_code: '3000', account_name: 'Modal Pemilik', account_type: AccountType.Equity, description: 'Modal awal' },
      { account_code: '3100', account_name: 'Laba Ditahan', account_type: AccountType.Equity, description: 'Akumulasi laba' },
      
      // REVENUE
      { account_code: '4000', account_name: 'Pendapatan Jasa', account_type: AccountType.Revenue, description: 'Pendapatan dari jasa' },
      { account_code: '4100', account_name: 'Pendapatan Penjualan', account_type: AccountType.Revenue, description: 'Pendapatan dari penjualan barang' },
      
      // COST OF SERVICE
      { account_code: '5000', account_name: 'HPP - Bahan Baku', account_type: AccountType.CostOfService, description: 'Harga Pokok Penjualan - Bahan Baku' },
      { account_code: '5100', account_name: 'HPP - Tenaga Kerja', account_type: AccountType.CostOfService, description: 'Harga Pokok Penjualan - Tenaga Kerja' },
      
      // EXPENSES
      { account_code: '6000', account_name: 'Beban Gaji', account_type: AccountType.Expense, description: 'Gaji karyawan' },
      { account_code: '6100', account_name: 'Beban Listrik', account_type: AccountType.Expense, description: 'Tagihan listrik' },
      { account_code: '6200', account_name: 'Beban Sewa', account_type: AccountType.Expense, description: 'Sewa kantor/gedung' },
      { account_code: '6300', account_name: 'Beban Transportasi', account_type: AccountType.Expense, description: 'Biaya transportasi' },
    ];

    for (const account of chartOfAccounts) {
      await prisma.chartOfAccounts.upsert({
        where: { account_code: account.account_code },
        update: account,
        create: account,
      });
    }
    console.log(`✅ Seeded ${chartOfAccounts.length} Chart of Accounts\n`);

    // 2. SEED TAX RATES
    console.log('💰 Seeding Tax Rates...');
    
    const taxRates = [
      { tax_name: 'PPN', rate_percentage: 11.00 },
      { tax_name: 'PPh 21', rate_percentage: 5.00 },
      { tax_name: 'PPh 23', rate_percentage: 2.00 },
      { tax_name: 'PPh Final', rate_percentage: 0.50 },
    ];

    for (const tax of taxRates) {
      await prisma.tax_rates.upsert({
        where: { tax_name: tax.tax_name },
        update: { rate_percentage: tax.rate_percentage },
        create: tax,
      });
    }
    console.log(`✅ Seeded ${taxRates.length} Tax Rates\n`);

    // 3. SEED EXCHANGE RATES
    console.log('💱 Seeding Exchange Rates...');
    
    const exchangeRates = [
      { currency_code: 'USD', rate_to_idr: 15750.00 },
      { currency_code: 'EUR', rate_to_idr: 17250.00 },
      { currency_code: 'SGD', rate_to_idr: 11800.00 },
      { currency_code: 'JPY', rate_to_idr: 105.50 },
      { currency_code: 'CNY', rate_to_idr: 2180.00 },
    ];

    for (const rate of exchangeRates) {
      await prisma.exchange_rates.upsert({
        where: { currency_code: rate.currency_code },
        update: { rate_to_idr: rate.rate_to_idr },
        create: rate,
      });
    }
    console.log(`✅ Seeded ${exchangeRates.length} Exchange Rates\n`);

    // 4. SEED JOURNAL ENTRIES (Sample transactions)
    console.log('📝 Seeding Journal Entries...');
    
    // Get account IDs
    const kasAccount = await prisma.chartOfAccounts.findFirst({ where: { account_code: '1000' } });
    const bankAccount = await prisma.chartOfAccounts.findFirst({ where: { account_code: '1100' } });
    const modalAccount = await prisma.chartOfAccounts.findFirst({ where: { account_code: '3000' } });
    const pendapatanJasa = await prisma.chartOfAccounts.findFirst({ where: { account_code: '4000' } });
    const bebanGaji = await prisma.chartOfAccounts.findFirst({ where: { account_code: '6000' } });
    const bebanListrik = await prisma.chartOfAccounts.findFirst({ where: { account_code: '6100' } });

    const journalEntries = [
      // Transaksi 1: Modal awal masuk ke kas
      { 
        transaction_date: new Date('2025-01-01'), 
        account_id: kasAccount!.id, 
        debit: 100000000, 
        credit: 0, 
        description: 'Modal awal - Debit Kas',
        created_by: 'system'
      },
      { 
        transaction_date: new Date('2025-01-01'), 
        account_id: modalAccount!.id, 
        debit: 0, 
        credit: 100000000, 
        description: 'Modal awal - Credit Modal',
        created_by: 'system'
      },
      
      // Transaksi 2: Pendapatan jasa
      { 
        transaction_date: new Date('2025-01-15'), 
        account_id: bankAccount!.id, 
        debit: 25000000, 
        credit: 0, 
        description: 'Pendapatan jasa konsultasi - Debit Bank',
        created_by: 'system'
      },
      { 
        transaction_date: new Date('2025-01-15'), 
        account_id: pendapatanJasa!.id, 
        debit: 0, 
        credit: 25000000, 
        description: 'Pendapatan jasa konsultasi - Credit Pendapatan',
        created_by: 'system'
      },
      
      // Transaksi 3: Bayar gaji
      { 
        transaction_date: new Date('2025-01-25'), 
        account_id: bebanGaji!.id, 
        debit: 15000000, 
        credit: 0, 
        description: 'Pembayaran gaji karyawan - Debit Beban Gaji',
        created_by: 'system'
      },
      { 
        transaction_date: new Date('2025-01-25'), 
        account_id: bankAccount!.id, 
        debit: 0, 
        credit: 15000000, 
        description: 'Pembayaran gaji karyawan - Credit Bank',
        created_by: 'system'
      },
      
      // Transaksi 4: Bayar listrik
      { 
        transaction_date: new Date('2025-01-30'), 
        account_id: bebanListrik!.id, 
        debit: 2000000, 
        credit: 0, 
        description: 'Pembayaran listrik bulan Januari - Debit Beban Listrik',
        created_by: 'system'
      },
      { 
        transaction_date: new Date('2025-01-30'), 
        account_id: kasAccount!.id, 
        debit: 0, 
        credit: 2000000, 
        description: 'Pembayaran listrik bulan Januari - Credit Kas',
        created_by: 'system'
      },
    ];

    // Delete existing journal entries untuk clean seed
    await prisma.journal_entries.deleteMany({});
    
    for (const entry of journalEntries) {
      await prisma.journal_entries.create({ data: entry });
    }
    console.log(`✅ Seeded ${journalEntries.length} Journal Entries\n`);

    console.log('✅ ✅ ✅ Complete data seeding finished successfully! ✅ ✅ ✅\n');
    
    // Show summary
    const coaCount = await prisma.chartOfAccounts.count();
    const journalCount = await prisma.journal_entries.count();
    const taxCount = await prisma.tax_rates.count();
    const exchangeCount = await prisma.exchange_rates.count();
    
    console.log('📊 DATABASE SUMMARY:');
    console.log(`   - Chart of Accounts: ${coaCount}`);
    console.log(`   - Journal Entries: ${journalCount}`);
    console.log(`   - Tax Rates: ${taxCount}`);
    console.log(`   - Exchange Rates: ${exchangeCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCompleteData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
