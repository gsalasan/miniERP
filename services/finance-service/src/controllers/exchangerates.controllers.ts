import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

<<<<<<< HEAD
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
=======
// Controller untuk ambil daftar exchange rates
export const getExchangeRates = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error("Error mengambil Exchange Rates:", error);
>>>>>>> main
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil data Exchange Rates",
      error: errMsg,
    });
  }
};

<<<<<<< HEAD
// Controller untuk ambil exchange rate berdasarkan ID
export const getExchangeRateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM exchange_rates WHERE id = ${parseInt(id)}`
    );

    if (!result || result.length === 0) {
=======
// Controller untuk ambil exchange rate berdasarkan currency code
export const getExchangeRateByCode = async (req: Request, res: Response): Promise<void> => {
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
>>>>>>> main
      res.status(404).json({
        success: false,
        message: "Exchange Rate tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
<<<<<<< HEAD
      message: "Exchange Rate berhasil diambil",
      data: result[0],
=======
      message: "Exchange Rate berhasil diambil dari database",
      data: exchangeRate,
>>>>>>> main
    });
  } catch (error) {
    console.error("Error mengambil Exchange Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
<<<<<<< HEAD
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
=======
      message: "Terjadi kesalahan server saat mengambil data Exchange Rate",
>>>>>>> main
      error: errMsg,
    });
  }
};

// Controller untuk membuat exchange rate baru
export const createExchangeRate = async (req: Request, res: Response): Promise<void> => {
  try {
<<<<<<< HEAD
    const { currency_from, currency_to, rate, effective_date, is_active } = req.body;

    // Validasi input
    if (!currency_from || !currency_to || rate === undefined || !effective_date) {
      res.status(400).json({
        success: false,
        message: "currency_from, currency_to, rate, dan effective_date wajib diisi",
=======
    const { currency_code, rate_to_idr } = req.body;

    // Validasi input
    if (!currency_code || rate_to_idr === undefined || rate_to_idr === null) {
      res.status(400).json({
        success: false,
        message: "Currency code dan rate to IDR harus diisi",
>>>>>>> main
      });
      return;
    }

<<<<<<< HEAD
    // Validasi panjang kode mata uang
    if (currency_from.length !== 3 || currency_to.length !== 3) {
      res.status(400).json({
        success: false,
        message: "Kode mata uang harus 3 karakter (contoh: USD, IDR, EUR)",
=======
    if (currency_code.length !== 3) {
      res.status(400).json({
        success: false,
        message: "Currency code harus berupa 3 karakter",
>>>>>>> main
      });
      return;
    }

<<<<<<< HEAD
    // Validasi rate (harus positif)
    if (rate <= 0) {
      res.status(400).json({
        success: false,
        message: "Rate harus lebih besar dari 0",
=======
    if (typeof rate_to_idr !== 'number' || rate_to_idr <= 0) {
      res.status(400).json({
        success: false,
        message: "Rate to IDR harus berupa angka positif",
>>>>>>> main
      });
      return;
    }

<<<<<<< HEAD
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
=======
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
>>>>>>> main

    res.status(201).json({
      success: true,
      message: "Exchange Rate berhasil dibuat",
<<<<<<< HEAD
      data: newExchangeRate[0],
=======
      data: newExchangeRate,
>>>>>>> main
    });
  } catch (error) {
    console.error("Error membuat Exchange Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

<<<<<<< HEAD
=======
    // Handle unique constraint violation
    if (errMsg.includes('Unique constraint')) {
      res.status(409).json({
        success: false,
        message: "Currency code sudah ada",
      });
      return;
    }

>>>>>>> main
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
<<<<<<< HEAD
    const { id } = req.params;
    const { currency_from, currency_to, rate, effective_date, is_active } = req.body;

    // Cek apakah exchange rate ada
    const existingExchangeRate: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM exchange_rates WHERE id = ${parseInt(id)}`
    );

    if (!existingExchangeRate || existingExchangeRate.length === 0) {
=======
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

    const updateData: any = {};
    if (rate_to_idr !== undefined) updateData.rate_to_idr = rate_to_idr;

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
  } catch (error) {
    console.error("Error update Exchange Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    // Handle record not found
    if (errMsg.includes('Record to update not found')) {
>>>>>>> main
      res.status(404).json({
        success: false,
        message: "Exchange Rate tidak ditemukan",
      });
      return;
    }

<<<<<<< HEAD
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

=======
>>>>>>> main
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
<<<<<<< HEAD
    const { id } = req.params;

    // Cek apakah exchange rate ada
    const existingExchangeRate: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM exchange_rates WHERE id = ${parseInt(id)}`
    );

    if (!existingExchangeRate || existingExchangeRate.length === 0) {
      res.status(404).json({
        success: false,
        message: "Exchange Rate tidak ditemukan",
=======
    const { currency_code } = req.params;

    if (!currency_code || currency_code.length !== 3) {
      res.status(400).json({
        success: false,
        message: "Currency code harus berupa 3 karakter",
>>>>>>> main
      });
      return;
    }

<<<<<<< HEAD
    await prisma.$queryRawUnsafe(
      `DELETE FROM exchange_rates WHERE id = ${parseInt(id)}`
    );
=======
    await prisma.exchange_rates.delete({
      where: { currency_code: currency_code.toUpperCase() },
    });
>>>>>>> main

    res.status(200).json({
      success: true,
      message: "Exchange Rate berhasil dihapus",
    });
  } catch (error) {
    console.error("Error delete Exchange Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

<<<<<<< HEAD
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menghapus Exchange Rate",
=======
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

// Controller untuk bulk update exchange rates
export const bulkUpdateExchangeRates = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error("Error bulk update Exchange Rates:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat bulk update Exchange Rates",
>>>>>>> main
      error: errMsg,
    });
  }
};
