import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  // TEMPORARY: Bypass auth in development mode
  if (process.env.NODE_ENV === "development") {
    console.log("⚠️  AUTH BYPASSED (Development Mode)");
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Token tidak ditemukan" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET tidak ditemukan di environment");
      return res.status(500).json({ success: false, message: "Konfigurasi server salah" });
    }

    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Token tidak valid" });
  }
};
