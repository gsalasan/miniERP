import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✓ Database connected');
    
    // Count projects
    const projectCount = await prisma.project.count();
    console.log(`✓ Projects in database: ${projectCount}`);
    
    // Try to fetch projects (same as API does)
    const projects = await prisma.project.findMany({
      include: {
        customer: true,
        pm_user: {
          include: {
            employee: true,
          },
        },
        sales_user: {
          include: {
            employee: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    
    console.log(`✓ Fetched ${projects.length} projects successfully`);
    
    if (projects.length > 0) {
      console.log('\nFirst project:');
      console.log(`  ID: ${projects[0].id}`);
      console.log(`  Name: ${projects[0].project_name}`);
      console.log(`  Status: ${projects[0].status}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
