import { Router } from 'express';
import quotationController from '../controllers/quotationController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Apply auth middleware to all quotation routes
router.use(verifyToken);

/**
 * @route GET /quotations/:opportunityId
 * @desc Get quotation data for PDF generation
 * @access Private (requires authentication)
 */
router.get('/:opportunityId', quotationController.getQuotation);

export default router;
