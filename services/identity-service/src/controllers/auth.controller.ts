import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { generateToken } from "../services/auth.service";
import { findUserByEmail, createUser } from "../services/auth.service";

// REGISTER
export const register = async (req: Request, res: Response) => {
  const { email, password, role, employee_id } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ success: false, message: "Email, password, dan role wajib diisi" });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: "Email sudah terdaftar" });
    }

    const user = await createUser(email, password, role, employee_id);

    return res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Gagal register", error: err.message });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email dan password wajib diisi" });
  }

  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ success: false, message: "Email tidak ditemukan" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ success: false, message: "Password salah" });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return res.json({
    success: true,
    message: "Login berhasil",
    token,
    data: { id: user.id, email: user.email, role: user.role },
  });
};

// GET /me
export const me = async (req: Request, res: Response) => {
  const user = (req as any).user;
  return res.json({ success: true, data: user });
};
