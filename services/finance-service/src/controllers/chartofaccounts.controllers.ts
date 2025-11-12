import { Request, Response } from "express";
import { prisma } from '../lib/prisma';

// GET - Ambil semua Chart of Accounts
export const getChartOfAccounts = async (req: Request, res: Response): Promise<void> => {
  console.log("🔍 getChartOfAccounts called");
  try {
    console.log("🔍 Calling prisma.chartOfAccounts.findMany...");
    const chartOfAccounts = await prisma.chartOfAccounts.findMany({
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
  } catch (error) {
    console.error("❌ CONTROLLER ERROR:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil data Chart of Accounts",
      error: errMsg,
    });
  }
};

// Controller untuk membuat akun baru
export const createChartOfAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { account_code, account_name, account_type, description } = req.body;

    // Validasi input
    if (!account_code || !account_name || !account_type) {
      res.status(400).json({
        success: false,
        message: "account_code, account_name, dan account_type wajib diisi",
      });
      return;
    }

    // Cek apakah account_code sudah ada
    const existingAccount = await prisma.chartOfAccounts.findUnique({
      where: { account_code },
    });

    if (existingAccount) {
      res.status(409).json({
        success: false,
        message: "Account code sudah digunakan",
      });
      return;
    }

    const newAccount = await prisma.chartOfAccounts.create({
      data: {
        account_code,
        account_name,
        account_type,
        description,
      },
    });

    res.status(201).json({
      success: true,
      message: "Chart of Account berhasil dibuat",
      data: newAccount,
    });
  } catch (error) {
    console.error("Error membuat Chart of Account:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat membuat Chart of Account",
      error: errMsg,
    });
  }
};

// Controller untuk update akun
export const updateChartOfAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { account_code, account_name, account_type, description } = req.body;

    // Cek apakah akun ada
    const existingAccount = await prisma.chartOfAccounts.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingAccount) {
      res.status(404).json({
        success: false,
        message: "Chart of Account tidak ditemukan",
      });
      return;
    }

    // Jika account_code diubah, cek apakah kode baru sudah digunakan
    if (account_code && account_code !== existingAccount.account_code) {
      const duplicateAccount = await prisma.chartOfAccounts.findUnique({
        where: { account_code },
      });

      if (duplicateAccount) {
        res.status(409).json({
          success: false,
          message: "Account code sudah digunakan",
        });
        return;
      }
    }

    const updatedAccount = await prisma.chartOfAccounts.update({
      where: { id: parseInt(id) },
      data: {
        ...(account_code && { account_code }),
        ...(account_name && { account_name }),
        ...(account_type && { account_type }),
        ...(description !== undefined && { description }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Chart of Account berhasil diperbarui",
      data: updatedAccount,
    });
  } catch (error) {
    console.error("Error update Chart of Account:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat update Chart of Account",
      error: errMsg,
    });
  }
};

// Controller untuk delete akun
export const deleteChartOfAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Cek apakah akun ada
    const existingAccount = await prisma.chartOfAccounts.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingAccount) {
      res.status(404).json({
        success: false,
        message: "Chart of Account tidak ditemukan",
      });
      return;
    }

    await prisma.chartOfAccounts.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Chart of Account berhasil dihapus",
    });
  } catch (error) {
    console.error("Error delete Chart of Account:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat hapus Chart of Account",
      error: errMsg,
    });
  }
};
