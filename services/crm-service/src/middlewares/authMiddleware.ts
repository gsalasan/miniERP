import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface CustomRequest extends Request {
  user?: any;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Fallback to default for local dev to avoid 500s when .env missing
    const secret = process.env.JWT_SECRET || 'minierpsecret';

    const decoded = jwt.verify(token, secret) as any;
    const reqWithUser = req as CustomRequest;
    reqWithUser.user = decoded;

    // Helpful development debug (safe: only prints minimal token info)
    try {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[authMiddleware] decoded token summary:', {
          id: decoded?.id ?? decoded?.sub ?? null,
          role: decoded?.role ?? null,
          roles: decoded?.roles ?? null,
          email: decoded?.email ?? null,
        });
      }
    } catch (e) {
      // ignore logging errors
    }

    next();
  } catch (err: any) {
    console.error('Token verification error:', err?.message || err);
    return res.status(403).json({ success: false, message: 'Token tidak valid' });
  }
};
