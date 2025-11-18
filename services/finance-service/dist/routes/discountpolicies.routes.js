"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const discountpolicies_controllers_1 = require("../controllers/discountpolicies.controllers");
const router = express_1.default.Router();
// GET all discount policies
router.get('/', discountpolicies_controllers_1.getAllDiscountPolicies);
// GET discount policy by ID
router.get('/:id', discountpolicies_controllers_1.getDiscountPolicyById);
// GET discount policy by role
router.get('/role/:role', discountpolicies_controllers_1.getDiscountPolicyByRole);
// POST create new discount policy
router.post('/', discountpolicies_controllers_1.createDiscountPolicy);
// PUT update discount policy
router.put('/:id', discountpolicies_controllers_1.updateDiscountPolicy);
// DELETE discount policy
router.delete('/:id', discountpolicies_controllers_1.deleteDiscountPolicy);
exports.default = router;
