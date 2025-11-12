"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmployees = exports.createEmployee = void 0;
const employee_service_1 = require("../services/employee.service");
// POST /employees - Create employee with user account
const createEmployee = async (req, res) => {
    try {
        // Validate request body structure
        if (!req.body.employee || !req.body.user || !req.body.email) {
            return res.status(400).json({
                success: false,
                message: 'Request body must contain "employee", "user", and "email" fields'
            });
        }
        // Validate required fields
        const validationErrors = (0, employee_service_1.validateEmployeeUserData)(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: validationErrors
            });
        }
        // Create employee and user in transaction
        const result = await (0, employee_service_1.createEmployeeWithUser)(req.body);
        return res.status(201).json({
            success: true,
            message: 'Employee and user account created successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Error in createEmployee controller:', error);
        // Handle known business logic errors
        if (error.message.includes('Email sudah terdaftar')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        if (error.message.includes('position must be one of')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        // Handle validation errors
        if (error.message.includes('Validation')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        // Handle other errors
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.createEmployee = createEmployee;
// GET /employees - List employees (optional, for testing)
const getEmployees = async (req, res) => {
    try {
        // This is a simple endpoint for testing purposes
        return res.status(200).json({
            success: true,
            message: 'Employee endpoint is working',
            note: 'This would return employee list in full implementation'
        });
    }
    catch (error) {
        console.error('Error in getEmployees:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getEmployees = getEmployees;
//# sourceMappingURL=employee.controller.js.map