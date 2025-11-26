import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking hr_permission_requests table...\n');
  
  const permissions = await prisma.hr_permission_requests.findMany({
    select: {
      id: true,
      employee_id: true,
      permission_type: true,
      status: true,
      reason: true,
      created_at: true,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 10,
  });

  console.log('Found permissions:');
  console.table(permissions);
  
  if (permissions.length === 0) {
    console.log('\n⚠️  No permissions found! Create one first using POST endpoint.');
  } else {
    console.log('\n✅ Use one of these IDs to test approve/reject:');
    permissions.forEach(p => {
      console.log(`   - ${p.id} (${p.status})`);
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
