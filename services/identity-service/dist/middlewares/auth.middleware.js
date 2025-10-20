'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require('jsonwebtoken'));
const verifyToken = (req, res, next) => {
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
    const decoded = jsonwebtoken_1.default.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ success: false, message: 'Token tidak valid' });
  }
};
exports.verifyToken = verifyToken;
