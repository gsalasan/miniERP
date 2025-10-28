import express from "express";
<<<<<<< HEAD
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
=======
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
>>>>>>> main

export default router;
