"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeneralLedgerBulk = exports.getGeneralLedger = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Get General Ledger (Buku Besar) untuk specific account
 * @param accountId - ID account
 * @param startDate - Optional: Start date filter
 * @param endDate - Optional: End date filter
 * @returns General Ledger report dengan running balance
 */
const getGeneralLedger = async (accountId, startDate, endDate) => {
    try {
        // Get account info
        const account = await prisma.chartOfAccounts.findUnique({
            where: { id: accountId },
        });
        if (!account) {
            return null;
        }
        // Calculate opening balance (before start date if provided)
        let openingBalance = 0;
        if (startDate) {
            const openingEntries = await prisma.journal_entries.findMany({
                where: {
                    account_id: accountId,
                    transaction_date: {
                        lt: startDate,
                    },
                },
                select: {
                    debit: true,
                    credit: true,
                },
            });
            const openingTotals = openingEntries.reduce((acc, entry) => {
                const debit = entry.debit ? parseFloat(entry.debit.toString()) : 0;
                const credit = entry.credit ? parseFloat(entry.credit.toString()) : 0;
                return {
                    debit: acc.debit + debit,
                    credit: acc.credit + credit,
                };
            }, { debit: 0, credit: 0 });
            // Calculate opening balance based on account type
            if (['Asset', 'Expense', 'CostOfService'].includes(account.account_type)) {
                openingBalance = openingTotals.debit - openingTotals.credit;
            }
            else {
                openingBalance = openingTotals.credit - openingTotals.debit;
            }
        }
        // Build where clause for entries
        const whereClause = { account_id: accountId };
        if (startDate || endDate) {
            whereClause.transaction_date = {};
            if (startDate) {
                whereClause.transaction_date.gte = startDate;
            }
            if (endDate) {
                whereClause.transaction_date.lte = endDate;
            }
        }
        // Get journal entries
        const rawEntries = await prisma.journal_entries.findMany({
            where: whereClause,
            orderBy: [
                { transaction_date: 'asc' },
                { id: 'asc' },
            ],
        });
        // Calculate running balance
        let runningBalance = openingBalance;
        let totalDebit = 0;
        let totalCredit = 0;
        const entries = rawEntries.map((entry) => {
            const debit = entry.debit ? parseFloat(entry.debit.toString()) : 0;
            const credit = entry.credit ? parseFloat(entry.credit.toString()) : 0;
            totalDebit += debit;
            totalCredit += credit;
            // Update running balance based on account type
            if (['Asset', 'Expense', 'CostOfService'].includes(account.account_type)) {
                runningBalance += debit - credit;
            }
            else {
                runningBalance += credit - debit;
            }
            return {
                id: entry.id,
                transaction_date: entry.transaction_date,
                description: entry.description,
                reference_id: entry.reference_id,
                reference_type: entry.reference_type,
                debit: debit,
                credit: credit,
                balance: runningBalance,
                created_by: entry.created_by,
            };
        });
        return {
            account: {
                id: account.id,
                account_code: account.account_code,
                account_name: account.account_name,
                account_type: account.account_type,
            },
            opening_balance: openingBalance,
            entries: entries,
            closing_balance: runningBalance,
            total_debit: totalDebit,
            total_credit: totalCredit,
        };
    }
    catch (error) {
        console.error('Error in getGeneralLedger:', error);
        throw error;
    }
};
exports.getGeneralLedger = getGeneralLedger;
/**
 * Get General Ledger untuk multiple accounts sekaligus
 * Useful untuk export atau analisis bulk
 */
const getGeneralLedgerBulk = async (accountIds, startDate, endDate) => {
    try {
        const reports = await Promise.all(accountIds.map((accountId) => (0, exports.getGeneralLedger)(accountId, startDate, endDate)));
        // Filter out null results (account not found)
        return reports.filter((report) => report !== null);
    }
    catch (error) {
        console.error('Error in getGeneralLedgerBulk:', error);
        throw error;
    }
};
exports.getGeneralLedgerBulk = getGeneralLedgerBulk;
