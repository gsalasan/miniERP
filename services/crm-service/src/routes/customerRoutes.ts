import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware";
import { getAllCustomers } from "../controllers/customerController";

const router = Router();

// GET /api/v1/customers
router.get("/", verifyToken, getAllCustomers);

export default router;
