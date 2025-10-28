import express from "express";
import {
  getExchangeRates,
  getExchangeRateByCode,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate,
  bulkUpdateExchangeRates,
} from "../controllers/exchangerates.controllers";
import { verifyToken } from "../middlewares/auth.middlewares";

const router = express.Router();

// Exchange Rates routes
router.get("/exchange-rates", verifyToken, getExchangeRates);
router.get("/exchange-rates/:currency_code", verifyToken, getExchangeRateByCode);
router.post("/exchange-rates", verifyToken, createExchangeRate);
router.put("/exchange-rates/:currency_code", verifyToken, updateExchangeRate);
router.delete("/exchange-rates/:currency_code", verifyToken, deleteExchangeRate);
router.post("/exchange-rates/bulk-update", verifyToken, bulkUpdateExchangeRates);

export default router;
