import express from "express";
import {
  getAllPaymentTerms,
  getPaymentTermById,
  getPaymentTermByCode,
  createPaymentTerm,
  updatePaymentTerm,
  deletePaymentTerm,
} from "../controllers/paymentterms.controllers";

const router = express.Router();

// Payment Terms Routes
router.get("/payment-terms", getAllPaymentTerms);
router.get("/payment-terms/:id", getPaymentTermById);
router.get("/payment-terms/code/:code", getPaymentTermByCode);
router.post("/payment-terms", createPaymentTerm);
router.put("/payment-terms/:id", updatePaymentTerm);
router.delete("/payment-terms/:id", deletePaymentTerm);

export default router;
