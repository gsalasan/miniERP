<<<<<<< HEAD
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Token tidak ditemukan" });
  }

  const token = authHeader.split(" ")[1];
=======
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TEMPORARY: Skip authentication for development/testing
  // TODO: Re-enable authentication once cross-app navigation is working
  console.log('🔓 Bypassing authentication for development');
  next();
  return;

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ success: false, message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
>>>>>>> main

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
<<<<<<< HEAD
      console.error("JWT_SECRET tidak ditemukan di environment");
      return res.status(500).json({ success: false, message: "Konfigurasi server salah" });
    }

    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Token tidak valid" });
=======
      console.error('JWT_SECRET tidak ditemukan di environment');
      return res
        .status(500)
        .json({ success: false, message: 'Konfigurasi server salah' });
    }

    const decoded = jwt.verify(token, secret);
    (req as Request & { user: jwt.JwtPayload | string }).user = decoded;
    next();
  } catch {
    return res
      .status(403)
      .json({ success: false, message: 'Token tidak valid' });
>>>>>>> main
  }
};
