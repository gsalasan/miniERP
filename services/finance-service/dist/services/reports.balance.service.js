"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalanceSummaryByType = exports.getAllAccountBalances = exports.getAccountBalance = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Get balance untuk satu account specific
 * @param accountId - ID dari account
 * @param asOfDate - Optional: Calculate balance as of specific date
 * @returns Account balance dengan total debit, credit, dan balance
 */
const getAccountBalance = async (accountId, asOfDate) => {
    try {
        // Get account info
        const account = await prisma.chartOfAccounts.findUnique({
            where: { id: accountId },
        });
        if (!account) {
            return null;
        }
        // Build where clause untuk date filter
        const whereClause = { account_id: accountId };
        if (asOfDate) {
            whereClause.transaction_date = {
                lte: asOfDate,
            };
        }
        // Calculate balance from journal entries
        const journalEntries = await prisma.journal_entries.findMany({
            where: whereClause,
            select: {
                debit: true,
                credit: true,
            },
        });
        // Sum debit and credit
        const totals = journalEntries.reduce((acc, entry) => {
            const debit = entry.debit ? parseFloat(entry.debit.toString()) : 0;
            const credit = entry.credit ? parseFloat(entry.credit.toString()) : 0;
            return {
                total_debit: acc.total_debit + debit,
                total_credit: acc.total_credit + credit,
            };
        }, { total_debit: 0, total_credit: 0 });
        // Calculate balance based on account type
        // Asset & Expense & CostOfService: Debit increases balance (Debit - Credit)
        // Liability, Equity, Revenue: Credit increases balance (Credit - Debit)
        let balance = 0;
        if (['Asset', 'Expense', 'CostOfService'].includes(account.account_type)) {
            balance = totals.total_debit - totals.total_credit;
        }
        else {
            // Liability, Equity, Revenue
            balance = totals.total_credit - totals.total_debit;
        }
        return {
            account_id: account.id,
            account_code: account.account_code,
            account_name: account.account_name,
            account_type: account.account_type,
            total_debit: totals.total_debit,
            total_credit: totals.total_credit,
            balance: balance,
        };
    }
    catch (error) {
        console.error('Error in getAccountBalance:', error);
        throw error;
    }
};
exports.getAccountBalance = getAccountBalance;
/**
 * Get balance untuk semua accounts
 * @param asOfDate - Optional: Calculate balance as of specific date
 * @returns Array of all account balances
 */
const getAllAccountBalances = async (asOfDate) => {
    try {
        // Get all accounts
        const accounts = await prisma.chartOfAccounts.findMany({
            orderBy: { account_code: 'asc' },
        });
        // Calculate balance for each account
        const balances = await Promise.all(accounts.map(async (account) => {
            // Build where clause
            const whereClause = { account_id: account.id };
            if (asOfDate) {
                whereClause.transaction_date = {
                    lte: asOfDate,
                };
            }
            // Get journal entries for this account
            const journalEntries = await prisma.journal_entries.findMany({
                where: whereClause,
                select: {
                    debit: true,
                    credit: true,
                },
            });
            // Sum debit and credit
            const totals = journalEntries.reduce((acc, entry) => {
                const debit = entry.debit ? parseFloat(entry.debit.toString()) : 0;
                const credit = entry.credit ? parseFloat(entry.credit.toString()) : 0;
                return {
                    total_debit: acc.total_debit + debit,
                    total_credit: acc.total_credit + credit,
                };
            }, { total_debit: 0, total_credit: 0 });
            // Calculate balance based on account type
            let balance = 0;
            if (['Asset', 'Expense', 'CostOfService'].includes(account.account_type)) {
                balance = totals.total_debit - totals.total_credit;
            }
            else {
                balance = totals.total_credit - totals.total_debit;
            }
            return {
                account_id: account.id,
                account_code: account.account_code,
                account_name: account.account_name,
                account_type: account.account_type,
                total_debit: totals.total_debit,
                total_credit: totals.total_credit,
                balance: balance,
            };
        }));
        return balances;
    }
    catch (error) {
        console.error('Error in getAllAccountBalances:', error);
        throw error;
    }
};
exports.getAllAccountBalances = getAllAccountBalances;
/**
 * Get balance summary by account type
 * Useful untuk balance sheet calculation
 */
const getBalanceSummaryByType = async (asOfDate) => {
    try {
        const balances = await (0, exports.getAllAccountBalances)(asOfDate);
        // Group by account type
        const summary = balances.reduce((acc, item) => {
            if (!acc[item.account_type]) {
                acc[item.account_type] = 0;
            }
            acc[item.account_type] += item.balance;
            return acc;
        }, {});
        return summary;
    }
    catch (error) {
        console.error('Error in getBalanceSummaryByType:', error);
        throw error;
    }
};
exports.getBalanceSummaryByType = getBalanceSummaryByType;
