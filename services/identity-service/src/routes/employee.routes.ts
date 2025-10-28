import express from 'express';
import { createEmployee, getEmployees } from '../controllers/employee.controller';

const router = express.Router();

// POST /employees - Create employee with user account
router.post('/employees', createEmployee);

// GET /employees - List employees (for testing)
router.get('/employees', getEmployees);

export default router;