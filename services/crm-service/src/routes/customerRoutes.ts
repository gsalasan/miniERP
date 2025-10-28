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
<<<<<<< HEAD
import { verifyToken } from "../middlewares/authMiddleware";
import { getAllCustomers } from "../controllers/customerController";
>>>>>>> main

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
=======
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerControllers";
import { deleteCustomerContact } from "../controllers/customerContactsController";

const router = Router();

// Test endpoint
router.get("/test", getAllCustomers);

router.get("/", getAllCustomers);
router.get("/:id", getCustomerById);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

// Delete customer contact via customer ID
router.delete("/:customerId/contacts/:contactId", deleteCustomerContact);
>>>>>>> main
>>>>>>> main

export default router;
