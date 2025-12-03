import { Router } from 'express';
import {
  getAllWOs,
  getWOById,
  createWO,
  updateWOStatus,
  deleteWO,
} from '../controllers/woControllers';

const router = Router();

// WO routes
router.get('/', getAllWOs);
router.get('/:id', getWOById);
router.post('/', createWO);
router.patch('/:id/status', updateWOStatus);
router.delete('/:id', deleteWO);

export default router;
