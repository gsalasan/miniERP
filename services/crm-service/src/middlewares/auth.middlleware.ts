import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface CustomRequest extends Request {
  user?: unknown;
}

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
      // eslint-disable-next-line no-console
      console.error('JWT_SECRET tidak ditemukan di environment');
      return res
        .status(500)
        .json({ success: false, message: 'Konfigurasi server salah' });
    }

    const decoded = jwt.verify(token, secret) as unknown;
    const reqWithUser = req as CustomRequest;
    reqWithUser.user = decoded;
    next();
  } catch (_err: unknown) {
    // eslint-disable-next-line no-console
    console.error('Token verification error:', _err);
    return res
      .status(403)
      .json({ success: false, message: 'Token tidak valid' });
  }
};
