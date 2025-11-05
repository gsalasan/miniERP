import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerControllers";
import { deleteCustomerContact } from "../controllers/customerContactsController";

const router = Router();

// GET /api/v1/customers
router.get('/', getAllCustomers);
router.get("/test", getAllCustomers);
router.get("/:id", getCustomerById);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

// Delete customer contact via customer ID
router.delete("/:customerId/contacts/:contactId", deleteCustomerContact);

export default router;