import { Request, Response, NextFunction } from 'express';
import { verify } from '../utils/jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token' });
  const [, token] = authHeader.split(' ');
  try {
    const payload = verify(token);
    // @ts-ignore
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
