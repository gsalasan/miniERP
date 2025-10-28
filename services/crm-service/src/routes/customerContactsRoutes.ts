<<<<<<< HEAD
import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middlleware';
=======
import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middlleware";
>>>>>>> main
import {
  getAllCustomerContacts,
  getCustomerContactById,
  getCustomerContactsByCustomerId,
  createCustomerContact,
  createCustomerContactForCustomer,
  updateCustomerContact,
  deleteCustomerContact,
<<<<<<< HEAD
} from '../controllers/customerContactsController';
=======
} from "../controllers/customerContactsController";
>>>>>>> main

const router = Router();

// GET /api/v1/customer-contacts - Get all customer contacts
<<<<<<< HEAD
router.get('/', verifyToken, getAllCustomerContacts);

// GET /api/v1/customer-contacts/:id - Get customer contact by ID
router.get('/:id', verifyToken, getCustomerContactById);

// POST /api/v1/customer-contacts - Create new customer contact
router.post('/', verifyToken, createCustomerContact);

// PUT /api/v1/customer-contacts/:id - Update customer contact
router.put('/:id', verifyToken, updateCustomerContact);

// DELETE /api/v1/customer-contacts/:id - Delete customer contact
router.delete('/:id', verifyToken, deleteCustomerContact);

// GET /api/v1/customers/:customerId/contacts - Get contacts by customer ID
router.get(
  '/customer/:customerId',
  verifyToken,
  getCustomerContactsByCustomerId
);

// POST /api/v1/customers/:customerId/contacts - Create contact for specific customer
router.post(
  '/customer/:customerId',
  verifyToken,
  createCustomerContactForCustomer
);
=======
router.get("/", verifyToken, getAllCustomerContacts);

// GET /api/v1/customer-contacts/:id - Get customer contact by ID
router.get("/:id", verifyToken, getCustomerContactById);

// POST /api/v1/customer-contacts - Create new customer contact
router.post("/", verifyToken, createCustomerContact);

// PUT /api/v1/customer-contacts/:id - Update customer contact
router.put("/:id", verifyToken, updateCustomerContact);

// DELETE /api/v1/customer-contacts/:id - Delete customer contact
router.delete("/:id", verifyToken, deleteCustomerContact);

// GET /api/v1/customers/:customerId/contacts - Get contacts by customer ID
router.get("/customer/:customerId", verifyToken, getCustomerContactsByCustomerId);

// POST /api/v1/customers/:customerId/contacts - Create contact for specific customer
router.post("/customer/:customerId", verifyToken, createCustomerContactForCustomer);
>>>>>>> main

export default router;
