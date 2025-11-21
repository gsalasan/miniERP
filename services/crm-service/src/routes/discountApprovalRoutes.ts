import { Router } from 'express';
import discountApprovalController from '../controllers/discountApprovalController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(verifyToken);

/**
 * @route POST /api/v1/estimations/:id/request-discount-approval
 * @desc Sales request discount approval from CEO
 * @access Private (SALES, SALES_MANAGER)
 */
router.post(
  '/:id/request-discount-approval',
  discountApprovalController.requestDiscountApproval
);

/**
 * @route PUT /api/v1/estimations/:id/decide-discount
 * @desc CEO approve or reject discount request
 * @access Private (CEO only)
 */
router.put('/:id/decide-discount', discountApprovalController.decideDiscount);

/**
 * @route GET /api/v1/discount-policies
 * @desc Get discount policies for current user
 * @access Private
 */
router.get(
  '/discount-policies',
  discountApprovalController.getDiscountPolicies
);

export default router;
