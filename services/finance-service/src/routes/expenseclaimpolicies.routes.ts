import express from "express";
import {
  getAllExpenseClaimPolicies,
  getExpenseClaimPolicyById,
  createExpenseClaimPolicy,
  updateExpenseClaimPolicy,
  deleteExpenseClaimPolicy,
} from "../controllers/expenseclaimpolicies.controllers";

const router = express.Router();

// Expense Claim Policies Routes
router.get("/expense-claim-policies", getAllExpenseClaimPolicies);
router.get("/expense-claim-policies/:id", getExpenseClaimPolicyById);
router.post("/expense-claim-policies", createExpenseClaimPolicy);
router.put("/expense-claim-policies/:id", updateExpenseClaimPolicy);
router.delete("/expense-claim-policies/:id", deleteExpenseClaimPolicy);

export default router;
