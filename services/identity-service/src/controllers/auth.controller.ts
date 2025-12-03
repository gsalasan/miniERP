
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../services/auth.service';
import { findUserByEmail, createUser, getAllUsers, updateUserById, deleteUserById } from '../services/auth.service';
// UPDATE USER
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, roles, is_active } = req.body;
  try {
    const updated = await updateUserById(id, { email, roles, is_active });
    if (!updated) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Gagal update user', error: err.message });
  }
};

// DELETE USER
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await deleteUserById(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    return res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Gagal hapus user', error: err.message });
  }
};
// GET ALL USERS
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    return res.json({ success: true, data: users });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil data users', error: err.message });
  }
};


// REGISTER
export const register = async (req: Request, res: Response) => {
  const { email, password, roles } = req.body;

  if (!email || !password || !roles) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, dan roles wajib diisi',
    });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: 'Email sudah terdaftar' });
    }

    // Pastikan roles adalah array
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    const user = await createUser(email, password, rolesArray);

    return res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: { id: user.id, email: user.email, roles: user.roles },
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: 'Gagal register', error: err.message });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Email dan password wajib diisi' });
  }

  const user = await findUserByEmail(email);
  if (!user)
    return res
      .status(401)
      .json({ success: false, message: 'Email tidak ditemukan' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid)
    return res.status(401).json({ success: false, message: 'Password salah' });

  const token = generateToken({
    id: user.id,
    email: user.email,
    roles: user.roles,
    employee_id: user.employee_id,
  });

  return res.json({
    success: true,
    message: 'Login berhasil',
    token,
    data: { 
      id: user.id, 
      email: user.email, 
      roles: user.roles,
      employee_id: user.employee_id 
    },
  });
};

// GET /me
export const me = async (req: Request, res: Response) => {
  const user = (req as any).user;
  return res.json({ success: true, data: user });
};
