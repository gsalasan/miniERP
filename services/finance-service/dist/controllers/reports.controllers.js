"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncomeStatementSummary = exports.getIncomeStatement = exports.getBalanceSheetSummary = exports.getBalanceSheet = exports.getTrialBalanceByType = exports.getTrialBalance = exports.getGeneralLedgerBulk = exports.getGeneralLedger = void 0;
const generalLedgerService = __importStar(require("../services/reports.generalledger.service"));
const trialBalanceService = __importStar(require("../services/reports.trialbalance.service"));
const balanceSheetService = __importStar(require("../services/reports.balancesheet.service"));
const incomeStatementService = __importStar(require("../services/reports.incomestatement.service"));
/**
 * Reports Controllers
 * Endpoints untuk financial reports: General Ledger, Trial Balance, Balance Sheet, Income Statement
 */
/**
 * GET /api/reports/general-ledger/:accountId
 * Get General Ledger (Buku Besar) untuk specific account
 */
const getGeneralLedger = async (req, res) => {
    try {
        const accountId = parseInt(req.params.accountId);
        const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
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
        return res.status(200).json(report);
    }
    catch (error) {
        console.error('Error getting general ledger:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve general ledger',
            error: error.message,
        });
    }
};
exports.getGeneralLedger = getGeneralLedger;
/**
 * GET /api/reports/general-ledger-bulk
 * Get General Ledger untuk multiple accounts sekaligus
 */
const getGeneralLedgerBulk = async (req, res) => {
    try {
        const accountIds = req.query.accountIds
            ? req.query.accountIds.split(',').map(id => parseInt(id))
            : [];
        const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
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
    }
    catch (error) {
        console.error('Error getting general ledger bulk:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve general ledgers',
            error: error.message,
        });
    }
};
exports.getGeneralLedgerBulk = getGeneralLedgerBulk;
/**
 * GET /api/reports/trial-balance
 * Get Trial Balance (Neraca Saldo) dengan validasi Debit = Credit
 */
const getTrialBalance = async (req, res) => {
    try {
        const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate) : undefined;
        const report = await trialBalanceService.getTrialBalance(asOfDate);
        return res.status(200).json(report);
    }
    catch (error) {
        console.error('Error getting trial balance:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve trial balance',
            error: error.message,
        });
    }
};
exports.getTrialBalance = getTrialBalance;
/**
 * GET /api/reports/trial-balance-by-type
 * Get Trial Balance summary grouped by account type
 */
const getTrialBalanceByType = async (req, res) => {
    try {
        const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate) : undefined;
        const report = await trialBalanceService.getTrialBalanceByType(asOfDate);
        return res.status(200).json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        console.error('Error getting trial balance by type:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve trial balance by type',
            error: error.message,
        });
    }
};
exports.getTrialBalanceByType = getTrialBalanceByType;
/**
 * GET /api/reports/balance-sheet
 * Get Balance Sheet (Neraca) dengan validasi Assets = Liabilities + Equity
 */
const getBalanceSheet = async (req, res) => {
    try {
        const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate) : undefined;
        const report = await balanceSheetService.getBalanceSheet(asOfDate);
        return res.status(200).json(report);
    }
    catch (error) {
        console.error('Error getting balance sheet:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve balance sheet',
            error: error.message,
        });
    }
};
exports.getBalanceSheet = getBalanceSheet;
/**
 * GET /api/reports/balance-sheet-summary
 * Get Balance Sheet summary (totals only, no account details)
 */
const getBalanceSheetSummary = async (req, res) => {
    try {
        const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate) : undefined;
        const report = await balanceSheetService.getBalanceSheetSummary(asOfDate);
        return res.status(200).json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        console.error('Error getting balance sheet summary:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve balance sheet summary',
            error: error.message,
        });
    }
};
exports.getBalanceSheetSummary = getBalanceSheetSummary;
/**
 * GET /api/reports/income-statement
 * Get Income Statement (Laporan Laba Rugi) dengan calculation Revenue - COGS - Expense = Net Profit
 */
const getIncomeStatement = async (req, res) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
        const report = await incomeStatementService.getIncomeStatement(startDate, endDate);
        return res.status(200).json(report);
    }
    catch (error) {
        console.error('Error getting income statement:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve income statement',
            error: error.message,
        });
    }
};
exports.getIncomeStatement = getIncomeStatement;
/**
 * GET /api/reports/income-statement-summary
 * Get Income Statement summary (totals & margins only, no account details)
 */
const getIncomeStatementSummary = async (req, res) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
        const report = await incomeStatementService.getIncomeStatementSummary(startDate, endDate);
        return res.status(200).json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        console.error('Error getting income statement summary:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve income statement summary',
            error: error.message,
        });
    }
};
exports.getIncomeStatementSummary = getIncomeStatementSummary;
