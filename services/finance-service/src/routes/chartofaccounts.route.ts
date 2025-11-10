import express from "express";
import { 
  getChartOfAccounts, 
  getChartOfAccountById,
  createChartOfAccount, 
  updateChartOfAccount, 
  deleteChartOfAccount 
} from "../controllers/chartofaccounts.controllers";
// import { verifyToken } from "../middlewares/auth.middlewares"; // Temporarily disabled for testing

const router = express.Router();

// CRUD Routes for Chart of Accounts
router.get("/chart-of-accounts", getChartOfAccounts);
router.get("/chart-of-accounts/:id", getChartOfAccountById);
router.post("/chart-of-accounts", createChartOfAccount);
router.put("/chart-of-accounts/:id", updateChartOfAccount);
router.delete("/chart-of-accounts/:id", deleteChartOfAccount);

export default router;
