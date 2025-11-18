"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const overheadallocations_controllers_1 = require("../controllers/overheadallocations.controllers");
const router = express_1.default.Router();
// GET all overhead allocations
router.get('/', overheadallocations_controllers_1.getAllOverheadAllocations);
// GET overhead allocation by ID
router.get('/:id', overheadallocations_controllers_1.getOverheadAllocationById);
// GET overhead allocation by category
router.get('/category/:category', overheadallocations_controllers_1.getOverheadAllocationByCategory);
// POST create new overhead allocation
router.post('/', overheadallocations_controllers_1.createOverheadAllocation);
// PUT update overhead allocation
router.put('/:id', overheadallocations_controllers_1.updateOverheadAllocation);
// DELETE overhead allocation
router.delete('/:id', overheadallocations_controllers_1.deleteOverheadAllocation);
exports.default = router;
