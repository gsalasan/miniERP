import { Request, Response } from 'express';
import * as generalLedgerService from '../services/reports.generalledger.service';
import * as trialBalanceService from '../services/reports.trialbalance.service';
import * as balanceSheetService from '../services/reports.balancesheet.service';
import * as incomeStatementService from '../services/reports.incomestatement.service';

/**
 * Reports Controllers
 * Endpoints untuk financial reports: General Ledger, Trial Balance, Balance Sheet, Income Statement
 */

/**
 * GET /api/reports/general-ledger/:accountId
 * Get General Ledger (Buku Besar) untuk specific account
 */
export const getGeneralLedger = async (req: Request, res: Response) => {
  try {
    const accountId = parseInt(req.params.accountId);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    if (isNaN(accountId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account ID',
      });
    }

    const report = await generalLedgerService.getGeneralLedger(accountId, startDate, endDate);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // Convert BigInt to string for JSON serialization
    const serialized = JSON.parse(JSON.stringify(report, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return res.status(200).json(serialized);
  } catch (error: any) {
    console.error('Error getting general ledger:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve general ledger',
      error: error.message,
    });
  }
};

/**
 * GET /api/reports/general-ledger-bulk
 * Get General Ledger untuk multiple accounts sekaligus
 */
export const getGeneralLedgerBulk = async (req: Request, res: Response) => {
  try {
    const accountIds = req.query.accountIds
      ? (req.query.accountIds as string).split(',').map(id => parseInt(id))
      : [];
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    if (accountIds.length === 0 || accountIds.some(isNaN)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account IDs',
      });
    }

    const reports = await generalLedgerService.getGeneralLedgerBulk(accountIds, startDate, endDate);

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error: any) {
    console.error('Error getting general ledger bulk:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve general ledgers',
      error: error.message,
    });
  }
};

/**
 * GET /api/reports/trial-balance
 * Get Trial Balance (Neraca Saldo) dengan validasi Debit = Credit
 */
export const getTrialBalance = async (req: Request, res: Response) => {
  try {
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : undefined;

    const report = await trialBalanceService.getTrialBalance(asOfDate);

    return res.status(200).json(report);
  } catch (error: any) {
    console.error('Error getting trial balance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve trial balance',
      error: error.message,
    });
  }
};

/**
 * GET /api/reports/trial-balance-by-type
 * Get Trial Balance summary grouped by account type
 */
export const getTrialBalanceByType = async (req: Request, res: Response) => {
  try {
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : undefined;

    const report = await trialBalanceService.getTrialBalanceByType(asOfDate);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Error getting trial balance by type:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve trial balance by type',
      error: error.message,
    });
  }
};

/**
 * GET /api/reports/balance-sheet
 * Get Balance Sheet (Neraca) dengan validasi Assets = Liabilities + Equity
 */
export const getBalanceSheet = async (req: Request, res: Response) => {
  try {
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : undefined;

    const report = await balanceSheetService.getBalanceSheet(asOfDate);

    return res.status(200).json(report);
  } catch (error: any) {
    console.error('Error getting balance sheet:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve balance sheet',
      error: error.message,
    });
  }
};

/**
 * GET /api/reports/balance-sheet-summary
 * Get Balance Sheet summary (totals only, no account details)
 */
export const getBalanceSheetSummary = async (req: Request, res: Response) => {
  try {
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : undefined;

    const report = await balanceSheetService.getBalanceSheetSummary(asOfDate);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Error getting balance sheet summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve balance sheet summary',
      error: error.message,
    });
  }
};

/**
 * GET /api/reports/income-statement
 * Get Income Statement (Laporan Laba Rugi) dengan calculation Revenue - COGS - Expense = Net Profit
 */
export const getIncomeStatement = async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const report = await incomeStatementService.getIncomeStatement(startDate, endDate);

    return res.status(200).json(report);
  } catch (error: any) {
    console.error('Error getting income statement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve income statement',
      error: error.message,
    });
  }
};

/**
 * GET /api/reports/income-statement-summary
 * Get Income Statement summary (totals & margins only, no account details)
 */
export const getIncomeStatementSummary = async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const report = await incomeStatementService.getIncomeStatementSummary(startDate, endDate);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Error getting income statement summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve income statement summary',
      error: error.message,
    });
  }
};
