"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pricingrules_controllers_1 = require("../controllers/pricingrules.controllers");
const router = express_1.default.Router();
// GET all pricing rules
router.get('/', pricingrules_controllers_1.getAllPricingRules);
// GET pricing rule by ID
router.get('/:id', pricingrules_controllers_1.getPricingRuleById);
// GET pricing rule by category
router.get('/category/:category', pricingrules_controllers_1.getPricingRuleByCategory);
// POST create new pricing rule
router.post('/', pricingrules_controllers_1.createPricingRule);
// PUT update pricing rule
router.put('/:id', pricingrules_controllers_1.updatePricingRule);
// DELETE pricing rule
router.delete('/:id', pricingrules_controllers_1.deletePricingRule);
exports.default = router;
