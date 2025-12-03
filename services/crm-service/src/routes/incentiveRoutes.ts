import express from 'express';
import { simulateIncentiveController } from '../controllers/incentiveController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(verifyToken);

// POST /api/v1/sales/incentives/simulate
router.post('/simulate', simulateIncentiveController);

export default router;
