import { Request, Response } from 'express';
import salesOrderServices from '../services/salesOrderServices';
import salesOrderConversionService from '../services/salesOrderConversionService';

class SalesOrderController {
  /**
   * Convert WON Opportunity to Sales Order
   * POST /api/v1/sales-orders/convert-from-opportunity
   */
  async convertOpportunityToSalesOrder(req: Request, res: Response): Promise<void> {
    try {
      const { opportunityId, projectName, topDays, signedDate, idempotencyKey } = req.body;
      const userId = (req as any).user?.userId;
      const token = req.headers.authorization?.replace('Bearer ', '') || '';

      if (!opportunityId) {
        res.status(400).json({
          success: false,
          message: 'opportunityId is required',
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      console.log(`[SalesOrderController] Converting opportunity ${opportunityId} to SO by user ${userId}`);

      const result = await salesOrderConversionService.convertOpportunityToSalesOrder(
        {
          opportunityId,
          projectName,
          topDays,
          signedDate,
          idempotencyKey,
        },
        userId,
        token
      );

      // 409 if SO already exists
      if (result.message?.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: result.message,
          data: result,
        });
        return;
      }

      // 201 Created
      res.status(201).json({
        success: true,
        message: 'Sales Order created successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('[SalesOrderController] Error converting opportunity:', error);

      // Handle specific errors
      if (error.message?.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message?.includes('Only WON')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to convert opportunity to Sales Order',
      });
    }
  }

  /**
   * Get Sales Order by Opportunity ID
   * GET /api/v1/sales-orders/by-opportunity/:opportunityId
   */
  async getSalesOrderByOpportunity(req: Request, res: Response): Promise<void> {
    try {
      const { opportunityId } = req.params;

      const salesOrder = await salesOrderConversionService.getSalesOrderByOpportunity(opportunityId);

      if (!salesOrder) {
        res.status(404).json({
          success: false,
          message: 'Sales Order not found for this opportunity',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: salesOrder,
      });
    } catch (error: any) {
      console.error('[SalesOrderController] Error getting sales order:', error);

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get Sales Order',
      });
    }
  }

  async createSalesOrder(req: Request, res: Response): Promise<void> {
    try {
      const {
        projectId,
        customerPoNumber,
        orderDate,
        topDaysAgreed,
        poDocumentUrl,
      } = req.body;

      // Validation
      if (!projectId) {
        res.status(400).json({
          success: false,
          message: 'Project ID is required',
        });
        return;
      }

      if (!orderDate) {
        res.status(400).json({
          success: false,
          message: 'Order Date is required',
        });
        return;
      }

      // Get user ID from JWT token (set by auth middleware)
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const result = await salesOrderServices.createSalesOrder({
        projectId,
        customerPoNumber,
        orderDate,
        topDaysAgreed,
        poDocumentUrl,
        createdByUserId: userId,
      });

      res.status(201).json({
        success: true,
        message: 'Sales Order created successfully',
        data: {
          soId: result.salesOrder.id,
          soNumber: result.salesOrder.so_number,
          project: result.project,
        },
      });
    } catch (error) {
      const err = error as Error;

      // Handle specific errors
      if (err.message === 'Project not found') {
        res.status(404).json({
          success: false,
          message: err.message,
        });
        return;
      }

      if (
        err.message === 'Project is already marked as WON' ||
        err.message.includes('Only projects with status')
      ) {
        res.status(409).json({
          success: false,
          message: err.message,
        });
        return;
      }

      console.error('[SalesOrderController] Error creating sales order:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to create Sales Order',
        error: err.message,
      });
    }
  }
  async getSalesOrderByProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      const salesOrder =
        await salesOrderServices.getSalesOrderByProjectId(projectId);

      if (!salesOrder) {
        res.status(404).json({
          success: false,
          message: 'Sales Order not found for this project',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: salesOrder,
      });
    } catch (error) {
      const err = error as Error;
      console.error('[SalesOrderController] Error fetching sales order:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Sales Order',
        error: err.message,
      });
    }
  }
  async getSalesOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const salesOrder = await salesOrderServices.getSalesOrderById(id);

      res.status(200).json({
        success: true,
        data: salesOrder,
      });
    } catch (error) {
      const err = error as Error;

      if (err.message === 'Sales Order not found') {
        res.status(404).json({
          success: false,
          message: err.message,
        });
        return;
      }

      console.error('[SalesOrderController] Error fetching sales order:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Sales Order',
        error: err.message,
      });
    }
  }
  async getAllSalesOrders(req: Request, res: Response): Promise<void> {
    try {
      const salesOrders = await salesOrderServices.getAllSalesOrders();

      res.status(200).json({
        success: true,
        data: salesOrders,
      });
    } catch (error) {
      const err = error as Error;
      console.error(
        '[SalesOrderController] Error fetching all sales orders:',
        err
      );
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Sales Orders',
        error: err.message,
      });
    }
  }
  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { poDocumentUrl } = req.body as { poDocumentUrl?: string };

      if (!poDocumentUrl || typeof poDocumentUrl !== 'string') {
        res
          .status(400)
          .json({ success: false, message: 'poDocumentUrl is required' });
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res
          .status(401)
          .json({ success: false, message: 'User authentication required' });
        return;
      }

      const updated = await salesOrderServices.updateSalesOrderDocument(
        id,
        poDocumentUrl,
        userId
      );

      res
        .status(200)
        .json({ success: true, message: 'PO document updated', data: updated });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Sales Order not found') {
        res.status(404).json({ success: false, message: err.message });
        return;
      }
      console.error('[SalesOrderController] Error updating document:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to update document',
        error: err.message,
      });
    }
  }

  async deleteSalesOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const result = await salesOrderServices.deleteSalesOrder(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      const err = error as Error;

      if (err.message === 'Sales Order not found') {
        res.status(404).json({
          success: false,
          message: err.message,
        });
        return;
      }

      console.error('[SalesOrderController] Error deleting sales order:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to delete Sales Order',
        error: err.message,
      });
    }
  }

  /**
   * Convert WON Opportunity to Sales Order
   * @route POST /api/v1/sales-orders/convert-from-opportunity
   */
  async convertFromOpportunity(req: Request, res: Response): Promise<void> {
    try {
      const { opportunityId, projectName, topDays, signedDate, idempotencyKey } = req.body;

      // Validation
      if (!opportunityId) {
        res.status(400).json({
          success: false,
          message: 'opportunityId is required',
        });
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      // Get token from headers
      const token = req.headers.authorization?.replace('Bearer ', '') || '';

      const result = await salesOrderConversionService.convertOpportunityToSalesOrder(
        {
          opportunityId,
          projectName,
          topDays,
          signedDate,
          idempotencyKey: idempotencyKey || req.headers['x-idempotency-key'] as string,
        },
        userId,
        token
      );

      res.status(201).json({
        success: true,
        message: result.message || 'Sales Order conversion completed',
        data: {
          soId: result.soId,
          soNumber: result.soNumber,
          projectId: result.projectId,
          estimationId: result.estimationId,
          pdfUrl: result.pdfUrl,
          status: result.status,
        },
      });
    } catch (error) {
      const err = error as Error;

      // Handle specific errors
      if (err.message === 'Opportunity not found') {
        res.status(404).json({
          success: false,
          message: err.message,
        });
        return;
      }

      if (err.message === 'Only WON opportunities can be converted to Sales Order') {
        res.status(403).json({
          success: false,
          message: err.message,
        });
        return;
      }

      if (err.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: err.message,
        });
        return;
      }

      console.error('[SalesOrderController] Error converting opportunity to SO:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to convert opportunity to Sales Order',
        error: err.message,
      });
    }
  }

  /**
   * Get Sales Order by Opportunity ID
   * @route GET /api/v1/sales-orders/by-opportunity/:opportunityId
   */
  async getByOpportunityId(req: Request, res: Response): Promise<void> {
    try {
      const { opportunityId } = req.params;

      const salesOrder = await salesOrderConversionService.getSalesOrderByOpportunity(opportunityId);

      if (!salesOrder) {
        res.status(404).json({
          success: false,
          message: 'Sales Order not found for this opportunity',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: salesOrder,
      });
    } catch (error) {
      const err = error as Error;
      console.error('[SalesOrderController] Error fetching SO by opportunity:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Sales Order',
        error: err.message,
      });
    }
  }
}

export default new SalesOrderController();
