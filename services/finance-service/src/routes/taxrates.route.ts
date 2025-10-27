import express from "express";
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

export default router;
