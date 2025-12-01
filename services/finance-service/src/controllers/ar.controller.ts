/**
 * AR (Accounts Receivable) Controller
 */

import { Request, Response } from 'express';
import arService from '../services/ar.service';

class ARController {
  /**
   * GET /api/finance/ar/summary
   * Get comprehensive AR summary
   */
  async getARSummary(req: Request, res: Response) {
    try {
      const summary = await arService.getARSummary();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Error in getARSummary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get AR summary',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/finance/ar/aging
   * Get AR aging report
   */
  async getAgingReport(req: Request, res: Response) {
    try {
      const report = await arService.getAgingReport();
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error in getAgingReport:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get aging report',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/finance/ar/top-customers
   * Get top customers by outstanding amount
   */
  async getTopCustomers(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const customers = await arService.getTopCustomers(limit);
      res.status(200).json({
        success: true,
        data: customers,
      });
    } catch (error: any) {
      console.error('Error in getTopCustomers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get top customers',
        error: error.message,
      });
    }
  }
}

export default new ARController();
