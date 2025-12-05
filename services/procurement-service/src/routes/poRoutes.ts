import { Router } from 'express';
import {
  getAllPOs,
  getPOById,
  createPO,
  updatePOStatus,
  deletePO,
} from '../controllers/poControllers';
import {
  submitForApproval,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  getPendingApprovals,
  getThresholds,
} from '../controllers/approvalControllers';
import { generatePOPDF } from '../controllers/pdfControllers';

const router = Router();

// PO routes
router.get('/', getAllPOs);
router.get('/pending-approvals', getPendingApprovals);
router.get('/:id', getPOById);
router.post('/', createPO);
router.patch('/:id/status', updatePOStatus);
router.delete('/:id', deletePO);

// Approval workflow routes
router.post('/:id/submit-for-approval', submitForApproval);
router.post('/:id/approve', approvePurchaseOrder);
router.post('/:id/reject', rejectPurchaseOrder);

// PO PDF generation
router.get('/:id/generate-pdf', generatePOPDF);

// Approval configuration
router.get('/approval-thresholds', getThresholds);

export default router;
