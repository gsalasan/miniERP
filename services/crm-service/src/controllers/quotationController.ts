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

  async generateQuotation(req: Request, res: Response): Promise<void> {
    try {
      const { estimationId, discountPercentage } = req.body;
      const userId = (req as any).user?.id || (req as any).user?.userId || (req as any).user?.sub; // Get userId from auth middleware

      // Debug log
      console.log('[generateQuotation] Request:', {
        estimationId,
        discountPercentage,
        userId,
        userFromToken: (req as any).user,
      });

      if (!estimationId) {
        res.status(400).json({
          success: false,
          message: 'Estimation ID is required',
        });
        return;
      }

      const quotationData = await quotationServices.generateQuotationWithDiscount(
        estimationId,
        discountPercentage || 0,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Quotation generated successfully',
        data: quotationData,
      });
    } catch (error) {
      const err = error as Error;

      if (
        err.message === 'Project not found' ||
        err.message === 'Sales person not found' ||
        err.message === 'Estimation not found'
      ) {
        res.status(404).json({
          success: false,
          message: err.message,
        });
        return;
      }

      if (err.message.includes('No estimation found') || 
          err.message.includes('not approved') ||
          err.message.includes('exceeds your authority')) {
        res.status(422).json({
          success: false,
          message: err.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to generate quotation',
        error: err.message,
      });
    }
  }

  async getQuotationsByProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        res.status(400).json({
          success: false,
          message: 'Project ID is required',
        });
        return;
      }

      const quotations = await quotationServices.getQuotationsByProject(projectId);

      res.status(200).json({
        success: true,
        data: quotations,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quotations',
        error: err.message,
      });
    }
  }
}

export default new QuotationController();

