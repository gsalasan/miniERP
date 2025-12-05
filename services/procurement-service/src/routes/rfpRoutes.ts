import { Router } from 'express';
import {
  getAllRFPs,
  getRFPById,
  createRFP,
  updateRFPStatus,
  deleteRFP,
} from '../controllers/rfpControllers';
import { createPOFromRFP } from '../controllers/poControllers';
import { createWOFromRFP } from '../controllers/woControllers';

const router = Router();

// RFP routes
router.get('/', getAllRFPs);
router.get('/:id', getRFPById);
router.post('/', createRFP);
router.patch('/:id/status', updateRFPStatus);
router.delete('/:id', deleteRFP);

// Create PO from RFP
router.post('/:id/create-po', createPOFromRFP);

// Create WO from RFP
router.post('/:id/create-wo', createWOFromRFP);

export default router;
