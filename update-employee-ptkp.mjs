import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateEmployeePTKP() {
  try {
    console.log('🔄 Updating employee PTKP data...');

    // Get all employees
    const employees = await prisma.employees.findMany({
      select: {
        id: true,
        full_name: true,
        ptkp: true,
        bank_name: true,
        bank_account_number: true,
        npwp: true,
      }
    });

    console.log(`Found ${employees.length} employees`);

    // Update each employee with sample data if missing
    for (const emp of employees) {
      const updates = {};
      
      // Add PTKP if missing
      if (!emp.ptkp) {
        updates.ptkp = 'TK/0'; // Default PTKP for unmarried without dependents
      }
      
      // Add bank info if missing
      if (!emp.bank_name) {
        updates.bank_name = 'Bank Mandiri';
      }
      
      if (!emp.bank_account_number) {
        updates.bank_account_number = '1234567890' + Math.floor(Math.random() * 100);
      }
      
      // Add NPWP if missing
      if (!emp.npwp) {
        // Generate sample NPWP format: 12.345.678.9-012.345
        const npwp = `${Math.floor(10 + Math.random() * 90)}.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}.${Math.floor(1 + Math.random() * 9)}-${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}`;
        updates.npwp = npwp;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.employees.update({
          where: { id: emp.id },
          data: updates
        });
        console.log(`✅ Updated ${emp.full_name}:`, updates);
      } else {
        console.log(`⏭️  ${emp.full_name} already has complete data`);
      }
    }

    console.log('\n✨ All employees updated successfully!');
    
    // Show final data
    const updated = await prisma.employees.findMany({
      select: {
        full_name: true,
        ptkp: true,
        bank_name: true,
        bank_account_number: true,
        npwp: true,
      }
    });
    
    console.log('\n📊 Final employee data:');
    console.table(updated);

  } catch (error) {
    console.error('❌ Error updating employees:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEmployeePTKP();
