import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

// Cari user berdasarkan email
export const findUserByEmail = async (email: string) => {
  return prisma.users.findUnique({ where: { email } });
};

// Registrasi user baru
export const createUser = async (
  email: string,
  password: string,
  role: UserRole,
  employee_id?: string
) => {
  const password_hash = await bcrypt.hash(password, 10);
  return prisma.users.create({
    data: {
      email,
      password_hash,
      role,
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
      role: user.role,
    },
    process.env.JWT_SECRET as string, // <-- pakai dari .env
    { expiresIn: "8h" } // token berlaku 8 jam
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
