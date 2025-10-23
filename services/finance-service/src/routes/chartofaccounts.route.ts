import express from "express";
import { getChartOfAccounts } from "../controllers/chartofaccounts.controllers";
import { verifyToken } from "../middlewares/auth.middlewares";

const router = express.Router();
router.get("/chart-of-accounts", verifyToken, getChartOfAccounts);

export default router;
