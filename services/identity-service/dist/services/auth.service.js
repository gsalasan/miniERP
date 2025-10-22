'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.loginUser =
  exports.generateToken =
  exports.createUser =
  exports.findUserByEmail =
    void 0;
const bcryptjs_1 = __importDefault(require('bcryptjs'));
const jsonwebtoken_1 = __importDefault(require('jsonwebtoken'));
const client_1 = require('@prisma/client');
const prisma = new client_1.PrismaClient();
// Cari user berdasarkan email
const findUserByEmail = async email => {
  return prisma.users.findUnique({ where: { email } });
};
exports.findUserByEmail = findUserByEmail;
// Registrasi user baru
const createUser = async (email, password, role, employee_id) => {
  const password_hash = await bcryptjs_1.default.hash(password, 10);
  return prisma.users.create({
    data: {
      email,
      password_hash,
      role,
      employee_id: employee_id || null,
      is_active: true,
    },
  });
};
exports.createUser = createUser;
// ✅ Generate JWT Token
const generateToken = user => {
  return jsonwebtoken_1.default.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET, // <-- pakai dari .env
    { expiresIn: '8h' } // token berlaku 8 jam
  );
};
exports.generateToken = generateToken;
// ✅ Login Service
const loginUser = async (email, password) => {
  const user = await (0, exports.findUserByEmail)(email);
  if (!user) return null;
  const validPassword = await bcryptjs_1.default.compare(
    password,
    user.password_hash
  );
  if (!validPassword) return null;
  const token = (0, exports.generateToken)(user);
  return { user, token };
};
exports.loginUser = loginUser;
