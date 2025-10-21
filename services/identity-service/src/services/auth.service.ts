import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// UserRole type definition matching the database enum
type UserRole = 'CEO' | 'FINANCE_ADMIN' | 'SALES' | 'SALES_MANAGER' | 'PROJECT_MANAGER' | 'PROJECT_ENGINEER' | 'HR_ADMIN' | 'EMPLOYEE' | 'PROCUREMENT_ADMIN' | 'ASSET_ADMIN' | 'SYSTEM_ADMIN';

const prisma = new PrismaClient();

// Cari user berdasarkan email
export const findUserByEmail = async (email: string) => {
  return prisma.users.findUnique({ where: { email } });
};

// Registrasi user baru
export const createUser = async (
  email: string,
  password: string,
  roles: UserRole[],
  employee_id?: string
) => {
  const password_hash = await bcrypt.hash(password, 10);
  return prisma.users.create({
    data: {
      email,
      password_hash,
      roles: roles.length > 0 ? roles : ['EMPLOYEE'],
      employee_id: employee_id || null,
      is_active: true,
    },
  });
};

// ✅ Generate JWT Token
export const generateToken = (user: any) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      roles: user.roles,
    },
    process.env.JWT_SECRET as string, // <-- pakai dari .env
    { expiresIn: '8h' } // token berlaku 8 jam
  );
};

// ✅ Login Service
export const loginUser = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) return null;

  const token = generateToken(user);
  return { user, token };
};
