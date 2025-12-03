/**
 * AR (Accounts Receivable) Service
 * Provides real-time data for AR Dashboard
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ARSummaryData {
  total_receivable: number;
  total_paid: number;
  total_outstanding: number;
  overdue_amount: number;
  overdue_count: number;
  avg_dso: number; // Days Sales Outstanding
  status_breakdown: {
    draft: number;
    sent: number;
    partially_paid: number;
    paid: number;
    overdue: number;
  };
  recent_invoices: Array<{
    id: string;
    invoice_number: string;
    customer_name: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: string;
    invoice_date: string;
    due_date: string;
    days_outstanding: number;
  }>;
}

class ARService {
  /**
   * Get comprehensive AR summary with real data
   */
  async getARSummary(): Promise<ARSummaryData> {
    try {
      // Get all invoices
      const invoices: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          id,
          invoice_number,
          invoice_date,
          due_date,
          customer_name,
          total_amount,
          COALESCE(paid_amount, 0) as paid_amount,
          COALESCE(remaining_amount, total_amount) as remaining_amount,
          status,
          EXTRACT(DAY FROM (CURRENT_DATE - invoice_date::date)) as days_since_issue,
          CASE 
            WHEN status != 'PAID' AND due_date::date < CURRENT_DATE THEN true
            ELSE false
          END as is_overdue
        FROM invoices
        WHERE status != 'DRAFT'
        ORDER BY invoice_date DESC
      `);

      // Calculate totals
      const total_receivable = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
      const total_paid = invoices.reduce((sum, inv) => sum + Number(inv.paid_amount), 0);
      const total_outstanding = invoices
        .filter(inv => inv.status !== 'PAID')
        .reduce((sum, inv) => sum + Number(inv.remaining_amount), 0);

      // Calculate overdue
      const overdueInvoices = invoices.filter(inv => inv.is_overdue);
      const overdue_amount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.remaining_amount), 0);
      const overdue_count = overdueInvoices.length;

      // Calculate DSO (Days Sales Outstanding)
      // DSO = (Accounts Receivable / Total Credit Sales) × Number of Days
      // Simplified: Average days_since_issue for unpaid invoices
      const unpaidInvoices = invoices.filter(inv => inv.status !== 'PAID');
      const avg_dso = unpaidInvoices.length > 0
        ? Math.round(unpaidInvoices.reduce((sum, inv) => sum + Number(inv.days_since_issue), 0) / unpaidInvoices.length)
        : 0;

      // Status breakdown
      const status_breakdown = {
        draft: invoices.filter(inv => inv.status === 'DRAFT').length,
        sent: invoices.filter(inv => inv.status === 'SENT').length,
        partially_paid: invoices.filter(inv => inv.status === 'PARTIALLY_PAID').length,
        paid: invoices.filter(inv => inv.status === 'PAID').length,
        overdue: overdue_count,
      };

      // Recent invoices (last 10)
      const recent_invoices = invoices.slice(0, 10).map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        customer_name: inv.customer_name,
        total_amount: Number(inv.total_amount),
        paid_amount: Number(inv.paid_amount),
        remaining_amount: Number(inv.remaining_amount),
        status: inv.status,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        days_outstanding: Number(inv.days_since_issue),
      }));

      return {
        total_receivable,
        total_paid,
        total_outstanding,
        overdue_amount,
        overdue_count,
        avg_dso,
        status_breakdown,
        recent_invoices,
      };
    } catch (error) {
      console.error('Error getting AR summary:', error);
      throw error;
    }
  }

  /**
   * Get aging report (breakdown by age buckets)
   */
  async getAgingReport(): Promise<any> {
    try {
      const result: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as invoice_count,
          SUM(remaining_amount) as total_amount,
          CASE 
            WHEN EXTRACT(DAY FROM (CURRENT_DATE - due_date::date)) <= 0 THEN 'Current'
            WHEN EXTRACT(DAY FROM (CURRENT_DATE - due_date::date)) BETWEEN 1 AND 30 THEN '1-30 Days'
            WHEN EXTRACT(DAY FROM (CURRENT_DATE - due_date::date)) BETWEEN 31 AND 60 THEN '31-60 Days'
            WHEN EXTRACT(DAY FROM (CURRENT_DATE - due_date::date)) BETWEEN 61 AND 90 THEN '61-90 Days'
            ELSE '90+ Days'
          END as age_bucket
        FROM invoices
        WHERE status != 'PAID' AND status != 'DRAFT'
        GROUP BY age_bucket
        ORDER BY 
          CASE age_bucket
            WHEN 'Current' THEN 1
            WHEN '1-30 Days' THEN 2
            WHEN '31-60 Days' THEN 3
            WHEN '61-90 Days' THEN 4
            ELSE 5
          END
      `);

      return result.map(row => ({
        age_bucket: row.age_bucket,
        invoice_count: Number(row.invoice_count),
        total_amount: Number(row.total_amount),
      }));
    } catch (error) {
      console.error('Error getting aging report:', error);
      throw error;
    }
  }

  /**
   * Get top customers by outstanding amount
   */
  async getTopCustomers(limit: number = 10): Promise<any[]> {
    try {
      const result: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          customer_name,
          customer_id,
          COUNT(*) as invoice_count,
          SUM(total_amount) as total_billed,
          SUM(COALESCE(paid_amount, 0)) as total_paid,
          SUM(COALESCE(remaining_amount, total_amount)) as total_outstanding
        FROM invoices
        WHERE status != 'DRAFT'
        GROUP BY customer_name, customer_id
        HAVING SUM(COALESCE(remaining_amount, total_amount)) > 0
        ORDER BY total_outstanding DESC
        LIMIT $1
      `, limit);

      return result.map(row => ({
        customer_name: row.customer_name,
        customer_id: row.customer_id,
        invoice_count: Number(row.invoice_count),
        total_billed: Number(row.total_billed),
        total_paid: Number(row.total_paid),
        total_outstanding: Number(row.total_outstanding),
      }));
    } catch (error) {
      console.error('Error getting top customers:', error);
      throw error;
    }
  }
}

export default new ARService();
