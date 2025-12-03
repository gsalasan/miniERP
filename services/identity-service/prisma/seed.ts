import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding users...");

  // Hash password
  const password = "password123";
  const passwordHash = await bcrypt.hash(password, 10);

  // Create dummy employees so employee_id relation is valid
  const emp1 = await prisma.employees.upsert({
    where: { id: "emp-1" },
    update: {},
    create: {
      id: "emp-1",
      full_name: "System Administrator",
      position: "System Admin",
      hire_date: new Date(),
      basic_salary: 0,
      allowances: {},
    },
  });

  const emp2 = await prisma.employees.upsert({
    where: { id: "emp-2" },
    update: {},
    create: {
      id: "emp-2",
      full_name: "HR Admin",
      position: "HR Admin",
      hire_date: new Date(),
      basic_salary: 0,
      allowances: {},
    },
  });

  const emp3 = await prisma.employees.upsert({
    where: { id: "emp-3" },
    update: {},
    create: {
      id: "emp-3",
      full_name: "Regular Employee",
      position: "Staff",
      hire_date: new Date(),
      basic_salary: 0,
      allowances: {},
    },
  });

  // Create Users
  await prisma.users.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      password_hash: passwordHash,
      roles: [UserRole.SYSTEM_ADMIN, UserRole.CEO],
      employee_id: emp1.id,
    },
  });

  await prisma.users.upsert({
    where: { email: "hr@company.com" },
    update: {},
    create: {
      email: "hr@company.com",
      password_hash: passwordHash,
      roles: [UserRole.HR_ADMIN],
      employee_id: emp2.id,
    },
  });

  await prisma.users.upsert({
    where: { email: "employee@company.com" },
    update: {},
    create: {
      email: "employee@company.com",
      password_hash: passwordHash,
      roles: [UserRole.EMPLOYEE],
      employee_id: emp3.id,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });