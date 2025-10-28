import { Router } from "express";
<<<<<<< HEAD
import { verifyToken } from "../middlewares/authMiddleware";
import { getAllCustomers } from "../controllers/customerController";

const router = Router();

// GET /api/v1/customers
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

export default router;
