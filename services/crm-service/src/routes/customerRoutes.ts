<<<<<<< HEAD
import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middlleware';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerControllers';
=======
import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware";
import { getAllCustomers } from "../controllers/customerController";
>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987

const router = Router();

// GET /api/v1/customers
<<<<<<< HEAD
router.get('/', verifyToken, getAllCustomers);

// GET /api/v1/customers/:id
router.get('/:id', verifyToken, getCustomerById);

// POST /api/v1/customers
router.post('/', verifyToken, createCustomer);

// PUT /api/v1/customers/:id
router.put('/:id', verifyToken, updateCustomer);

// DELETE /api/v1/customers/:id
router.delete('/:id', verifyToken, deleteCustomer);
=======
router.get("/", verifyToken, getAllCustomers);
>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987

export default router;
