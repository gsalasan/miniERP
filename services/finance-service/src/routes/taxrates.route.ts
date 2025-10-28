import express from "express";
<<<<<<< HEAD
import { 
  getTaxRates, 
  getTaxRateById,
  createTaxRate, 
  updateTaxRate, 
  deleteTaxRate 
} from "../controllers/taxrates.controllers";

const router = express.Router();

router.get("/tax-rates", getTaxRates);
router.get("/tax-rates/:id", getTaxRateById);
router.post("/tax-rates", createTaxRate);
router.put("/tax-rates/:id", updateTaxRate);
router.delete("/tax-rates/:id", deleteTaxRate);
=======
import {
  getTaxRates,
  getTaxRateById,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
} from "../controllers/taxrates.controllers";
import { verifyToken } from "../middlewares/auth.middlewares";

const router = express.Router();

// Tax Rates routes
router.get("/tax-rates", verifyToken, getTaxRates);
router.get("/tax-rates/:id", verifyToken, getTaxRateById);
router.post("/tax-rates", verifyToken, createTaxRate);
router.put("/tax-rates/:id", verifyToken, updateTaxRate);
router.delete("/tax-rates/:id", verifyToken, deleteTaxRate);
>>>>>>> main

export default router;
