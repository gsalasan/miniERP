"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectPrisma = exports.loginUser = exports.generateToken = exports.createUser = exports.findUserByEmail = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Initialize Prisma Client with error handling
let prismaClient = null;
const initializePrisma = () => {
    if (!prismaClient) {
        try {
            // Try different import paths
            const { PrismaClient } = require('@prisma/client');
            prismaClient = new PrismaClient();
            console.log('Prisma client initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Prisma client:', error);
            console.log('Falling back to mock data (temporary)');
        }
    }
    return prismaClient;
};
// Temporary fallback data
const mockUsers = [];
// Cari user berdasarkan email
const findUserByEmail = async (email) => {
    const prisma = initializePrisma();
    if (prisma) {
        try {
            const user = await prisma.users.findUnique({
                where: { email }
            });
            console.log(`Database query for email ${email}:`, user ? 'Found' : 'Not found');
            return user;
        }
        catch (error) {
            console.error('Database error finding user:', error);
            // Fall back to mock if database fails
        }
    }
    // Fallback to mock data
    console.log(`Fallback: searching mock data for email ${email}`);
    const user = mockUsers.find(user => user.email === email) || null;
    console.log(`Mock data result:`, user ? 'Found' : 'Not found');
    return user;
};
exports.findUserByEmail = findUserByEmail;
// Registrasi user baru
const createUser = async (email, password, roles, employee_id) => {
    const prisma = initializePrisma();
    const password_hash = await bcryptjs_1.default.hash(password, 10);
    if (prisma) {
        try {
            const newUser = await prisma.users.create({
                data: {
                    email,
                    password_hash,
                    roles: roles.length > 0 ? roles : ['EMPLOYEE'],
                    employee_id: employee_id || null,
                    is_active: true,
                },
            });
            console.log(`User created in database:`, newUser.email);
            return newUser;
        }
        catch (error) {
            console.error('Database error creating user:', error);
            throw error;
        }
    }
    // Fallback to mock data
    console.log(`Fallback: creating user in mock data`);
    const newUser = {
        id: `user_${Date.now()}`,
        email,
        password_hash,
        roles: roles.length > 0 ? roles : ['EMPLOYEE'],
        employee_id: employee_id || undefined,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
    };
    mockUsers.push(newUser);
    console.log(`User created in mock data:`, newUser.email);
    return newUser;
};
exports.createUser = createUser;
// ✅ Generate JWT Token
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        roles: user.roles,
    }, process.env.JWT_SECRET, // <-- pakai dari .env
    { expiresIn: '8h' } // token berlaku 8 jam
    );
};
exports.generateToken = generateToken;
// ✅ Login Service
const loginUser = async (email, password) => {
    try {
        const user = await (0, exports.findUserByEmail)(email);
        if (!user)
            return null;
        const validPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!validPassword)
            return null;
        const token = (0, exports.generateToken)(user);
        return { user, token };
    }
    catch (error) {
        console.error('Error during login:', error);
        return null;
    }
};
exports.loginUser = loginUser;
// Clean up Prisma connection on app shutdown
const disconnectPrisma = async () => {
    const prisma = initializePrisma();
    if (prisma && prisma.$disconnect) {
        try {
            await prisma.$disconnect();
            console.log('Prisma disconnected successfully');
        }
        catch (error) {
            console.error('Error disconnecting Prisma:', error);
        }
    }
};
exports.disconnectPrisma = disconnectPrisma;
//# sourceMappingURL=auth.service.js.map