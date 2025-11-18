"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chartofaccounts_controllers_1 = require("../controllers/chartofaccounts.controllers");
// import { verifyToken } from "../middlewares/auth.middlewares"; // Temporarily disabled for testing
const router = express_1.default.Router();
// CRUD Routes for Chart of Accounts
router.get("/chart-of-accounts", chartofaccounts_controllers_1.getChartOfAccounts);
router.get("/chart-of-accounts/:id", chartofaccounts_controllers_1.getChartOfAccountById);
router.post("/chart-of-accounts", chartofaccounts_controllers_1.createChartOfAccount);
router.put("/chart-of-accounts/:id", chartofaccounts_controllers_1.updateChartOfAccount);
router.delete("/chart-of-accounts/:id", chartofaccounts_controllers_1.deleteChartOfAccount);
exports.default = router;
