"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDiscountPolicy = exports.updateDiscountPolicy = exports.createDiscountPolicy = exports.getDiscountPolicyByRole = exports.getDiscountPolicyById = exports.getAllDiscountPolicies = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// GET all discount policies
const getAllDiscountPolicies = async (req, res) => {
    try {
        const policies = await prisma.discount_policies.findMany({
            orderBy: { id: "asc" },
        });
        res.status(200).json(policies);
    }
    catch (error) {
        console.error("Error fetching discount policies:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            message: "Failed to fetch discount policies",
            error: errMsg,
        });
    }
};
exports.getAllDiscountPolicies = getAllDiscountPolicies;
// GET discount policy by ID
const getDiscountPolicyById = async (req, res) => {
    try {
        const { id } = req.params;
        const policyId = Number.parseInt(id);
        if (Number.isNaN(policyId)) {
            res.status(400).json({
                message: "ID must be a number",
            });
            return;
        }
        const policy = await prisma.discount_policies.findUnique({
            where: { id: policyId },
        });
        if (!policy) {
            res.status(404).json({
                message: "Discount policy not found",
            });
            return;
        }
        res.status(200).json(policy);
    }
    catch (error) {
        console.error("Error fetching discount policy:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            message: "Failed to fetch discount policy",
            error: errMsg,
        });
    }
};
exports.getDiscountPolicyById = getDiscountPolicyById;
// GET discount policy by user role
const getDiscountPolicyByRole = async (req, res) => {
    try {
        const { role } = req.params;
        // Validate role
        if (!Object.values(client_1.UserRole).includes(role)) {
            res.status(400).json({
                message: "Invalid user role",
            });
            return;
        }
        const policy = await prisma.discount_policies.findUnique({
            where: { user_role: role },
        });
        if (!policy) {
            res.status(404).json({
                message: "Discount policy not found for this role",
            });
            return;
        }
        res.status(200).json(policy);
    }
    catch (error) {
        console.error("Error fetching discount policy by role:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            message: "Failed to fetch discount policy by role",
            error: errMsg,
        });
    }
};
exports.getDiscountPolicyByRole = getDiscountPolicyByRole;
// POST create new discount policy
const createDiscountPolicy = async (req, res) => {
    try {
        const { user_role, max_discount_percentage, requires_approval_above } = req.body;
        // Validation
        if (!user_role || max_discount_percentage === undefined || max_discount_percentage === null) {
            res.status(400).json({
                message: "user_role and max_discount_percentage are required",
            });
            return;
        }
        // Validate role
        if (!Object.values(client_1.UserRole).includes(user_role)) {
            res.status(400).json({
                message: "Invalid user role",
            });
            return;
        }
        // Validate max_discount_percentage range
        const maxDiscountValue = Number(max_discount_percentage);
        if (maxDiscountValue < 0) {
            res.status(400).json({
                message: "Max discount percentage cannot be negative",
            });
            return;
        }
        if (maxDiscountValue > 100) {
            res.status(400).json({
                message: "Max discount percentage cannot exceed 100",
            });
            return;
        }
        // Validate requires_approval_above if provided
        if (requires_approval_above !== undefined && requires_approval_above !== null) {
            const approvalValue = Number(requires_approval_above);
            if (approvalValue < 0) {
                res.status(400).json({
                    message: "Approval threshold cannot be negative",
                });
                return;
            }
            if (approvalValue > 100) {
                res.status(400).json({
                    message: "Approval threshold cannot exceed 100",
                });
                return;
            }
            // Approval threshold should not exceed max discount
            if (approvalValue > maxDiscountValue) {
                res.status(400).json({
                    message: "Approval threshold cannot exceed max discount percentage",
                });
                return;
            }
        }
        // Check if policy for this role already exists
        const existingPolicy = await prisma.discount_policies.findUnique({
            where: { user_role: user_role },
        });
        if (existingPolicy) {
            res.status(400).json({
                message: "Discount policy for this role already exists",
            });
            return;
        }
        const newPolicy = await prisma.discount_policies.create({
            data: {
                user_role: user_role,
                max_discount_percentage: maxDiscountValue,
                requires_approval_above: requires_approval_above !== undefined && requires_approval_above !== null
                    ? Number(requires_approval_above)
                    : null,
            },
        });
        res.status(201).json(newPolicy);
    }
    catch (error) {
        console.error("Error creating discount policy:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            message: "Failed to create discount policy",
            error: errMsg,
        });
    }
};
exports.createDiscountPolicy = createDiscountPolicy;
// PUT update discount policy
const updateDiscountPolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const policyId = Number.parseInt(id);
        if (Number.isNaN(policyId)) {
            res.status(400).json({
                message: "ID must be a number",
            });
            return;
        }
        const { user_role, max_discount_percentage, requires_approval_above } = req.body;
        // Validation - at least one field must be provided
        if (!user_role && max_discount_percentage === undefined && requires_approval_above === undefined) {
            res.status(400).json({
                message: "At least one field must be provided for update",
            });
            return;
        }
        // Validate role if provided
        if (user_role && !Object.values(client_1.UserRole).includes(user_role)) {
            res.status(400).json({
                message: "Invalid user role",
            });
            return;
        }
        // Check if policy exists
        const existingPolicy = await prisma.discount_policies.findUnique({
            where: { id: policyId },
        });
        if (!existingPolicy) {
            res.status(404).json({
                message: "Discount policy not found",
            });
            return;
        }
        // Determine the max discount value for validation
        const maxDiscountValue = max_discount_percentage !== undefined && max_discount_percentage !== null
            ? Number(max_discount_percentage)
            : Number(existingPolicy.max_discount_percentage.toString());
        // Validate max_discount_percentage if provided
        if (max_discount_percentage !== undefined && max_discount_percentage !== null) {
            const value = Number(max_discount_percentage);
            if (value < 0) {
                res.status(400).json({
                    message: "Max discount percentage cannot be negative",
                });
                return;
            }
            if (value > 100) {
                res.status(400).json({
                    message: "Max discount percentage cannot exceed 100",
                });
                return;
            }
        }
        // Validate requires_approval_above if provided
        if (requires_approval_above !== undefined && requires_approval_above !== null) {
            const approvalValue = Number(requires_approval_above);
            if (approvalValue < 0) {
                res.status(400).json({
                    message: "Approval threshold cannot be negative",
                });
                return;
            }
            if (approvalValue > 100) {
                res.status(400).json({
                    message: "Approval threshold cannot exceed 100",
                });
                return;
            }
            // Approval threshold should not exceed max discount
            if (approvalValue > maxDiscountValue) {
                res.status(400).json({
                    message: "Approval threshold cannot exceed max discount percentage",
                });
                return;
            }
        }
        // If role is being updated, check if new role already exists
        if (user_role && user_role !== existingPolicy.user_role) {
            const roleExists = await prisma.discount_policies.findUnique({
                where: { user_role: user_role },
            });
            if (roleExists) {
                res.status(400).json({
                    message: "Discount policy for this role already exists",
                });
                return;
            }
        }
        const updatedPolicy = await prisma.discount_policies.update({
            where: { id: policyId },
            data: {
                ...(user_role && { user_role: user_role }),
                ...(max_discount_percentage !== undefined && max_discount_percentage !== null && {
                    max_discount_percentage: Number(max_discount_percentage)
                }),
                ...(requires_approval_above !== undefined && {
                    requires_approval_above: requires_approval_above !== null ? Number(requires_approval_above) : null
                }),
            },
        });
        res.status(200).json(updatedPolicy);
    }
    catch (error) {
        console.error("Error updating discount policy:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            message: "Failed to update discount policy",
            error: errMsg,
        });
    }
};
exports.updateDiscountPolicy = updateDiscountPolicy;
// DELETE discount policy
const deleteDiscountPolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const policyId = Number.parseInt(id);
        if (Number.isNaN(policyId)) {
            res.status(400).json({
                message: "ID must be a number",
            });
            return;
        }
        // Check if policy exists
        const existingPolicy = await prisma.discount_policies.findUnique({
            where: { id: policyId },
        });
        if (!existingPolicy) {
            res.status(404).json({
                message: "Discount policy not found",
            });
            return;
        }
        await prisma.discount_policies.delete({
            where: { id: policyId },
        });
        res.status(200).json({
            message: "Discount policy deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting discount policy:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            message: "Failed to delete discount policy",
            error: errMsg,
        });
    }
};
exports.deleteDiscountPolicy = deleteDiscountPolicy;
