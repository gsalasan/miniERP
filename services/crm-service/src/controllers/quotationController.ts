import { Request, Response } from 'express';
import quotationServices from '../services/quotationServices';

class QuotationController {
  /**
   * GET /quotations/:opportunityId
   * Get quotation data for generating PDF
   */
  async getQuotation(req: Request, res: Response): Promise<void> {
    try {
      const { opportunityId } = req.params;

      if (!opportunityId) {
        res.status(400).json({
          success: false,
          message: 'Opportunity ID is required',
        });
        return;
      }

      const quotationData =
        await quotationServices.getQuotationData(opportunityId);

      res.status(200).json({
        success: true,
        data: quotationData,
      });
    } catch (error) {
      const err = error as Error;

      if (
        err.message === 'Project not found' ||
        err.message === 'Sales person not found'
      ) {
        res.status(404).json({
          success: false,
          message: err.message,
        });
        return;
      }

      if (err.message.includes('No approved estimation')) {
        res.status(422).json({
          success: false,
          message: err.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get quotation data',
        error: err.message,
      });
    }
  }
}

export default new QuotationController();
