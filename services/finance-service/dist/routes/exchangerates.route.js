"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const exchangerates_controllers_1 = require("../controllers/exchangerates.controllers");
const auth_middlewares_1 = require("../middlewares/auth.middlewares");
const router = express_1.default.Router();
// Exchange Rates routes
router.get("/exchange-rates", auth_middlewares_1.verifyToken, exchangerates_controllers_1.getExchangeRates);
router.get("/exchange-rates/:currency_code", auth_middlewares_1.verifyToken, exchangerates_controllers_1.getExchangeRateByCode);
router.post("/exchange-rates", auth_middlewares_1.verifyToken, exchangerates_controllers_1.createExchangeRate);
router.put("/exchange-rates/:currency_code", auth_middlewares_1.verifyToken, exchangerates_controllers_1.updateExchangeRate);
router.delete("/exchange-rates/:currency_code", auth_middlewares_1.verifyToken, exchangerates_controllers_1.deleteExchangeRate);
router.post("/exchange-rates/bulk-update", auth_middlewares_1.verifyToken, exchangerates_controllers_1.bulkUpdateExchangeRates);
exports.default = router;
