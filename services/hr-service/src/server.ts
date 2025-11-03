import app from './app';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load .env from hr-service directory specifically with override
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

console.log('HR Service DEBUG - Environment variables:');
console.log('process.env.PORT:', process.env.PORT);
console.log('dotenv path:', path.join(__dirname, '..', '.env'));

const PORT = process.env.PORT || 3002;

// Seed minimal data on startup in development if table is empty
const prisma = new PrismaClient();

(async () => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const cnt = await prisma.hr_employees.count();
      console.log('hr_employees count on startup:', cnt);
      if (cnt === 0) {
        console.log('Seeding sample HR employees (development)...');
        const samples = [
          {
            employee_id: 'EMP-001',
            full_name: 'Budi Santoso',
            first_name: 'Budi',
            last_name: 'Santoso',
            email: 'budi.santoso@example.com',
            position: 'Staff HR',
            hire_date: new Date('2024-10-01'),
            basic_salary: '5000000',
            employment_type: 'FULL_TIME',
            status: 'ACTIVE'
          },
          {
            employee_id: 'EMP-002',
            full_name: 'Siti Aminah',
            first_name: 'Siti',
            last_name: 'Aminah',
            email: 'siti.aminah@example.com',
            position: 'Sales Executive',
            hire_date: new Date('2025-01-15'),
            basic_salary: '4500000',
            employment_type: 'FULL_TIME',
            status: 'ACTIVE'
          }
        ];

        for (const s of samples) {
          try {
            // cast to any to avoid strict enum/decimal typing issues in quick dev seeding
            await prisma.hr_employees.create({ data: s as any });
          } catch (err) {
            console.error('Seed insert error (may already exist):', err instanceof Error ? err.message : err);
          }
        }
        console.log('Seeding complete.');
      }
    }
  } catch (err) {
    console.error('Error during startup seed:', err instanceof Error ? err.message : err);
  } finally {
    // start server after seeding attempt
    app.listen(PORT, () => {
      console.log(`HR Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  }
})();
