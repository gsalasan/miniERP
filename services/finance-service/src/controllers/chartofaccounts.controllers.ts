import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Controller untuk ambil daftar akun (Chart of Accounts)
export const getChartOfAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
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
      orderBy: { id: "asc" },
    });

    res.status(200).json({
      success: true,
      message: "Daftar Chart of Accounts berhasil diambil dari database",
      data: chartOfAccounts,
    });
  } catch (error) {
    console.error("Error mengambil Chart of Accounts:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil data Chart of Accounts",
      error: errMsg,
    });
  }
};
