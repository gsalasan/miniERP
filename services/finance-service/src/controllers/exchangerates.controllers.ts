import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Controller untuk ambil semua exchange rates
export const getExchangeRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currency_from, currency_to, is_active } = req.query;

    // Build dynamic query - similar to taxrates
    let query = 'SELECT * FROM exchange_rates';
    const conditions: string[] = [];
    
    if (currency_from) {
      conditions.push(`currency_from = '${currency_from}'`);
    }
    
    if (currency_to) {
      conditions.push(`currency_to = '${currency_to}'`);
    }
    
    if (is_active !== undefined) {
      conditions.push(`is_active = ${is_active === 'true'}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY effective_date DESC, currency_from ASC';

    // Use raw query
    const exchangeRates = await prisma.$queryRawUnsafe(query);

    res.status(200).json({
      success: true,
      message: "Daftar Exchange Rates berhasil diambil",
      data: exchangeRates,
    });
  } catch (error) {
    console.error("❌ Error mengambil Exchange Rates:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil data Exchange Rates",
      error: errMsg,
    });
  }
};

// Controller untuk ambil exchange rate berdasarkan ID
export const getExchangeRateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM exchange_rates WHERE id = ${parseInt(id)}`
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        message: "Exchange Rate tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Exchange Rate berhasil diambil",
      data: result[0],
    });
  } catch (error) {
    console.error("Error mengambil Exchange Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil Exchange Rate",
      error: errMsg,
    });
  }
};

// Controller untuk ambil latest exchange rate untuk pasangan mata uang tertentu
export const getLatestExchangeRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currency_from, currency_to } = req.query;

    if (!currency_from || !currency_to) {
      res.status(400).json({
        success: false,
        message: "currency_from dan currency_to wajib diisi",
      });
      return;
    }

    const result: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM exchange_rates 
       WHERE currency_from = '${currency_from}' 
       AND currency_to = '${currency_to}' 
       AND is_active = true 
       ORDER BY effective_date DESC 
       LIMIT 1`
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        message: `Exchange rate untuk ${currency_from} ke ${currency_to} tidak ditemukan`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Latest Exchange Rate berhasil diambil",
      data: result[0],
    });
  } catch (error) {
    console.error("Error mengambil Latest Exchange Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil Latest Exchange Rate",
      error: errMsg,
    });
  }
};

// Controller untuk membuat exchange rate baru
export const createExchangeRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currency_from, currency_to, rate, effective_date, is_active } = req.body;

    // Validasi input
    if (!currency_from || !currency_to || rate === undefined || !effective_date) {
      res.status(400).json({
        success: false,
        message: "currency_from, currency_to, rate, dan effective_date wajib diisi",
      });
      return;
    }

    // Validasi panjang kode mata uang
    if (currency_from.length !== 3 || currency_to.length !== 3) {
      res.status(400).json({
        success: false,
        message: "Kode mata uang harus 3 karakter (contoh: USD, IDR, EUR)",
      });
      return;
    }

    // Validasi rate (harus positif)
    if (rate <= 0) {
      res.status(400).json({
        success: false,
        message: "Rate harus lebih besar dari 0",
      });
      return;
    }

    // Validasi mata uang tidak sama
    if (currency_from === currency_to) {
      res.status(400).json({
        success: false,
        message: "Currency from dan currency to tidak boleh sama",
      });
      return;
    }

    // Cek apakah sudah ada exchange rate untuk kombinasi yang sama pada tanggal yang sama
    const existingRate: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM exchange_rates 
       WHERE currency_from = '${currency_from.toUpperCase()}' 
       AND currency_to = '${currency_to.toUpperCase()}' 
       AND effective_date = '${effective_date}'`
    );

    if (existingRate && existingRate.length > 0) {
      res.status(409).json({
        success: false,
        message: "Exchange rate untuk kombinasi mata uang dan tanggal ini sudah ada",
      });
      return;
    }

    const isActiveValue = is_active !== undefined ? is_active : true;
    
    await prisma.$queryRawUnsafe(
      `INSERT INTO exchange_rates (currency_from, currency_to, rate, effective_date, is_active, created_at, updated_at) 
       VALUES ('${currency_from.toUpperCase()}', '${currency_to.toUpperCase()}', ${rate}, '${effective_date}', ${isActiveValue}, NOW(), NOW())`
    );

    // Get the newly created record
    const newExchangeRate: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM exchange_rates 
       WHERE currency_from = '${currency_from.toUpperCase()}' 
       AND currency_to = '${currency_to.toUpperCase()}' 
       AND effective_date = '${effective_date}' 
       ORDER BY id DESC LIMIT 1`
    );

    res.status(201).json({
      success: true,
      message: "Exchange Rate berhasil dibuat",
      data: newExchangeRate[0],
    });
  } catch (error) {
    console.error("Error membuat Exchange Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat membuat Exchange Rate",
      error: errMsg,
    });
  }
};

// Controller untuk update exchange rate
export const updateExchangeRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { currency_from, currency_to, rate, effective_date, is_active } = req.body;

    // Cek apakah exchange rate ada
    const existingExchangeRate: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM exchange_rates WHERE id = ${parseInt(id)}`
    );

    if (!existingExchangeRate || existingExchangeRate.length === 0) {
      res.status(404).json({
        success: false,
        message: "Exchange Rate tidak ditemukan",
      });
      return;
    }

    const existing = existingExchangeRate[0];

    // Validasi rate jika diupdate
    if (rate !== undefined && rate <= 0) {
      res.status(400).json({
        success: false,
        message: "Rate harus lebih besar dari 0",
      });
      return;
    }

    // Validasi panjang kode mata uang jika diupdate
    if (currency_from && currency_from.length !== 3) {
      res.status(400).json({
        success: false,
        message: "Kode currency_from harus 3 karakter",
      });
      return;
    }

    if (currency_to && currency_to.length !== 3) {
      res.status(400).json({
        success: false,
        message: "Kode currency_to harus 3 karakter",
      });
      return;
    }

    // Validasi mata uang tidak sama
    const fromCurrency = currency_from?.toUpperCase() || existing.currency_from;
    const toCurrency = currency_to?.toUpperCase() || existing.currency_to;
    
    if (fromCurrency === toCurrency) {
      res.status(400).json({
        success: false,
        message: "Currency from dan currency to tidak boleh sama",
      });
      return;
    }

    // Cek duplikasi jika currency atau effective_date diupdate
    if (currency_from || currency_to || effective_date) {
      const checkDate = effective_date || existing.effective_date;
      const duplicate: any = await prisma.$queryRawUnsafe(
        `SELECT * FROM exchange_rates 
         WHERE id != ${parseInt(id)} 
         AND currency_from = '${fromCurrency}' 
         AND currency_to = '${toCurrency}' 
         AND effective_date = '${checkDate}'`
      );

      if (duplicate && duplicate.length > 0) {
        res.status(409).json({
          success: false,
          message: "Exchange rate dengan kombinasi mata uang dan tanggal ini sudah ada",
        });
        return;
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    if (currency_from) updates.push(`currency_from = '${currency_from.toUpperCase()}'`);
    if (currency_to) updates.push(`currency_to = '${currency_to.toUpperCase()}'`);
    if (rate !== undefined) updates.push(`rate = ${rate}`);
    if (effective_date) updates.push(`effective_date = '${effective_date}'`);
    if (is_active !== undefined) updates.push(`is_active = ${is_active}`);
    updates.push(`updated_at = NOW()`);

    await prisma.$queryRawUnsafe(
      `UPDATE exchange_rates SET ${updates.join(', ')} WHERE id = ${parseInt(id)}`
    );

    // Get updated record
    const updatedExchangeRate: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM exchange_rates WHERE id = ${parseInt(id)}`
    );

    res.status(200).json({
      success: true,
      message: "Exchange Rate berhasil diupdate",
      data: updatedExchangeRate[0],
    });
  } catch (error) {
    console.error("Error update Exchange Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat update Exchange Rate",
      error: errMsg,
    });
  }
};

// Controller untuk delete exchange rate
export const deleteExchangeRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Cek apakah exchange rate ada
    const existingExchangeRate: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM exchange_rates WHERE id = ${parseInt(id)}`
    );

    if (!existingExchangeRate || existingExchangeRate.length === 0) {
      res.status(404).json({
        success: false,
        message: "Exchange Rate tidak ditemukan",
      });
      return;
    }

    await prisma.$queryRawUnsafe(
      `DELETE FROM exchange_rates WHERE id = ${parseInt(id)}`
    );

    res.status(200).json({
      success: true,
      message: "Exchange Rate berhasil dihapus",
    });
  } catch (error) {
    console.error("Error delete Exchange Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menghapus Exchange Rate",
      error: errMsg,
    });
  }
};
