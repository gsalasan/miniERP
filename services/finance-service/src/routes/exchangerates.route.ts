import express from "express";
import { 
  getExchangeRates, 
  getExchangeRateById,
  getLatestExchangeRate,
  createExchangeRate, 
  updateExchangeRate, 
  deleteExchangeRate 
} from "../controllers/exchangerates.controllers";

const router = express.Router();

router.get("/exchange-rates", getExchangeRates);
router.get("/exchange-rates/latest", getLatestExchangeRate);
router.get("/exchange-rates/:id", getExchangeRateById);
router.post("/exchange-rates", createExchangeRate);
router.put("/exchange-rates/:id", updateExchangeRate);
router.delete("/exchange-rates/:id", deleteExchangeRate);

export default router;
