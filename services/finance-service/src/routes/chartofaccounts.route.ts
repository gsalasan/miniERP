import express from "express";
import { 
  getChartOfAccounts, 
  createChartOfAccount, 
  updateChartOfAccount, 
  deleteChartOfAccount 
} from "../controllers/chartofaccounts.controllers";

const router = express.Router();
router.get("/chart-of-accounts", getChartOfAccounts);
router.post("/chart-of-accounts", createChartOfAccount);
router.put("/chart-of-accounts/:id", updateChartOfAccount);
router.delete("/chart-of-accounts/:id", deleteChartOfAccount);

export default router;
