import { Router } from 'express';
import {
  getAllPOs,
  getPOById,
  createPO,
  updatePOStatus,
  deletePO,
} from '../controllers/poControllers';

const router = Router();

// PO routes
router.get('/', getAllPOs);
router.get('/:id', getPOById);
router.post('/', createPO);
router.patch('/:id/status', updatePOStatus);
router.delete('/:id', deletePO);

export default router;
