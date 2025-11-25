import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import {
  getAllCustomerContacts,
  getCustomerContactById,
  getCustomerContactsByCustomerId,
  createCustomerContact,
  createCustomerContactForCustomer,
  updateCustomerContact,
  deleteCustomerContact,
} from '../controllers/customerContactsController';

const router = Router();

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

export default router;
