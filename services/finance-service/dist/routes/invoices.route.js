"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const invoices_controllers_1 = require("../controllers/invoices.controllers");
const router = express_1.default.Router();
// GET all invoices (dengan query params: status, customer_name, page, limit)
router.get("/invoices", invoices_controllers_1.getInvoices);
// GET invoice by ID
router.get("/invoices/:id", invoices_controllers_1.getInvoiceById);
// POST create new invoice
router.post("/invoices", invoices_controllers_1.createInvoice);
// PUT update invoice
router.put("/invoices/:id", invoices_controllers_1.updateInvoice);
// DELETE invoice
router.delete("/invoices/:id", invoices_controllers_1.deleteInvoice);
exports.default = router;
