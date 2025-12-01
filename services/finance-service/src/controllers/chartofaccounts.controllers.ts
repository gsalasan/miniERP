import { Request, Response } from "express";
import { prisma } from '../lib/prisma';
import { mockChartOfAccounts, mockDataStore } from '../utils/mockData';

// GET - Ambil semua Chart of Accounts dengan summary saldo
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

    // Calculate balance summary per account type
    const summary = {
      total: chartOfAccounts.length,
      Asset: 0,
      Liability: 0,
      Equity: 0,
      Revenue: 0,
      Expense: 0,
      CostOfService: 0,
    };

    // Get all journal entries with account info
    const journalEntries = await prisma.journal_entries.findMany({
      select: {
        account_id: true,
        debit: true,
        credit: true,
      },
    });

    // Calculate balance per account
    const accountBalances = new Map<number, number>();
    journalEntries.forEach((entry: any) => {
      const currentBalance = accountBalances.get(entry.account_id) || 0;
      const debit = entry.debit ? Number(entry.debit) : 0;
      const credit = entry.credit ? Number(entry.credit) : 0;
      accountBalances.set(
        entry.account_id,
        currentBalance + (debit - credit)
      );
    });

    // Sum balances by account type
    chartOfAccounts.forEach(account => {
      const balance = accountBalances.get(account.id) || 0;
      const type = account.account_type;
      
      if (type === 'Asset') {
        summary.Asset += balance;
      } else if (type === 'Liability') {
        summary.Liability += Math.abs(balance); // Show positive value
      } else if (type === 'Equity') {
        summary.Equity += Math.abs(balance);
      } else if (type === 'Revenue') {
        summary.Revenue += Math.abs(balance);
      } else if (type === 'Expense') {
        summary.Expense += balance;
      } else if (type === 'CostOfService') {
        summary.CostOfService += balance;
      }
    });

    res.status(200).json({
      success: true,
      message: "Daftar Chart of Accounts berhasil diambil dari database",
      data: chartOfAccounts,
      summary: summary,
    });
  } catch (error) {
    console.error("⚠️ Database error, using mock data:", error);
    
    // Fallback to mock data with summary
    res.status(200).json({
      success: true,
      message: "Daftar Chart of Accounts (Mock Data for Development)",
      data: mockChartOfAccounts,
      summary: {
        total: mockChartOfAccounts.length,
        Asset: 850000000,
        Liability: 220000000,
        Equity: 1330000000,
        Revenue: 1130000000,
        Expense: 302000000,
        CostOfService: 500000000,
      },
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

    try {
      // Try database first
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
    } catch (dbError) {
      console.warn("⚠️ Database error, using mock data store:", dbError);
      
      // Fallback to mock data store
      const newAccount = mockDataStore.createAccount({
        account_code,
        account_name,
        account_type,
        description,
      });

      res.status(201).json({
        success: true,
        message: "Chart of Account berhasil dibuat (Mock Data)",
        data: newAccount,
      });
    }
  } catch (error) {
    console.error("❌ Error creating Chart of Account:", error);
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

    try {
      // Try database first
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
    } catch (dbError) {
      console.warn("⚠️ Database error, using mock data store:", dbError);
      
      // Fallback to mock data store
      const updatedAccount = mockDataStore.updateAccount(parseInt(id), {
        account_code,
        account_name,
        account_type,
        description,
      });

      if (!updatedAccount) {
        res.status(404).json({
          success: false,
          message: "Chart of Account tidak ditemukan",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Chart of Account berhasil diperbarui (Mock Data)",
        data: updatedAccount,
      });
    }
  } catch (error) {
    console.error("❌ Error update Chart of Account:", error);
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

    try {
      // Try database first
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
    } catch (dbError) {
      console.warn("⚠️ Database error, using mock data store:", dbError);
      
      // Fallback to mock data store
      const deleted = mockDataStore.deleteAccount(parseInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Chart of Account tidak ditemukan",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Chart of Account berhasil dihapus (Mock Data)",
      });
    }
  } catch (error) {
    console.error("❌ Error delete Chart of Account:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat hapus Chart of Account",
      error: errMsg,
    });
  }
};
