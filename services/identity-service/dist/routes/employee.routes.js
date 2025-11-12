"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const employee_controller_1 = require("../controllers/employee.controller");
const router = express_1.default.Router();
// POST /employees - Create employee with user account
router.post('/employees', employee_controller_1.createEmployee);
// GET /employees - List employees (for testing)
router.get('/employees', employee_controller_1.getEmployees);
exports.default = router;
//# sourceMappingURL=employee.routes.js.map