import express from 'express';
import {
  getPayables,
  getAPSummary,
  createPayable,
  recordPayablePayment,
  uploadPaymentProof,
} from '../controllers/payables.controllers';

const router = express.Router();

// GET AP summary - MUST BE BEFORE /:id
router.get('/summary/ap', getAPSummary);

// GET all payables
router.get('/', getPayables);

// POST create payable (with 3-way matching)
router.post('/', createPayable);

// POST record payment with file upload
router.post('/:id/payments', uploadPaymentProof.single('payment_proof'), recordPayablePayment);

export default router;
