"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateExchangeRates = exports.deleteExchangeRate = exports.updateExchangeRate = exports.createExchangeRate = exports.getExchangeRateByCode = exports.getExchangeRates = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Controller untuk ambil daftar exchange rates
const getExchangeRates = async (req, res) => {
    try {
        const exchangeRates = await prisma.exchange_rates.findMany({
            select: {
                currency_code: true,
                rate_to_idr: true,
                updated_at: true,
            },
            orderBy: { currency_code: "asc" },
        });
        res.status(200).json({
            success: true,
            message: "Daftar Exchange Rates berhasil diambil dari database",
            data: exchangeRates,
        });
    }
    catch (error) {
        console.error("Error mengambil Exchange Rates:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat mengambil data Exchange Rates",
            error: errMsg,
        });
    }
};
exports.getExchangeRates = getExchangeRates;
// Controller untuk ambil exchange rate berdasarkan currency code
const getExchangeRateByCode = async (req, res) => {
    try {
        const { currency_code } = req.params;
        if (!currency_code || currency_code.length !== 3) {
            res.status(400).json({
                success: false,
                message: "Currency code harus berupa 3 karakter",
            });
            return;
        }
        const exchangeRate = await prisma.exchange_rates.findUnique({
            where: { currency_code: currency_code.toUpperCase() },
            select: {
                currency_code: true,
                rate_to_idr: true,
                updated_at: true,
            },
        });
        if (!exchangeRate) {
            res.status(404).json({
                success: false,
                message: "Exchange Rate tidak ditemukan",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Exchange Rate berhasil diambil dari database",
            data: exchangeRate,
        });
    }
    catch (error) {
        console.error("Error mengambil Exchange Rate:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat mengambil data Exchange Rate",
            error: errMsg,
        });
    }
};
exports.getExchangeRateByCode = getExchangeRateByCode;
// Controller untuk membuat exchange rate baru
const createExchangeRate = async (req, res) => {
    try {
        const { currency_code, rate_to_idr } = req.body;
        // Validasi input
        if (!currency_code || rate_to_idr === undefined || rate_to_idr === null) {
            res.status(400).json({
                success: false,
                message: "Currency code dan rate to IDR harus diisi",
            });
            return;
        }
        if (currency_code.length !== 3) {
            res.status(400).json({
                success: false,
                message: "Currency code harus berupa 3 karakter",
            });
            return;
        }
        if (typeof rate_to_idr !== 'number' || rate_to_idr <= 0) {
            res.status(400).json({
                success: false,
                message: "Rate to IDR harus berupa angka positif",
            });
            return;
        }
        const newExchangeRate = await prisma.exchange_rates.create({
            data: {
                currency_code: currency_code.toUpperCase(),
                rate_to_idr,
            },
            select: {
                currency_code: true,
                rate_to_idr: true,
                updated_at: true,
            },
        });
        res.status(201).json({
            success: true,
            message: "Exchange Rate berhasil dibuat",
            data: newExchangeRate,
        });
    }
    catch (error) {
        console.error("Error membuat Exchange Rate:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        // Handle unique constraint violation
        if (errMsg.includes('Unique constraint')) {
            res.status(409).json({
                success: false,
                message: "Currency code sudah ada",
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat membuat Exchange Rate",
            error: errMsg,
        });
    }
};
exports.createExchangeRate = createExchangeRate;
// Controller untuk update exchange rate
const updateExchangeRate = async (req, res) => {
    try {
        const { currency_code } = req.params;
        const { rate_to_idr } = req.body;
        if (!currency_code || currency_code.length !== 3) {
            res.status(400).json({
                success: false,
                message: "Currency code harus berupa 3 karakter",
            });
            return;
        }
        // Validasi input
        if (rate_to_idr !== undefined && (typeof rate_to_idr !== 'number' || rate_to_idr <= 0)) {
            res.status(400).json({
                success: false,
                message: "Rate to IDR harus berupa angka positif",
            });
            return;
        }
        const updateData = {};
        if (rate_to_idr !== undefined)
            updateData.rate_to_idr = rate_to_idr;
        const updatedExchangeRate = await prisma.exchange_rates.update({
            where: { currency_code: currency_code.toUpperCase() },
            data: updateData,
            select: {
                currency_code: true,
                rate_to_idr: true,
                updated_at: true,
            },
        });
        res.status(200).json({
            success: true,
            message: "Exchange Rate berhasil diupdate",
            data: updatedExchangeRate,
        });
    }
    catch (error) {
        console.error("Error update Exchange Rate:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        // Handle record not found
        if (errMsg.includes('Record to update not found')) {
            res.status(404).json({
                success: false,
                message: "Exchange Rate tidak ditemukan",
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat update Exchange Rate",
            error: errMsg,
        });
    }
};
exports.updateExchangeRate = updateExchangeRate;
// Controller untuk delete exchange rate
const deleteExchangeRate = async (req, res) => {
    try {
        const { currency_code } = req.params;
        if (!currency_code || currency_code.length !== 3) {
            res.status(400).json({
                success: false,
                message: "Currency code harus berupa 3 karakter",
            });
            return;
        }
        await prisma.exchange_rates.delete({
            where: { currency_code: currency_code.toUpperCase() },
        });
        res.status(200).json({
            success: true,
            message: "Exchange Rate berhasil dihapus",
        });
    }
    catch (error) {
        console.error("Error delete Exchange Rate:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        // Handle record not found
        if (errMsg.includes('Record to delete does not exist')) {
            res.status(404).json({
                success: false,
                message: "Exchange Rate tidak ditemukan",
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat delete Exchange Rate",
            error: errMsg,
        });
    }
};
exports.deleteExchangeRate = deleteExchangeRate;
// Controller untuk bulk update exchange rates
const bulkUpdateExchangeRates = async (req, res) => {
    try {
        const { rates } = req.body;
        if (!Array.isArray(rates) || rates.length === 0) {
            res.status(400).json({
                success: false,
                message: "Rates harus berupa array yang tidak kosong",
            });
            return;
        }
        // Validasi setiap rate
        for (const rate of rates) {
            if (!rate.currency_code || rate.currency_code.length !== 3) {
                res.status(400).json({
                    success: false,
                    message: "Currency code harus berupa 3 karakter",
                });
                return;
            }
            if (typeof rate.rate_to_idr !== 'number' || rate.rate_to_idr <= 0) {
                res.status(400).json({
                    success: false,
                    message: "Rate to IDR harus berupa angka positif",
                });
                return;
            }
        }
        // Update atau create setiap rate
        const results = [];
        for (const rate of rates) {
            const result = await prisma.exchange_rates.upsert({
                where: { currency_code: rate.currency_code.toUpperCase() },
                update: { rate_to_idr: rate.rate_to_idr },
                create: {
                    currency_code: rate.currency_code.toUpperCase(),
                    rate_to_idr: rate.rate_to_idr,
                },
                select: {
                    currency_code: true,
                    rate_to_idr: true,
                    updated_at: true,
                },
            });
            results.push(result);
        }
        res.status(200).json({
            success: true,
            message: "Exchange Rates berhasil diupdate secara bulk",
            data: results,
        });
    }
    catch (error) {
        console.error("Error bulk update Exchange Rates:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat bulk update Exchange Rates",
            error: errMsg,
        });
    }
};
exports.bulkUpdateExchangeRates = bulkUpdateExchangeRates;
