import express from "express";
import { 
  getInvoices, 
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
} from "../controllers/invoices.controllers";

const router = express.Router();

// GET all invoices (dengan query params: status, customer_name, page, limit)
router.get("/invoices", getInvoices);

// GET invoice by ID
router.get("/invoices/:id", getInvoiceById);

// POST create new invoice
router.post("/invoices", createInvoice);

// PUT update invoice
router.put("/invoices/:id", updateInvoice);

// DELETE invoice
router.delete("/invoices/:id", deleteInvoice);

export default router;
