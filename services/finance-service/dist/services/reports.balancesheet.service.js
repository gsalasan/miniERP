"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalanceSheetSummary = exports.getBalanceSheet = void 0;
const client_1 = require("@prisma/client");
const reports_balance_service_1 = require("./reports.balance.service");
const prisma = new client_1.PrismaClient();
/**
 * Generate Balance Sheet Report
 * @param asOfDate - Optional: Calculate balance as of specific date
 * @returns Balance Sheet report
 */
const getBalanceSheet = async (asOfDate) => {
    try {
        // Get all accounts with balances
        const accounts = await prisma.chartOfAccounts.findMany({
            orderBy: { account_code: 'asc' },
        });
        // Get balances for all accounts
        const balanceSummary = await (0, reports_balance_service_1.getBalanceSummaryByType)(asOfDate);
        // Initialize sections
        const assetAccounts = [];
        const liabilityAccounts = [];
        const equityAccounts = [];
        // Calculate individual account balances
        for (const account of accounts) {
            // Build where clause
            const whereClause = { account_id: account.id };
            if (asOfDate) {
                whereClause.transaction_date = { lte: asOfDate };
            }
            // Get journal entries
            const entries = await prisma.journal_entries.findMany({
                where: whereClause,
                select: { debit: true, credit: true },
            });
            // Calculate balance
            const totals = entries.reduce((acc, entry) => {
                const debit = entry.debit ? parseFloat(entry.debit.toString()) : 0;
                const credit = entry.credit ? parseFloat(entry.credit.toString()) : 0;
                return {
                    debit: acc.debit + debit,
                    credit: acc.credit + credit,
                };
            }, { debit: 0, credit: 0 });
            let balance = 0;
            if (['Asset', 'Expense', 'CostOfService'].includes(account.account_type)) {
                balance = totals.debit - totals.credit;
            }
            else {
                balance = totals.credit - totals.debit;
            }
            // Skip zero balances
            if (Math.abs(balance) < 0.01) {
                continue;
            }
            const accountData = {
                account_code: account.account_code,
                account_name: account.account_name,
                balance: balance,
            };
            // Categorize
            if (account.account_type === 'Asset') {
                assetAccounts.push(accountData);
            }
            else if (account.account_type === 'Liability') {
                liabilityAccounts.push(accountData);
            }
            else if (account.account_type === 'Equity') {
                equityAccounts.push(accountData);
            }
        }
        // Calculate section totals
        const assetsTotal = assetAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const liabilitiesTotal = liabilityAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const equityTotal = equityAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const totalLiabilitiesAndEquity = liabilitiesTotal + equityTotal;
        const difference = Math.abs(assetsTotal - totalLiabilitiesAndEquity);
        const isBalanced = difference < 0.01;
        return {
            as_of_date: asOfDate || null,
            assets: {
                accounts: assetAccounts,
                total: assetsTotal,
            },
            liabilities: {
                accounts: liabilityAccounts,
                total: liabilitiesTotal,
            },
            equity: {
                accounts: equityAccounts,
                total: equityTotal,
            },
            total_assets: assetsTotal,
            total_liabilities_and_equity: totalLiabilitiesAndEquity,
            is_balanced: isBalanced,
            difference: difference,
        };
    }
    catch (error) {
        console.error('Error in getBalanceSheet:', error);
        throw error;
    }
};
exports.getBalanceSheet = getBalanceSheet;
/**
 * Get simplified Balance Sheet (summary only)
 */
const getBalanceSheetSummary = async (asOfDate) => {
    try {
        const summary = await (0, reports_balance_service_1.getBalanceSummaryByType)(asOfDate);
        const totalAssets = summary['Asset'] || 0;
        const totalLiabilities = summary['Liability'] || 0;
        const totalEquity = summary['Equity'] || 0;
        const difference = Math.abs(totalAssets - (totalLiabilities + totalEquity));
        return {
            total_assets: totalAssets,
            total_liabilities: totalLiabilities,
            total_equity: totalEquity,
            is_balanced: difference < 0.01,
        };
    }
    catch (error) {
        console.error('Error in getBalanceSheetSummary:', error);
        throw error;
    }
};
exports.getBalanceSheetSummary = getBalanceSheetSummary;
