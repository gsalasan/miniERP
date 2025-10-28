"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployeeCtrl = exports.updateEmployeeUserCtrl = exports.updateEmployeeCtrl = exports.getEmployeeByIdCtrl = exports.listAllEmployees = exports.getEmployees = exports.createEmployee = void 0;
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
// ========== GET ALL EMPLOYEES ==========
const listAllEmployees = async (req, res) => {
    try {
        const employees = await (0, employee_service_1.getAllEmployees)();
        return res.status(200).json({
            success: true,
            message: 'Employee list retrieved successfully',
            data: employees
        });
    }
    catch (error) {
        console.error('Error in listAllEmployees:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.listAllEmployees = listAllEmployees;
// ========== GET EMPLOYEE BY ID ==========
const getEmployeeByIdCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }
        const employee = await (0, employee_service_1.getEmployeeById)(id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee tidak ditemukan'
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Employee retrieved successfully',
            data: employee
        });
    }
    catch (error) {
        console.error('Error in getEmployeeByIdCtrl:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getEmployeeByIdCtrl = getEmployeeByIdCtrl;
// ========== UPDATE EMPLOYEE ==========
const updateEmployeeCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, position, hire_date, basic_salary, allowances } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }
        if (!full_name && !position && !hire_date && !basic_salary && !allowances) {
            return res.status(400).json({
                success: false,
                message: 'At least one field must be provided for update'
            });
        }
        const updatedEmployee = await (0, employee_service_1.updateEmployee)(id, {
            full_name,
            position,
            hire_date,
            basic_salary,
            allowances
        });
        return res.status(200).json({
            success: true,
            message: 'Employee updated successfully',
            data: updatedEmployee
        });
    }
    catch (error) {
        console.error('Error in updateEmployeeCtrl:', error);
        if (error.message.includes('tidak ditemukan')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.updateEmployeeCtrl = updateEmployeeCtrl;
// ========== UPDATE EMPLOYEE USER (Roles & Status) ==========
const updateEmployeeUserCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const { roles, is_active } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }
        if (roles === undefined && is_active === undefined) {
            return res.status(400).json({
                success: false,
                message: 'At least one field (roles or is_active) must be provided'
            });
        }
        const updatedUser = await (0, employee_service_1.updateEmployeeUser)(id, {
            roles,
            is_active
        });
        return res.status(200).json({
            success: true,
            message: 'Employee user updated successfully',
            data: updatedUser
        });
    }
    catch (error) {
        console.error('Error in updateEmployeeUserCtrl:', error);
        if (error.message.includes('tidak ditemukan')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error.message.includes('Invalid roles')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.updateEmployeeUserCtrl = updateEmployeeUserCtrl;
// ========== DELETE EMPLOYEE ==========
const deleteEmployeeCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }
        const result = await (0, employee_service_1.deleteEmployee)(id);
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result
        });
    }
    catch (error) {
        console.error('Error in deleteEmployeeCtrl:', error);
        if (error.message.includes('tidak ditemukan')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.deleteEmployeeCtrl = deleteEmployeeCtrl;
//# sourceMappingURL=employee.controller.js.map