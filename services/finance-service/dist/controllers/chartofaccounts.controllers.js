"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChartOfAccount = exports.updateChartOfAccount = exports.createChartOfAccount = exports.getChartOfAccountById = exports.getChartOfAccounts = void 0;
const prisma_1 = require("../lib/prisma");
// GET - Ambil semua Chart of Accounts
const getChartOfAccounts = async (req, res) => {
    console.log("🔍 getChartOfAccounts called");
    try {
        console.log("🔍 Calling prisma.chartOfAccounts.findMany...");
        const chartOfAccounts = await prisma_1.prisma.chartOfAccounts.findMany({
            select: {
                id: true,
                account_code: true,
                account_name: true,
                account_type: true,
                description: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: { account_code: "asc" },
        });
        console.log(`🔍 Found ${chartOfAccounts.length} accounts`);
        res.status(200).json({
            success: true,
            message: "Daftar Chart of Accounts berhasil diambil dari database",
            data: chartOfAccounts,
        });
    }
    catch (error) {
        console.error("❌ CONTROLLER ERROR:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat mengambil data Chart of Accounts",
            error: errMsg,
        });
    }
};
exports.getChartOfAccounts = getChartOfAccounts;
// GET BY ID - Ambil satu Chart of Account berdasarkan ID
const getChartOfAccountById = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await prisma_1.prisma.chartOfAccounts.findUnique({
            where: { id: parseInt(id) },
        });
        if (!account) {
            res.status(404).json({
                success: false,
                message: "Chart of Account tidak ditemukan",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: account,
        });
    }
    catch (error) {
        console.error("Error mengambil Chart of Account:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: errMsg,
        });
    }
};
exports.getChartOfAccountById = getChartOfAccountById;
// POST - Buat Chart of Account baru
const createChartOfAccount = async (req, res) => {
    try {
        const { account_code, account_name, account_type, description } = req.body;
        // Validasi required fields
        if (!account_code || !account_name || !account_type) {
            res.status(400).json({
                success: false,
                message: "account_code, account_name, dan account_type wajib diisi",
            });
            return;
        }
        // Cek apakah account_code sudah ada
        const existing = await prisma_1.prisma.chartOfAccounts.findUnique({
            where: { account_code },
        });
        if (existing) {
            res.status(409).json({
                success: false,
                message: `Account code ${account_code} sudah digunakan`,
            });
            return;
        }
        const newAccount = await prisma_1.prisma.chartOfAccounts.create({
            data: {
                account_code,
                account_name,
                account_type,
                description: description || null,
            },
        });
        res.status(201).json({
            success: true,
            message: "Chart of Account berhasil dibuat",
            data: newAccount,
        });
    }
    catch (error) {
        console.error("Error membuat Chart of Account:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat membuat Chart of Account",
            error: errMsg,
        });
    }
};
exports.createChartOfAccount = createChartOfAccount;
// PUT - Update Chart of Account
const updateChartOfAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { account_code, account_name, account_type, description } = req.body;
        // Cek apakah account ada
        const existing = await prisma_1.prisma.chartOfAccounts.findUnique({
            where: { id: parseInt(id) },
        });
        if (!existing) {
            res.status(404).json({
                success: false,
                message: "Chart of Account tidak ditemukan",
            });
            return;
        }
        // Jika account_code diubah, cek duplikasi
        if (account_code && account_code !== existing.account_code) {
            const duplicate = await prisma_1.prisma.chartOfAccounts.findUnique({
                where: { account_code },
            });
            if (duplicate) {
                res.status(409).json({
                    success: false,
                    message: `Account code ${account_code} sudah digunakan`,
                });
                return;
            }
        }
        const updatedAccount = await prisma_1.prisma.chartOfAccounts.update({
            where: { id: parseInt(id) },
            data: {
                account_code: account_code || existing.account_code,
                account_name: account_name || existing.account_name,
                account_type: account_type || existing.account_type,
                description: description !== undefined ? description : existing.description,
            },
        });
        res.status(200).json({
            success: true,
            message: "Chart of Account berhasil diupdate",
            data: updatedAccount,
        });
    }
    catch (error) {
        console.error("Error mengupdate Chart of Account:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat mengupdate Chart of Account",
            error: errMsg,
        });
    }
};
exports.updateChartOfAccount = updateChartOfAccount;
// DELETE - Hapus Chart of Account
const deleteChartOfAccount = async (req, res) => {
    try {
        const { id } = req.params;
        // Cek apakah account ada
        const existing = await prisma_1.prisma.chartOfAccounts.findUnique({
            where: { id: parseInt(id) },
        });
        if (!existing) {
            res.status(404).json({
                success: false,
                message: "Chart of Account tidak ditemukan",
            });
            return;
        }
        // Cek apakah ada journal entries yang menggunakan account ini
        const journalCount = await prisma_1.prisma.journal_entries.count({
            where: { account_id: parseInt(id) },
        });
        if (journalCount > 0) {
            res.status(400).json({
                success: false,
                message: `Tidak dapat menghapus account karena masih digunakan di ${journalCount} journal entries`,
            });
            return;
        }
        await prisma_1.prisma.chartOfAccounts.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({
            success: true,
            message: "Chart of Account berhasil dihapus",
        });
    }
    catch (error) {
        console.error("Error menghapus Chart of Account:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat menghapus Chart of Account",
            error: errMsg,
        });
    }
};
exports.deleteChartOfAccount = deleteChartOfAccount;
