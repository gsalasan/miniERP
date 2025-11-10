"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTaxRate = exports.updateTaxRate = exports.createTaxRate = exports.getTaxRateById = exports.getTaxRates = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Controller untuk ambil daftar tax rates
const getTaxRates = async (req, res) => {
    try {
        const taxRates = await prisma.tax_rates.findMany({
            select: {
                id: true,
                tax_name: true,
                rate_percentage: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: { id: "asc" },
        });
        res.status(200).json({
            success: true,
            message: "Daftar Tax Rates berhasil diambil dari database",
            data: taxRates,
        });
    }
    catch (error) {
        console.error("Error mengambil Tax Rates:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat mengambil data Tax Rates",
            error: errMsg,
        });
    }
};
exports.getTaxRates = getTaxRates;
// Controller untuk ambil tax rate berdasarkan ID
const getTaxRateById = async (req, res) => {
    try {
        const { id } = req.params;
        const taxRateId = Number.parseInt(id);
        if (Number.isNaN(taxRateId)) {
            res.status(400).json({
                success: false,
                message: "ID harus berupa angka",
            });
            return;
        }
        const taxRate = await prisma.tax_rates.findUnique({
            where: { id: taxRateId },
            select: {
                id: true,
                tax_name: true,
                rate_percentage: true,
                created_at: true,
                updated_at: true,
            },
        });
        if (!taxRate) {
            res.status(404).json({
                success: false,
                message: "Tax Rate tidak ditemukan",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Tax Rate berhasil diambil dari database",
            data: taxRate,
        });
    }
    catch (error) {
        console.error("Error mengambil Tax Rate:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat mengambil data Tax Rate",
            error: errMsg,
        });
    }
};
exports.getTaxRateById = getTaxRateById;
// Controller untuk membuat tax rate baru
const createTaxRate = async (req, res) => {
    try {
        const { tax_name, rate_percentage } = req.body;
        // Validasi input
        if (!tax_name || rate_percentage === undefined || rate_percentage === null) {
            res.status(400).json({
                success: false,
                message: "Tax name dan rate percentage harus diisi",
            });
            return;
        }
        if (typeof rate_percentage !== 'number' || rate_percentage < 0 || rate_percentage > 100) {
            res.status(400).json({
                success: false,
                message: "Rate percentage harus berupa angka antara 0-100",
            });
            return;
        }
        const newTaxRate = await prisma.tax_rates.create({
            data: {
                tax_name,
                rate_percentage,
            },
            select: {
                id: true,
                tax_name: true,
                rate_percentage: true,
                created_at: true,
                updated_at: true,
            },
        });
        res.status(201).json({
            success: true,
            message: "Tax Rate berhasil dibuat",
            data: newTaxRate,
        });
    }
    catch (error) {
        console.error("Error membuat Tax Rate:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        // Handle unique constraint violation
        if (errMsg.includes('Unique constraint')) {
            res.status(409).json({
                success: false,
                message: "Tax name sudah ada",
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat membuat Tax Rate",
            error: errMsg,
        });
    }
};
exports.createTaxRate = createTaxRate;
// Controller untuk update tax rate
const updateTaxRate = async (req, res) => {
    try {
        const { id } = req.params;
        const { tax_name, rate_percentage } = req.body;
        const taxRateId = Number.parseInt(id);
        if (Number.isNaN(taxRateId)) {
            res.status(400).json({
                success: false,
                message: "ID harus berupa angka",
            });
            return;
        }
        // Validasi input
        if (rate_percentage !== undefined && (typeof rate_percentage !== 'number' || rate_percentage < 0 || rate_percentage > 100)) {
            res.status(400).json({
                success: false,
                message: "Rate percentage harus berupa angka antara 0-100",
            });
            return;
        }
        const updateData = {};
        if (tax_name !== undefined)
            updateData.tax_name = tax_name;
        if (rate_percentage !== undefined)
            updateData.rate_percentage = rate_percentage;
        const updatedTaxRate = await prisma.tax_rates.update({
            where: { id: taxRateId },
            data: updateData,
            select: {
                id: true,
                tax_name: true,
                rate_percentage: true,
                created_at: true,
                updated_at: true,
            },
        });
        res.status(200).json({
            success: true,
            message: "Tax Rate berhasil diupdate",
            data: updatedTaxRate,
        });
    }
    catch (error) {
        console.error("Error update Tax Rate:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        // Handle unique constraint violation
        if (errMsg.includes('Unique constraint')) {
            res.status(409).json({
                success: false,
                message: "Tax name sudah ada",
            });
            return;
        }
        // Handle record not found
        if (errMsg.includes('Record to update not found')) {
            res.status(404).json({
                success: false,
                message: "Tax Rate tidak ditemukan",
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat update Tax Rate",
            error: errMsg,
        });
    }
};
exports.updateTaxRate = updateTaxRate;
// Controller untuk delete tax rate
const deleteTaxRate = async (req, res) => {
    try {
        const { id } = req.params;
        const taxRateId = Number.parseInt(id);
        if (Number.isNaN(taxRateId)) {
            res.status(400).json({
                success: false,
                message: "ID harus berupa angka",
            });
            return;
        }
        await prisma.tax_rates.delete({
            where: { id: taxRateId },
        });
        res.status(200).json({
            success: true,
            message: "Tax Rate berhasil dihapus",
        });
    }
    catch (error) {
        console.error("Error delete Tax Rate:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        // Handle record not found
        if (errMsg.includes('Record to delete does not exist')) {
            res.status(404).json({
                success: false,
                message: "Tax Rate tidak ditemukan",
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat delete Tax Rate",
            error: errMsg,
        });
    }
};
exports.deleteTaxRate = deleteTaxRate;
