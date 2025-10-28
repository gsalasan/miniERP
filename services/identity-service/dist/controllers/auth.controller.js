<<<<<<< HEAD
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
=======
<<<<<<< HEAD
'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
>>>>>>> main
exports.me = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_service_1 = require("../services/auth.service");
const auth_service_2 = require("../services/auth.service");
// REGISTER
const register = async (req, res) => {
    const { email, password, roles, employee_id } = req.body;
    if (!email || !password || !roles) {
        return res.status(400).json({
            success: false,
            message: 'Email, password, dan roles wajib diisi',
        });
    }
    try {
        const existing = await (0, auth_service_2.findUserByEmail)(email);
        if (existing) {
            return res
                .status(400)
                .json({ success: false, message: 'Email sudah terdaftar' });
        }
        // Pastikan roles adalah array
        const rolesArray = Array.isArray(roles) ? roles : [roles];
        const user = await (0, auth_service_2.createUser)(email, password, rolesArray, employee_id);
        return res.status(201).json({
            success: true,
            message: 'User berhasil dibuat',
            data: { id: user.id, email: user.email, roles: user.roles },
        });
    }
    catch (err) {
        return res
            .status(500)
            .json({ success: false, message: 'Gagal register', error: err.message });
    }
<<<<<<< HEAD
=======
    const user = await (0, auth_service_2.createUser)(
      email,
      password,
      role,
      employee_id
    );
    return res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Gagal register', error: err.message });
  }
=======
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_service_1 = require("../services/auth.service");
const auth_service_2 = require("../services/auth.service");
// REGISTER
const register = async (req, res) => {
    const { email, password, roles, employee_id } = req.body;
    if (!email || !password || !roles) {
        return res.status(400).json({
            success: false,
            message: 'Email, password, dan roles wajib diisi',
        });
    }
    try {
        const existing = await (0, auth_service_2.findUserByEmail)(email);
        if (existing) {
            return res
                .status(400)
                .json({ success: false, message: 'Email sudah terdaftar' });
        }
        // Pastikan roles adalah array
        const rolesArray = Array.isArray(roles) ? roles : [roles];
        const user = await (0, auth_service_2.createUser)(email, password, rolesArray, employee_id);
        return res.status(201).json({
            success: true,
            message: 'User berhasil dibuat',
            data: { id: user.id, email: user.email, roles: user.roles },
        });
    }
    catch (err) {
        return res
            .status(500)
            .json({ success: false, message: 'Gagal register', error: err.message });
    }
>>>>>>> main
>>>>>>> main
};
exports.register = register;
// LOGIN
const login = async (req, res) => {
<<<<<<< HEAD
=======
<<<<<<< HEAD
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Email dan password wajib diisi' });
  }
  const user = await (0, auth_service_2.findUserByEmail)(email);
  if (!user)
    return res
      .status(401)
      .json({ success: false, message: 'Email tidak ditemukan' });
  const valid = await bcryptjs_1.default.compare(password, user.password_hash);
  if (!valid)
    return res.status(401).json({ success: false, message: 'Password salah' });
  const token = (0, auth_service_1.generateToken)({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  return res.json({
    success: true,
    message: 'Login berhasil',
    token,
    data: { id: user.id, email: user.email, role: user.role },
  });
=======
>>>>>>> main
    const { email, password } = req.body;
    if (!email || !password) {
        return res
            .status(400)
            .json({ success: false, message: 'Email dan password wajib diisi' });
    }
    const user = await (0, auth_service_2.findUserByEmail)(email);
    if (!user)
        return res
            .status(401)
            .json({ success: false, message: 'Email tidak ditemukan' });
    const valid = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!valid)
        return res.status(401).json({ success: false, message: 'Password salah' });
    const token = (0, auth_service_1.generateToken)({
        id: user.id,
        email: user.email,
        roles: user.roles,
    });
    return res.json({
        success: true,
        message: 'Login berhasil',
        token,
        data: { id: user.id, email: user.email, roles: user.roles },
    });
<<<<<<< HEAD
=======
>>>>>>> main
>>>>>>> main
};
exports.login = login;
// GET /me
const me = async (req, res) => {
<<<<<<< HEAD
    const user = req.user;
    return res.json({ success: true, data: user });
};
exports.me = me;
//# sourceMappingURL=auth.controller.js.map
=======
<<<<<<< HEAD
  const user = req.user;
  return res.json({ success: true, data: user });
};
exports.me = me;
=======
    const user = req.user;
    return res.json({ success: true, data: user });
};
exports.me = me;
//# sourceMappingURL=auth.controller.js.map
>>>>>>> main
>>>>>>> main
