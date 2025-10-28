import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

<<<<<<< HEAD
// Controller untuk ambil semua tax rates
export const getTaxRates = async (req: Request, res: Response): Promise<void> => {
  try {
    // Gunakan raw query karena model belum tersedia
    const taxRates = await prisma.$queryRaw`
      SELECT * FROM tax_rates ORDER BY id ASC
    `;

    res.status(200).json({
      success: true,
      message: "Daftar Tax Rates berhasil diambil",
=======
// Controller untuk ambil daftar tax rates
export const getTaxRates = async (req: Request, res: Response): Promise<void> => {
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
>>>>>>> main
      data: taxRates,
    });
  } catch (error) {
    console.error("Error mengambil Tax Rates:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil data Tax Rates",
      error: errMsg,
    });
  }
};

// Controller untuk ambil tax rate berdasarkan ID
export const getTaxRateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
<<<<<<< HEAD

    const taxRate = await prisma.$queryRaw`
      SELECT * FROM tax_rates WHERE id = ${parseInt(id)}
    `;

    if (!taxRate || (Array.isArray(taxRate) && taxRate.length === 0)) {
=======
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
>>>>>>> main
      res.status(404).json({
        success: false,
        message: "Tax Rate tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
<<<<<<< HEAD
      message: "Tax Rate berhasil diambil",
      data: Array.isArray(taxRate) ? taxRate[0] : taxRate,
=======
      message: "Tax Rate berhasil diambil dari database",
      data: taxRate,
>>>>>>> main
    });
  } catch (error) {
    console.error("Error mengambil Tax Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
<<<<<<< HEAD
      message: "Terjadi kesalahan server saat mengambil Tax Rate",
=======
      message: "Terjadi kesalahan server saat mengambil data Tax Rate",
>>>>>>> main
      error: errMsg,
    });
  }
};

// Controller untuk membuat tax rate baru
export const createTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
<<<<<<< HEAD
    const { tax_name, tax_code, rate, description, is_active } = req.body;

    // Validasi input
    if (!tax_name || !tax_code || rate === undefined) {
      res.status(400).json({
        success: false,
        message: "tax_name, tax_code, dan rate wajib diisi",
=======
    const { tax_name, rate_percentage } = req.body;

    // Validasi input
    if (!tax_name || rate_percentage === undefined || rate_percentage === null) {
      res.status(400).json({
        success: false,
        message: "Tax name dan rate percentage harus diisi",
>>>>>>> main
      });
      return;
    }

<<<<<<< HEAD
    // Validasi rate (harus antara 0-100)
    if (rate < 0 || rate > 100) {
      res.status(400).json({
        success: false,
        message: "Rate harus antara 0 dan 100",
=======
    if (typeof rate_percentage !== 'number' || rate_percentage < 0 || rate_percentage > 100) {
      res.status(400).json({
        success: false,
        message: "Rate percentage harus berupa angka antara 0-100",
>>>>>>> main
      });
      return;
    }

<<<<<<< HEAD
    // Cek apakah tax_name atau tax_code sudah ada
    const existingTax = await prisma.$queryRaw`
      SELECT * FROM tax_rates 
      WHERE tax_name = ${tax_name} OR tax_code = ${tax_code}
      LIMIT 1
    `;

    if (Array.isArray(existingTax) && existingTax.length > 0) {
      res.status(409).json({
        success: false,
        message: "Tax name atau tax code sudah digunakan",
      });
      return;
    }

    const activeStatus = is_active !== undefined ? is_active : true;
    
    const newTaxRate = await prisma.$queryRaw`
      INSERT INTO tax_rates (tax_name, tax_code, rate, description, is_active)
      VALUES (${tax_name}, ${tax_code}, ${rate}, ${description || null}, ${activeStatus})
      RETURNING *
    `;
=======
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
>>>>>>> main

    res.status(201).json({
      success: true,
      message: "Tax Rate berhasil dibuat",
<<<<<<< HEAD
      data: Array.isArray(newTaxRate) ? newTaxRate[0] : newTaxRate,
=======
      data: newTaxRate,
>>>>>>> main
    });
  } catch (error) {
    console.error("Error membuat Tax Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

<<<<<<< HEAD
=======
    // Handle unique constraint violation
    if (errMsg.includes('Unique constraint')) {
      res.status(409).json({
        success: false,
        message: "Tax name sudah ada",
      });
      return;
    }

>>>>>>> main
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat membuat Tax Rate",
      error: errMsg,
    });
  }
};

// Controller untuk update tax rate
export const updateTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
<<<<<<< HEAD
    const { tax_name, tax_code, rate, description, is_active } = req.body;

    // Cek apakah tax rate ada
    const existingTaxRate = await prisma.$queryRaw`
      SELECT * FROM tax_rates WHERE id = ${parseInt(id)}
    `;

    if (!existingTaxRate || (Array.isArray(existingTaxRate) && existingTaxRate.length === 0)) {
=======
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

    const updateData: any = {};
    if (tax_name !== undefined) updateData.tax_name = tax_name;
    if (rate_percentage !== undefined) updateData.rate_percentage = rate_percentage;

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
  } catch (error) {
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
>>>>>>> main
      res.status(404).json({
        success: false,
        message: "Tax Rate tidak ditemukan",
      });
      return;
    }

<<<<<<< HEAD
    // Validasi rate jika diupdate
    if (rate !== undefined && (rate < 0 || rate > 100)) {
      res.status(400).json({
        success: false,
        message: "Rate harus antara 0 dan 100",
      });
      return;
    }

    // Cek duplikasi tax_name atau tax_code (kecuali untuk record yang sama)
    if (tax_name || tax_code) {
      const duplicate = await prisma.$queryRaw`
        SELECT * FROM tax_rates 
        WHERE id != ${parseInt(id)} 
        AND (tax_name = ${tax_name || ''} OR tax_code = ${tax_code || ''})
        LIMIT 1
      `;

      if (Array.isArray(duplicate) && duplicate.length > 0) {
        res.status(409).json({
          success: false,
          message: "Tax name atau tax code sudah digunakan oleh tax rate lain",
        });
        return;
      }
    }

    // Build update query dynamically
    const current = Array.isArray(existingTaxRate) ? existingTaxRate[0] : existingTaxRate;
    const updatedTaxName = tax_name || current.tax_name;
    const updatedTaxCode = tax_code || current.tax_code;
    const updatedRate = rate !== undefined ? rate : current.rate;
    const updatedDescription = description !== undefined ? description : current.description;
    const updatedIsActive = is_active !== undefined ? is_active : current.is_active;

    const updatedTaxRate = await prisma.$queryRaw`
      UPDATE tax_rates 
      SET tax_name = ${updatedTaxName},
          tax_code = ${updatedTaxCode},
          rate = ${updatedRate},
          description = ${updatedDescription},
          is_active = ${updatedIsActive},
          updated_at = NOW()
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    res.status(200).json({
      success: true,
      message: "Tax Rate berhasil diupdate",
      data: Array.isArray(updatedTaxRate) ? updatedTaxRate[0] : updatedTaxRate,
    });
  } catch (error) {
    console.error("Error update Tax Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

=======
>>>>>>> main
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat update Tax Rate",
      error: errMsg,
    });
  }
};

// Controller untuk delete tax rate
export const deleteTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
<<<<<<< HEAD

    // Cek apakah tax rate ada
    const existingTaxRate = await prisma.$queryRaw`
      SELECT * FROM tax_rates WHERE id = ${parseInt(id)}
    `;

    if (!existingTaxRate || (Array.isArray(existingTaxRate) && existingTaxRate.length === 0)) {
      res.status(404).json({
        success: false,
        message: "Tax Rate tidak ditemukan",
=======
    const taxRateId = Number.parseInt(id);

    if (Number.isNaN(taxRateId)) {
      res.status(400).json({
        success: false,
        message: "ID harus berupa angka",
>>>>>>> main
      });
      return;
    }

<<<<<<< HEAD
    await prisma.$executeRaw`
      DELETE FROM tax_rates WHERE id = ${parseInt(id)}
    `;
=======
    await prisma.tax_rates.delete({
      where: { id: taxRateId },
    });
>>>>>>> main

    res.status(200).json({
      success: true,
      message: "Tax Rate berhasil dihapus",
    });
  } catch (error) {
    console.error("Error delete Tax Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

<<<<<<< HEAD
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menghapus Tax Rate",
=======
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
>>>>>>> main
      error: errMsg,
    });
  }
};
<<<<<<< HEAD

=======
>>>>>>> main
