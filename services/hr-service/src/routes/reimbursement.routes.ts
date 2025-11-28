import { Router } from 'express';
import { ReimbursementController } from '../controllers/reimbursement.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const reimbursementController = new ReimbursementController();

// All routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/v1/reimbursements
 * @desc    Create a new reimbursement request
 * @access  Private (Employee)
 * @body    { reimbursement_type, claim_date, amount, currency?, description, receipt_file? }
 */
router.post('/', (req, res) => reimbursementController.createReimbursement(req, res));

/**
 * @route   GET /api/v1/reimbursements/my
 * @desc    Get my reimbursement requests
 * @access  Private (Employee)
 */
router.get('/my', (req, res) => reimbursementController.getMyReimbursements(req, res));

/**
 * @route   GET /api/v1/reimbursements/summary
 * @desc    Get reimbursement summary for finance
 * @access  Private (HR/Finance)
 * @query   month (format: YYYY-MM), employeeId
 */
router.get('/summary', (req, res) => reimbursementController.getReimbursementSummary(req, res));

/**
 * @route   GET /api/v1/reimbursements
 * @desc    Get all reimbursement requests (HR/Manager)
 * @access  Private (HR/Manager)
 */
router.get('/', (req, res) => reimbursementController.getAllReimbursements(req, res));

/**
 * @route   GET /api/v1/reimbursements/:id
 * @desc    Get reimbursement request by ID
 * @access  Private
 */
router.get('/:id', (req, res) => reimbursementController.getReimbursementById(req, res));

/**
 * @route   PUT /api/v1/reimbursements/:id/status
 * @desc    Approve/Reject reimbursement request
 * @access  Private (HR/Manager)
 */
router.put('/:id/status', (req, res) => reimbursementController.updateReimbursementStatus(req, res));

/**
 * @route   POST /api/v1/reimbursements/:id/paid
 * @desc    Mark reimbursement as paid
 * @access  Private (Finance)
 */
router.post('/:id/paid', (req, res) => reimbursementController.markReimbursementPaid(req, res));

/**
 * @route   POST /api/v1/reimbursements/:id/cancel
 * @desc    Cancel reimbursement request
 * @access  Private (Employee - own request only)
 */
router.post('/:id/cancel', (req, res) => reimbursementController.cancelReimbursement(req, res));

export default router;
