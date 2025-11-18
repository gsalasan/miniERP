"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taxrates_controllers_1 = require("../controllers/taxrates.controllers");
const auth_middlewares_1 = require("../middlewares/auth.middlewares");
const router = express_1.default.Router();
// Tax Rates routes
router.get("/tax-rates", auth_middlewares_1.verifyToken, taxrates_controllers_1.getTaxRates);
router.get("/tax-rates/:id", auth_middlewares_1.verifyToken, taxrates_controllers_1.getTaxRateById);
router.post("/tax-rates", auth_middlewares_1.verifyToken, taxrates_controllers_1.createTaxRate);
router.put("/tax-rates/:id", auth_middlewares_1.verifyToken, taxrates_controllers_1.updateTaxRate);
router.delete("/tax-rates/:id", auth_middlewares_1.verifyToken, taxrates_controllers_1.deleteTaxRate);
exports.default = router;
