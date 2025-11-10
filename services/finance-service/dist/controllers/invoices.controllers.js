"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInvoice = exports.updateInvoice = exports.createInvoice = exports.getInvoiceById = exports.getInvoices = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Controller untuk ambil semua invoices
const getInvoices = async (req, res) => {
    var _a;
    try {
        const { status, customer_name, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build WHERE clause
        const conditions = [];
        if (status) {
            conditions.push(`status = '${status}'`);
        }
        if (customer_name) {
            conditions.push(`customer_name ILIKE '%${customer_name}%'`);
        }
        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        // Get invoices with pagination using raw query
        const invoices = await prisma.$queryRawUnsafe(`SELECT * FROM invoices ${whereClause} ORDER BY invoice_date DESC LIMIT ${limitNum} OFFSET ${skip}`);
        const totalResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM invoices ${whereClause}`);
        const total = ((_a = totalResult[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
        res.status(200).json({
            success: true,
            message: "Daftar Invoice berhasil diambil",
            data: invoices,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        console.error("Error mengambil Invoices:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat mengambil data Invoices",
            error: errMsg,
        });
    }
};
exports.getInvoices = getInvoices;
// Controller untuk ambil invoice berdasarkan ID
const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await prisma.$queryRawUnsafe(`SELECT * FROM invoices WHERE id = '${id}'`);
        if (!invoice || invoice.length === 0) {
            res.status(404).json({
                success: false,
                message: "Invoice tidak ditemukan",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Invoice berhasil diambil",
            data: invoice[0],
        });
    }
    catch (error) {
        console.error("Error mengambil Invoice:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat mengambil data Invoice",
            error: errMsg,
        });
    }
};
exports.getInvoiceById = getInvoiceById;
// Controller untuk create invoice baru
const createInvoice = async (req, res) => {
    try {
        const { invoice_number, invoice_date, due_date, customer_id, customer_name, customer_address, customer_phone, customer_email, subtotal, tax_amount, discount_amount, total_amount, currency, status, notes, payment_terms, created_by } = req.body;
        // Validasi field wajib
        if (!invoice_number || !invoice_date || !due_date || !customer_name || !subtotal || !total_amount) {
            res.status(400).json({
                success: false,
                message: "Field wajib: invoice_number, invoice_date, due_date, customer_name, subtotal, total_amount",
            });
            return;
        }
        // Cek apakah invoice_number sudah ada
        const existingInvoice = await prisma.$queryRawUnsafe(`SELECT * FROM invoices WHERE invoice_number = '${invoice_number}'`);
        if (existingInvoice && existingInvoice.length > 0) {
            res.status(409).json({
                success: false,
                message: "Invoice number sudah digunakan",
            });
            return;
        }
        // Create invoice using raw query
        const newInvoice = await prisma.$queryRawUnsafe(`
      INSERT INTO invoices (
        id, invoice_number, invoice_date, due_date, customer_id, customer_name,
        customer_address, customer_phone, customer_email, subtotal,
        tax_amount, discount_amount, total_amount, currency, status,
        notes, payment_terms, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        '${invoice_number}',
        '${new Date(invoice_date).toISOString()}',
        '${new Date(due_date).toISOString()}',
        ${customer_id ? `'${customer_id}'` : 'NULL'},
        '${customer_name}',
        ${customer_address ? `'${customer_address}'` : 'NULL'},
        ${customer_phone ? `'${customer_phone}'` : 'NULL'},
        ${customer_email ? `'${customer_email}'` : 'NULL'},
        ${subtotal},
        ${tax_amount || 0},
        ${discount_amount || 0},
        ${total_amount},
        '${currency || 'IDR'}',
        '${status || 'DRAFT'}',
        ${notes ? `'${notes}'` : 'NULL'},
        ${payment_terms ? `'${payment_terms}'` : 'NULL'},
        ${created_by ? `'${created_by}'` : 'NULL'},
        NOW(),
        NOW()
      )
      RETURNING *
    `);
        res.status(201).json({
            success: true,
            message: "Invoice berhasil dibuat",
            data: newInvoice[0],
        });
    }
    catch (error) {
        console.error("Error membuat Invoice:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat membuat Invoice",
            error: errMsg,
        });
    }
};
exports.createInvoice = createInvoice;
// Controller untuk update invoice
const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { invoice_date, due_date, customer_id, customer_name, customer_address, customer_phone, customer_email, subtotal, tax_amount, discount_amount, total_amount, currency, status, notes, payment_terms, updated_by } = req.body;
        // Cek apakah invoice ada
        const existingInvoice = await prisma.$queryRawUnsafe(`SELECT * FROM invoices WHERE id = '${id}'`);
        if (!existingInvoice || existingInvoice.length === 0) {
            res.status(404).json({
                success: false,
                message: "Invoice tidak ditemukan",
            });
            return;
        }
        // Build UPDATE query dynamically
        const updateFields = [];
        if (invoice_date)
            updateFields.push(`invoice_date = '${new Date(invoice_date).toISOString()}'`);
        if (due_date)
            updateFields.push(`due_date = '${new Date(due_date).toISOString()}'`);
        if (customer_id !== undefined)
            updateFields.push(`customer_id = ${customer_id ? `'${customer_id}'` : 'NULL'}`);
        if (customer_name)
            updateFields.push(`customer_name = '${customer_name}'`);
        if (customer_address !== undefined)
            updateFields.push(`customer_address = ${customer_address ? `'${customer_address}'` : 'NULL'}`);
        if (customer_phone !== undefined)
            updateFields.push(`customer_phone = ${customer_phone ? `'${customer_phone}'` : 'NULL'}`);
        if (customer_email !== undefined)
            updateFields.push(`customer_email = ${customer_email ? `'${customer_email}'` : 'NULL'}`);
        if (subtotal !== undefined)
            updateFields.push(`subtotal = ${subtotal}`);
        if (tax_amount !== undefined)
            updateFields.push(`tax_amount = ${tax_amount}`);
        if (discount_amount !== undefined)
            updateFields.push(`discount_amount = ${discount_amount}`);
        if (total_amount !== undefined)
            updateFields.push(`total_amount = ${total_amount}`);
        if (currency)
            updateFields.push(`currency = '${currency}'`);
        if (status)
            updateFields.push(`status = '${status}'`);
        if (notes !== undefined)
            updateFields.push(`notes = ${notes ? `'${notes}'` : 'NULL'}`);
        if (payment_terms !== undefined)
            updateFields.push(`payment_terms = ${payment_terms ? `'${payment_terms}'` : 'NULL'}`);
        if (updated_by)
            updateFields.push(`updated_by = '${updated_by}'`);
        updateFields.push(`updated_at = NOW()`);
        if (updateFields.length === 0) {
            res.status(400).json({
                success: false,
                message: "Tidak ada field yang diupdate",
            });
            return;
        }
        // Update invoice using raw query
        const updatedInvoice = await prisma.$queryRawUnsafe(`
      UPDATE invoices
      SET ${updateFields.join(', ')}
      WHERE id = '${id}'
      RETURNING *
    `);
        res.status(200).json({
            success: true,
            message: "Invoice berhasil diupdate",
            data: updatedInvoice[0],
        });
    }
    catch (error) {
        console.error("Error update Invoice:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat update Invoice",
            error: errMsg,
        });
    }
};
exports.updateInvoice = updateInvoice;
// Controller untuk delete invoice
const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        // Cek apakah invoice ada
        const existingInvoice = await prisma.$queryRawUnsafe(`SELECT * FROM invoices WHERE id = '${id}'`);
        if (!existingInvoice || existingInvoice.length === 0) {
            res.status(404).json({
                success: false,
                message: "Invoice tidak ditemukan",
            });
            return;
        }
        // Delete invoice using raw query
        await prisma.$queryRawUnsafe(`DELETE FROM invoices WHERE id = '${id}'`);
        res.status(200).json({
            success: true,
            message: "Invoice berhasil dihapus",
        });
    }
    catch (error) {
        console.error("Error delete Invoice:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat menghapus Invoice",
            error: errMsg,
        });
    }
};
exports.deleteInvoice = deleteInvoice;
