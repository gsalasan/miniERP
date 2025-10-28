"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const employee_controller_1 = require("../controllers/employee.controller");
const router = express_1.default.Router();
// ========== POST (CREATE) ==========
// POST /api/v1/employees - Create employee with user account
router.post('/employees', employee_controller_1.createEmployee);
// ========== GET (READ) ==========
// GET /api/v1/employees - List all employees (old endpoint, for backward compatibility)
router.get('/employees', employee_controller_1.getEmployees);
// GET /api/v1/employees/list - Get all employees with details
router.get('/employees/list/all', employee_controller_1.listAllEmployees);
// GET /api/v1/employees/:id - Get employee by ID
router.get('/employees/:id', employee_controller_1.getEmployeeByIdCtrl);
// ========== PUT (UPDATE) ==========
// PUT /api/v1/employees/:id - Update employee data
router.put('/employees/:id', employee_controller_1.updateEmployeeCtrl);
// PUT /api/v1/employees/:id/user - Update employee user (roles, status)
router.put('/employees/:id/user', employee_controller_1.updateEmployeeUserCtrl);
// ========== DELETE ==========
// DELETE /api/v1/employees/:id - Delete employee and associated user
router.delete('/employees/:id', employee_controller_1.deleteEmployeeCtrl);
exports.default = router;
//# sourceMappingURL=employee.routes.js.map