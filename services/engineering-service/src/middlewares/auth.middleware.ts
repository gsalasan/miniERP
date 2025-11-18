import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization ?? '';
  
  if (!authHeader.startsWith('Bearer ')) {
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

    const decoded = jwt.verify(token, secret as jwt.Secret) as any;
    
    // Map token payload to consistent user structure
    (req as Request & { user: any }).user = {
      userId: decoded.id || decoded.userId,
      email: decoded.email,
      name: decoded.name || decoded.email,
      roles: decoded.roles || []
    };
    
    console.log('✅ Token verified for user:', decoded.email, 'with roles:', decoded.roles);
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: 'Token tidak valid' });
  }
};