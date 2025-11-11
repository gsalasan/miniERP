import { Request, Response } from "express";
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// GET all discount policies
export const getAllDiscountPolicies = async (req: Request, res: Response): Promise<void> => {
  try {
    const policies = await prisma.discount_policies.findMany({
      orderBy: { id: "asc" },
    });

    res.status(200).json({
      success: true,
      message: "Discount policies fetched successfully",
      data: policies
    });
  } catch (error) {
    console.error("Error fetching discount policies:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Failed to fetch discount policies",
      error: errMsg,
    });
  }
};

// GET discount policy by ID
export const getDiscountPolicyById = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error("Error fetching discount policy:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      message: "Failed to fetch discount policy",
      error: errMsg,
    });
  }
};

// GET discount policy by user role
export const getDiscountPolicyByRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.params;

    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
      res.status(400).json({
        message: "Invalid user role",
      });
      return;
    }

    const policy = await prisma.discount_policies.findUnique({
      where: { user_role: role as UserRole },
    });

    if (!policy) {
      res.status(404).json({
        message: "Discount policy not found for this role",
      });
      return;
    }

    res.status(200).json(policy);
  } catch (error) {
    console.error("Error fetching discount policy by role:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      message: "Failed to fetch discount policy by role",
      error: errMsg,
    });
  }
};

// POST create new discount policy
export const createDiscountPolicy = async (req: Request, res: Response): Promise<void> => {
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
    if (!Object.values(UserRole).includes(user_role as UserRole)) {
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
      where: { user_role: user_role as UserRole },
    });

    if (existingPolicy) {
      res.status(400).json({
        message: "Discount policy for this role already exists",
      });
      return;
    }

    const newPolicy = await prisma.discount_policies.create({
      data: {
        user_role: user_role as UserRole,
        max_discount_percentage: maxDiscountValue,
        requires_approval_above: requires_approval_above !== undefined && requires_approval_above !== null 
          ? Number(requires_approval_above) 
          : null,
      },
    });

    res.status(201).json(newPolicy);
  } catch (error) {
    console.error("Error creating discount policy:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      message: "Failed to create discount policy",
      error: errMsg,
    });
  }
};

// PUT update discount policy
export const updateDiscountPolicy = async (req: Request, res: Response): Promise<void> => {
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
    if (user_role && !Object.values(UserRole).includes(user_role as UserRole)) {
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
        where: { user_role: user_role as UserRole },
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
        ...(user_role && { user_role: user_role as UserRole }),
        ...(max_discount_percentage !== undefined && max_discount_percentage !== null && { 
          max_discount_percentage: Number(max_discount_percentage) 
        }),
        ...(requires_approval_above !== undefined && { 
          requires_approval_above: requires_approval_above !== null ? Number(requires_approval_above) : null 
        }),
      },
    });

    res.status(200).json(updatedPolicy);
  } catch (error) {
    console.error("Error updating discount policy:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      message: "Failed to update discount policy",
      error: errMsg,
    });
  }
};

// DELETE discount policy
export const deleteDiscountPolicy = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error("Error deleting discount policy:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      message: "Failed to delete discount policy",
      error: errMsg,
    });
  }
};
