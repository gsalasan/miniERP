import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
    roles?: string[];
  };
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
      console.error('JWT_SECRET tidak ditemukan di environment');
      return res
        .status(500)
        .json({ success: false, message: 'Konfigurasi server salah' });
    }

    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    
    if (process.env.NODE_ENV === 'development') {
      const d: any = decoded as any;
      console.debug('[authMiddleware] decoded token summary:', {
        id: d?.id || d?.sub || null,
        role: d?.role || null,
        roles: d?.roles || null,
        email: d?.email || null,
      });
    }
    
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ success: false, message: 'Token tidak valid' });
  }
};

export const requireRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    const userRoles = user.roles || (user.role ? [user.role] : []);
    const hasRole = userRoles.some(role => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Insufficient permissions' 
      });
    }

    next();
  };
};
