import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
} from "../controllers/customerController";

const router = Router();

// GET /api/v1/customers
router.get("/", verifyToken, getAllCustomers);

// GET /api/v1/customers/:id
router.get("/:id", verifyToken, getCustomerById);

// POST /api/v1/customers
router.post("/", verifyToken, createCustomer);

// PUT /api/v1/customers/:id
router.put("/:id", verifyToken, updateCustomer);

export default router;
