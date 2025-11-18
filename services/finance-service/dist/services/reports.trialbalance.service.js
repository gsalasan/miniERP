"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrialBalanceByType = exports.getTrialBalance = void 0;
const client_1 = require("@prisma/client");
const reports_balance_service_1 = require("./reports.balance.service");
const prisma = new client_1.PrismaClient();
/**
 * Generate Trial Balance Report
 * @param asOfDate - Optional: Calculate balance as of specific date
 * @returns Trial Balance report dengan validation
 */
const getTrialBalance = async (asOfDate) => {
    try {
        // Get all account balances
        const balances = await (0, reports_balance_service_1.getAllAccountBalances)(asOfDate);
        // Transform to trial balance format
        const entries = balances.map((balance) => {
            // For trial balance, we always show positive debit/credit
            let debit = 0;
            let credit = 0;
            if (balance.balance > 0) {
                // Positive balance
                if (['Asset', 'Expense', 'CostOfService'].includes(balance.account_type)) {
                    debit = balance.balance;
                }
                else {
                    credit = balance.balance;
                }
            }
            else if (balance.balance < 0) {
                // Negative balance
                if (['Asset', 'Expense', 'CostOfService'].includes(balance.account_type)) {
                    credit = Math.abs(balance.balance);
                }
                else {
                    debit = Math.abs(balance.balance);
                }
            }
            return {
                account_id: balance.account_id,
                account_code: balance.account_code,
                account_name: balance.account_name,
                account_type: balance.account_type,
                debit: debit,
                credit: credit,
                balance: balance.balance,
            };
        });
        // Calculate totals
        const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
        const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
        const difference = Math.abs(totalDebit - totalCredit);
        const isBalanced = difference < 0.01; // Allow for rounding errors
        return {
            as_of_date: asOfDate || null,
            entries: entries,
            total_debit: totalDebit,
            total_credit: totalCredit,
            is_balanced: isBalanced,
            difference: difference,
        };
    }
    catch (error) {
        console.error('Error in getTrialBalance:', error);
        throw error;
    }
};
exports.getTrialBalance = getTrialBalance;
/**
 * Get Trial Balance by Account Type
 * Useful untuk summary view
 */
const getTrialBalanceByType = async (asOfDate) => {
    try {
        const trialBalance = await (0, exports.getTrialBalance)(asOfDate);
        // Group by account type
        const byType = trialBalance.entries.reduce((acc, entry) => {
            if (!acc[entry.account_type]) {
                acc[entry.account_type] = { debit: 0, credit: 0, balance: 0 };
            }
            acc[entry.account_type].debit += entry.debit;
            acc[entry.account_type].credit += entry.credit;
            acc[entry.account_type].balance += entry.balance;
            return acc;
        }, {});
        return byType;
    }
    catch (error) {
        console.error('Error in getTrialBalanceByType:', error);
        throw error;
    }
};
exports.getTrialBalanceByType = getTrialBalanceByType;
