import { Request, Response } from 'express';
import salesOrderServices from '../services/salesOrderServices';

class SalesOrderController {
  /**
   * POST /api/v1/sales-orders
   * Create Sales Order and mark project as WON
   */
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

      if (!customerPoNumber) {
        res.status(400).json({
          success: false,
          message: 'Customer PO Number is required',
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
        data: result,
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

  /**
   * GET /api/v1/sales-orders/project/:projectId
   * Get Sales Order by project ID
   */
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

  /**
   * GET /api/v1/sales-orders/:id
   * Get Sales Order by ID
   */
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

  /**
   * GET /api/v1/sales-orders
   * Get all Sales Orders
   */
  async getAllSalesOrders(req: Request, res: Response): Promise<void> {
    try {
      const salesOrders = await salesOrderServices.getAllSalesOrders();

      res.status(200).json({
        success: true,
        data: salesOrders,
      });
    } catch (error) {
      const err = error as Error;
      console.error('[SalesOrderController] Error fetching all sales orders:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Sales Orders',
        error: err.message,
      });
    }
  }

  /**
   * PATCH /api/v1/sales-orders/:id/document
   * Update PO document URL for a Sales Order
   */
  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { poDocumentUrl } = req.body as { poDocumentUrl?: string };

      if (!poDocumentUrl || typeof poDocumentUrl !== 'string') {
        res.status(400).json({ success: false, message: 'poDocumentUrl is required' });
       
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User authentication required' });

      const updated = await salesOrderServices.updateSalesOrderDocument(id, poDocumentUrl, userId);
      
        res.status(200).json({ success: true, message: 'PO document updated', data: updated });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Sales Order not found') {
        res.status(404).json({ success: false, message: err.message });
        return;
      }
      console.error('[SalesOrderController] Error updating document:', err);
      res.status(500).json({ success: false, message: 'Failed to update document', error: err.message });
    }
  }
}

export default new SalesOrderController();
