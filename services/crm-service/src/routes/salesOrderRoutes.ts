import { Router } from 'express';
import salesOrderController from '../controllers/salesOrderController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Apply auth middleware to all routes
router.use(verifyToken);

/**
 * @route GET /api/v1/sales-orders
 * @desc Get all Sales Orders
 * @access Private (requires authentication)
 */
router.get('/', salesOrderController.getAllSalesOrders);

/**
 * @route POST /api/v1/sales-orders
 * @desc Create Sales Order and mark project as WON
 * @access Private (requires authentication)
 */
router.post('/', salesOrderController.createSalesOrder);

/**
 * @route GET /api/v1/sales-orders/project/:projectId
 * @desc Get Sales Order by project ID
 * @access Private (requires authentication)
 */
router.get('/project/:projectId', salesOrderController.getSalesOrderByProject);

/**
 * @route GET /api/v1/sales-orders/:id
 * @desc Get Sales Order by ID
 * @access Private (requires authentication)
 */
router.get('/:id', salesOrderController.getSalesOrderById);

/**
 * @route PATCH /api/v1/sales-orders/:id/document
 * @desc Update PO document URL for a Sales Order
 * @access Private (requires authentication)
 */
router.patch('/:id/document', salesOrderController.updateDocument);

export default router;
