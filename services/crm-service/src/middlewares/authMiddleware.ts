import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ success: false, message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET tidak ditemukan di environment');
      return res
        .status(500)
        .json({ success: false, message: 'Konfigurasi server salah' });
    }

    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    // Development-only debug: log minimal decoded token info to help diagnose auth/role issues
    try {
      if (process.env.NODE_ENV === 'development') {
        const d: any = decoded as any;
        console.debug('[authMiddleware] decoded token summary:', {
          id: d?.id || d?.sub || null,
          role: d?.role || null,
          roles: d?.roles || null,
          email: d?.email || null,
        });
      }
    } catch (e) {
      // ignore logging errors
    }
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ success: false, message: 'Token tidak valid' });
  }
};