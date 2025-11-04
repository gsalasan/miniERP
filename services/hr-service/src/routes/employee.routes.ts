import express from 'express';
import { 
  createEmployee, 
  getEmployees,
  listAllEmployees,
  // debug endpoint
  listDebugEmployees,
  getEmployeeByIdCtrl,
  updateEmployeeCtrl,
  updateEmployeeUserCtrl,
  deleteEmployeeCtrl
} from '../controllers/employee.controller';

const router = express.Router();

// ========== POST (CREATE) ==========
// POST /api/v1/employees - Create employee with user account
router.post('/employees', createEmployee);

// ========== GET (READ) ==========
// GET /api/v1/employees - List all employees (old endpoint, for backward compatibility)
router.get('/employees', getEmployees);

// GET /api/v1/employees/list - Get all employees with details
router.get('/employees/list/all', listAllEmployees);

// Debug endpoint: return counts and sample rows from both tables
router.get('/employees/debug', listDebugEmployees);

// GET /api/v1/employees/:id - Get employee by ID
router.get('/employees/:id', getEmployeeByIdCtrl);

// ========== PUT (UPDATE) ==========
// PUT /api/v1/employees/:id - Update employee data
router.put('/employees/:id', updateEmployeeCtrl);

// PUT /api/v1/employees/:id/user - Update employee user (roles, status)
router.put('/employees/:id/user', updateEmployeeUserCtrl);

// ========== DELETE ==========
// DELETE /api/v1/employees/:id - Delete employee and associated user
router.delete('/employees/:id', deleteEmployeeCtrl);

export default router;