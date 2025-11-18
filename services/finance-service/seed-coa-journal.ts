import { PrismaClient, AccountType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCOAAndJournal() {
  console.log('🌱 Seeding COA dan Journal Entries...\n');

  try {
    // Check existing COA count
    const existingCount = await prisma.chartOfAccounts.count();
    console.log(`📊 Existing COA count: ${existingCount}`);
    
    if (existingCount >= 16) {
      console.log('✅ COA sudah lengkap, skip seeding COA\n');
    } else {
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
    }

    // SEED JOURNAL ENTRIES
    console.log('📝 Seeding Journal Entries...');
    
    // Get account IDs
    const kasAccount = await prisma.chartOfAccounts.findFirst({ where: { account_code: '1000' } });
    const bankAccount = await prisma.chartOfAccounts.findFirst({ where: { account_code: '1100' } });
    const modalAccount = await prisma.chartOfAccounts.findFirst({ where: { account_code: '3000' } });
    const pendapatanJasa = await prisma.chartOfAccounts.findFirst({ where: { account_code: '4000' } });
    const bebanGaji = await prisma.chartOfAccounts.findFirst({ where: { account_code: '6000' } });
    const bebanListrik = await prisma.chartOfAccounts.findFirst({ where: { account_code: '6100' } });

    if (!kasAccount || !bankAccount || !modalAccount || !pendapatanJasa || !bebanGaji || !bebanListrik) {
      throw new Error('Required accounts not found!');
    }

    const journalEntries = [
      // Transaksi 1: Modal awal masuk ke kas
      { 
        transaction_date: new Date('2025-01-01'), 
        account_id: kasAccount.id, 
        debit: 100000000, 
        credit: 0, 
        description: 'Modal awal - Debit Kas',
        created_by: 'system'
      },
      { 
        transaction_date: new Date('2025-01-01'), 
        account_id: modalAccount.id, 
        debit: 0, 
        credit: 100000000, 
        description: 'Modal awal - Credit Modal',
        created_by: 'system'
      },
      
      // Transaksi 2: Pendapatan jasa
      { 
        transaction_date: new Date('2025-01-15'), 
        account_id: bankAccount.id, 
        debit: 25000000, 
        credit: 0, 
        description: 'Pendapatan jasa konsultasi - Debit Bank',
        created_by: 'system'
      },
      { 
        transaction_date: new Date('2025-01-15'), 
        account_id: pendapatanJasa.id, 
        debit: 0, 
        credit: 25000000, 
        description: 'Pendapatan jasa konsultasi - Credit Pendapatan',
        created_by: 'system'
      },
      
      // Transaksi 3: Bayar gaji
      { 
        transaction_date: new Date('2025-01-25'), 
        account_id: bebanGaji.id, 
        debit: 15000000, 
        credit: 0, 
        description: 'Pembayaran gaji karyawan - Debit Beban Gaji',
        created_by: 'system'
      },
      { 
        transaction_date: new Date('2025-01-25'), 
        account_id: bankAccount.id, 
        debit: 0, 
        credit: 15000000, 
        description: 'Pembayaran gaji karyawan - Credit Bank',
        created_by: 'system'
      },
      
      // Transaksi 4: Bayar listrik
      { 
        transaction_date: new Date('2025-01-30'), 
        account_id: bebanListrik.id, 
        debit: 2000000, 
        credit: 0, 
        description: 'Pembayaran listrik bulan Januari - Debit Beban Listrik',
        created_by: 'system'
      },
      { 
        transaction_date: new Date('2025-01-30'), 
        account_id: kasAccount.id, 
        debit: 0, 
        credit: 2000000, 
        description: 'Pembayaran listrik bulan Januari - Credit Kas',
        created_by: 'system'
      },
    ];

    // Delete existing journal entries untuk clean seed
    const deleted = await prisma.journal_entries.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.count} existing journal entries`);
    
    for (const entry of journalEntries) {
      await prisma.journal_entries.create({ data: entry });
    }
    console.log(`✅ Seeded ${journalEntries.length} Journal Entries\n`);

    console.log('✅ ✅ ✅ Seeding finished! ✅ ✅ ✅\n');
    
    // Show summary
    const coaCount = await prisma.chartOfAccounts.count();
    const journalCount = await prisma.journal_entries.count();
    
    console.log('📊 DATABASE SUMMARY:');
    console.log(`   - Chart of Accounts: ${coaCount}`);
    console.log(`   - Journal Entries: ${journalCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCOAAndJournal()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
