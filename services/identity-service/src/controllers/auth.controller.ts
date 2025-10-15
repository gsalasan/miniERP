import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../utils/jwt";

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user)
      return res.status(401).json({ message: "Email tidak ditemukan" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Password salah" });

    const token = generateToken({ id: user.id, role: user.role });
    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ error: "Gagal login", details: err });
  }
}; // ✅ Tutup fungsi login dengan benar di sini

// 🧩 Deklarasi tambahan agar req.user dikenali TypeScript
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

// ✅ Fungsi GET PROFILE
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: (req as any).user.id },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error });
  }
};
