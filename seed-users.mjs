import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    console.log('🌱 Seeding Users...\n');
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('password123', 10);
    
    // Define seed users
    const seedUsers = [
      {
        email: 'admin@minierp.com',
        password_hash: adminPassword,
        roles: ['SYSTEM_ADMIN', 'CEO'],
        is_active: true
      },
      {
        email: 'finance@minierp.com',
        password_hash: userPassword,
        roles: ['FINANCE_ADMIN'],
        is_active: true
      },
      {
        email: 'hr@minierp.com',
        password_hash: userPassword,
        roles: ['HR_ADMIN'],
        is_active: true
      },
      {
        email: 'sales@minierp.com',
        password_hash: userPassword,
        roles: ['SALES_MANAGER'],
        is_active: true
      },
      {
        email: 'project@minierp.com',
        password_hash: userPassword,
        roles: ['PROJECT_MANAGER'],
        is_active: true
      },
      {
        email: 'employee@minierp.com',
        password_hash: userPassword,
        roles: ['EMPLOYEE'],
        is_active: true
      },
      {
        email: 'procurement@minierp.com',
        password_hash: userPassword,
        roles: ['PROCUREMENT_ADMIN'],
        is_active: true
      }
    ];
    
    // Create users with upsert (update if exists, create if not)
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const userData of seedUsers) {
      const existingUser = await prisma.users.findUnique({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        // Update existing user if needed (but keep existing password if not changed)
        await prisma.users.update({
          where: { email: userData.email },
          data: {
            roles: userData.roles,
            is_active: userData.is_active
          }
        });
        updatedCount++;
        console.log(`   ⚠️  User already exists: ${userData.email} (updated)`);
      } else {
        // Create new user
        await prisma.users.create({
          data: userData
        });
        createdCount++;
        console.log(`   ✅ Created user: ${userData.email} (${userData.roles.join(', ')})`);
      }
    }
    
    console.log(`\n✅ Users seeded successfully!`);
    console.log(`   Created: ${createdCount} users`);
    console.log(`   Updated: ${updatedCount} users`);
    
    // Display login credentials
    console.log('\n📋 Test Login Credentials:');
    console.log('   Admin:');
    console.log('     Email: admin@minierp.com');
    console.log('     Password: admin123');
    console.log('   Other users:');
    console.log('     Password: password123');
    console.log('     (Use emails: finance@minierp.com, hr@minierp.com, etc.)');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();

