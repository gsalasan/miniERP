import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
<<<<<<< HEAD
import { PrismaClient } from '@prisma/client';

// UserRole type definition matching the database enum
type UserRole = 'CEO' | 'FINANCE_ADMIN' | 'SALES' | 'SALES_MANAGER' | 'PROJECT_MANAGER' | 'PROJECT_ENGINEER' | 'HR_ADMIN' | 'EMPLOYEE' | 'PROCUREMENT_ADMIN' | 'ASSET_ADMIN' | 'SYSTEM_ADMIN';
=======
>>>>>>> main

// UserRole type definition matching the database enum
type UserRole = 'CEO' | 'FINANCE_ADMIN' | 'SALES' | 'SALES_MANAGER' | 'PROJECT_MANAGER' | 'PROJECT_ENGINEER' | 'HR_ADMIN' | 'EMPLOYEE' | 'PROCUREMENT_ADMIN' | 'ASSET_ADMIN' | 'SYSTEM_ADMIN';

// Initialize Prisma Client with error handling
let prismaClient: any = null;

const initializePrisma = () => {
  if (!prismaClient) {
    try {
      // Try different import paths
      const { PrismaClient } = require('@prisma/client');
      prismaClient = new PrismaClient();
      console.log('Prisma client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Prisma client:', error);
      console.log('Falling back to mock data (temporary)');
    }
  }
  return prismaClient;
};

// Temporary fallback data
const mockUsers: Array<{
  id: string;
  email: string;
  password_hash: string;
  roles: UserRole[];
  employee_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}> = [];

// Cari user berdasarkan email
export const findUserByEmail = async (email: string): Promise<any> => {
  const prisma = initializePrisma();
  
  if (prisma) {
    try {
      const user = await prisma.users.findUnique({
        where: { email }
      });
      console.log(`Database query for email ${email}:`, user ? 'Found' : 'Not found');
      return user;
    } catch (error) {
      console.error('Database error finding user:', error);
      // Fall back to mock if database fails
    }
  }
  
  // Fallback to mock data
  console.log(`Fallback: searching mock data for email ${email}`);
  const user = mockUsers.find(user => user.email === email) || null;
  console.log(`Mock data result:`, user ? 'Found' : 'Not found');
  return user;
};

// Registrasi user baru
export const createUser = async (
  email: string,
  password: string,
  roles: UserRole[],
  employee_id?: string
): Promise<any> => {
  const prisma = initializePrisma();
  const password_hash = await bcrypt.hash(password, 10);
<<<<<<< HEAD
  return prisma.users.create({
    data: {
      email,
      password_hash,
      roles: roles.length > 0 ? roles : ['EMPLOYEE'],
      employee_id: employee_id || null,
      is_active: true,
    },
  });
=======
  
  if (prisma) {
    try {
      const newUser = await prisma.users.create({
        data: {
          email,
          password_hash,
          roles: roles.length > 0 ? roles : ['EMPLOYEE' as UserRole],
          employee_id: employee_id || null,
          is_active: true,
        },
      });
      console.log(`User created in database:`, newUser.email);
      return newUser;
    } catch (error) {
      console.error('Database error creating user:', error);
      throw error;
    }
  }
  
  // Fallback to mock data
  console.log(`Fallback: creating user in mock data`);
  const newUser = {
    id: `user_${Date.now()}`,
    email,
    password_hash,
    roles: roles.length > 0 ? roles : ['EMPLOYEE' as UserRole],
    employee_id: employee_id || undefined,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  mockUsers.push(newUser);
  console.log(`User created in mock data:`, newUser.email);
  return newUser;
>>>>>>> main
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
  try {
    const user = await findUserByEmail(email);
    if (!user) return null;

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return null;

    const token = generateToken(user);
    return { user, token };
  } catch (error) {
    console.error('Error during login:', error);
    return null;
  }
};

// Clean up Prisma connection on app shutdown
export const disconnectPrisma = async (): Promise<void> => {
  const prisma = initializePrisma();
  if (prisma && prisma.$disconnect) {
    try {
      await prisma.$disconnect();
      console.log('Prisma disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting Prisma:', error);
    }
  }
};