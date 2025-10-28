import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('🌱 Seeding Tax Rates...');
    
    await prisma.taxRates.createMany({
      data: [
        {
          tax_name: 'PPN',
          tax_code: 'PPN-11',
          rate: 11.00,
          description: 'Pajak Pertambahan Nilai 11%',
          is_active: true
        },
        {
          tax_name: 'PPh 21',
          tax_code: 'PPH21',
          rate: 5.00,
          description: 'Pajak Penghasilan Pasal 21',
          is_active: true
        },
        {
          tax_name: 'PPh 23',
          tax_code: 'PPH23',
          rate: 2.00,
          description: 'Pajak Penghasilan Pasal 23',
          is_active: true
        }
      ],
      skipDuplicates: true
    });
    
    console.log('✅ Tax Rates seeded!');
    
    console.log('🌱 Seeding Exchange Rates...');
    
    await prisma.exchangeRates.createMany({
      data: [
        {
          currency_from: 'USD',
          currency_to: 'IDR',
          rate: 15750.50,
          effective_date: new Date('2025-10-24'),
          is_active: true
        },
        {
          currency_from: 'EUR',
          currency_to: 'IDR',
          rate: 17250.75,
          effective_date: new Date('2025-10-24'),
          is_active: true
        },
        {
          currency_from: 'SGD',
          currency_to: 'IDR',
          rate: 11680.25,
          effective_date: new Date('2025-10-24'),
          is_active: true
        }
      ],
      skipDuplicates: true
    });
    
    console.log('✅ Exchange Rates seeded!');
    console.log('\n🎉 All data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();
