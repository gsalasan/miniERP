import { Router } from 'express';
import discountPolicyController from '../controllers/discountPolicyController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(verifyToken);

/**
 * @route GET /api/v1/discount-policies/:role
 * @desc Get discount policy by role
 * @access Private
 */
router.get('/:role', discountPolicyController.getDiscountPolicyByRole);

export default router;
