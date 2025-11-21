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

/**
 * @route POST /quotations/generate
 * @desc Generate quotation with discount
 * @access Private (requires authentication)
 */
router.post('/generate', quotationController.generateQuotation);

/**
 * @route GET /quotations/project/:projectId
 * @desc Get all quotations for a project
 * @access Private (requires authentication)
 */
router.get('/project/:projectId', quotationController.getQuotationsByProject);

export default router;

