import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all overhead cost allocations
export const getAllOverheadAllocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const allocations = await prisma.overhead_cost_allocations.findMany({
      orderBy: { id: "asc" },
    });

    res.status(200).json(allocations);
  } catch (error) {
    console.error("Error fetching overhead allocations:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      message: "Failed to fetch overhead allocations",
      error: errMsg,
    });
  }
};

// GET overhead allocation by ID
export const getOverheadAllocationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const allocationId = Number.parseInt(id);

    if (Number.isNaN(allocationId)) {
      res.status(400).json({
        message: "ID must be a number",
      });
      return;
    }

    const allocation = await prisma.overhead_cost_allocations.findUnique({
      where: { id: allocationId },
    });

    if (!allocation) {
      res.status(404).json({
        message: "Overhead allocation not found",
      });
      return;
    }

    res.status(200).json(allocation);
  } catch (error) {
    console.error("Error fetching overhead allocation:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      message: "Failed to fetch overhead allocation",
      error: errMsg,
    });
  }
};

// GET overhead allocation by cost category
export const getOverheadAllocationByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;

    const allocation = await prisma.overhead_cost_allocations.findUnique({
      where: { cost_category: category },
    });

    if (!allocation) {
      res.status(404).json({
        message: "Overhead allocation not found for this category",
      });
      return;
    }

    res.status(200).json(allocation);
  } catch (error) {
    console.error("Error fetching overhead allocation by category:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      message: "Failed to fetch overhead allocation by category",
      error: errMsg,
    });
  }
};

// POST create new overhead allocation
export const createOverheadAllocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cost_category, target_percentage, allocation_percentage_to_hpp } = req.body;

    // Validation
    if (!cost_category || allocation_percentage_to_hpp === undefined || allocation_percentage_to_hpp === null) {
      res.status(400).json({
        message: "cost_category and allocation_percentage_to_hpp are required",
      });
      return;
    }

    // Validate allocation_percentage_to_hpp range
    const allocationValue = Number(allocation_percentage_to_hpp);
    if (allocationValue < 0) {
      res.status(400).json({
        message: "Allocation percentage cannot be negative",
      });
      return;
    }

    if (allocationValue > 100) {
      res.status(400).json({
        message: "Allocation percentage cannot exceed 100",
      });
      return;
    }

    // Validate target_percentage if provided
    if (target_percentage !== undefined && target_percentage !== null) {
      const targetValue = Number(target_percentage);
      if (targetValue < 0) {
        res.status(400).json({
          message: "Target percentage cannot be negative",
        });
        return;
      }

      if (targetValue > 100) {
        res.status(400).json({
          message: "Target percentage cannot exceed 100",
        });
        return;
      }
    }

    // Check if category already exists
    const existingAllocation = await prisma.overhead_cost_allocations.findUnique({
      where: { cost_category },
    });

    if (existingAllocation) {
      res.status(400).json({
        message: "Overhead allocation with this category already exists",
      });
      return;
    }

    const newAllocation = await prisma.overhead_cost_allocations.create({
      data: {
        cost_category,
        target_percentage: target_percentage !== undefined && target_percentage !== null ? Number(target_percentage) : null,
        allocation_percentage_to_hpp: allocationValue,
      },
    });

    res.status(201).json(newAllocation);
  } catch (error) {
    console.error("Error creating overhead allocation:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      message: "Failed to create overhead allocation",
      error: errMsg,
    });
  }
};

// PUT update overhead allocation
export const updateOverheadAllocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const allocationId = Number.parseInt(id);

    if (Number.isNaN(allocationId)) {
      res.status(400).json({
        message: "ID must be a number",
      });
      return;
    }

    const { cost_category, target_percentage, allocation_percentage_to_hpp } = req.body;

    // Validation - at least one field must be provided
    if (!cost_category && target_percentage === undefined && allocation_percentage_to_hpp === undefined) {
      res.status(400).json({
        message: "At least one field must be provided for update",
      });
      return;
    }

    // Validate allocation_percentage_to_hpp if provided
    if (allocation_percentage_to_hpp !== undefined && allocation_percentage_to_hpp !== null) {
      const allocationValue = Number(allocation_percentage_to_hpp);
      if (allocationValue < 0) {
        res.status(400).json({
          message: "Allocation percentage cannot be negative",
        });
        return;
      }

      if (allocationValue > 100) {
        res.status(400).json({
          message: "Allocation percentage cannot exceed 100",
        });
        return;
      }
    }

    // Validate target_percentage if provided
    if (target_percentage !== undefined && target_percentage !== null) {
      const targetValue = Number(target_percentage);
      if (targetValue < 0) {
        res.status(400).json({
          message: "Target percentage cannot be negative",
        });
        return;
      }

      if (targetValue > 100) {
        res.status(400).json({
          message: "Target percentage cannot exceed 100",
        });
        return;
      }
    }

    // Check if allocation exists
    const existingAllocation = await prisma.overhead_cost_allocations.findUnique({
      where: { id: allocationId },
    });

    if (!existingAllocation) {
      res.status(404).json({
        message: "Overhead allocation not found",
      });
      return;
    }

    // If category is being updated, check if new category already exists
    if (cost_category && cost_category !== existingAllocation.cost_category) {
      const categoryExists = await prisma.overhead_cost_allocations.findUnique({
        where: { cost_category },
      });

      if (categoryExists) {
        res.status(400).json({
          message: "Overhead allocation with this category already exists",
        });
        return;
      }
    }

    const updatedAllocation = await prisma.overhead_cost_allocations.update({
      where: { id: allocationId },
      data: {
        ...(cost_category && { cost_category }),
        ...(target_percentage !== undefined && { 
          target_percentage: target_percentage !== null ? Number(target_percentage) : null 
        }),
        ...(allocation_percentage_to_hpp !== undefined && allocation_percentage_to_hpp !== null && { 
          allocation_percentage_to_hpp: Number(allocation_percentage_to_hpp) 
        }),
      },
    });

    res.status(200).json(updatedAllocation);
  } catch (error) {
    console.error("Error updating overhead allocation:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      message: "Failed to update overhead allocation",
      error: errMsg,
    });
  }
};

// DELETE overhead allocation
export const deleteOverheadAllocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const allocationId = Number.parseInt(id);

    if (Number.isNaN(allocationId)) {
      res.status(400).json({
        message: "ID must be a number",
      });
      return;
    }

    // Check if allocation exists
    const existingAllocation = await prisma.overhead_cost_allocations.findUnique({
      where: { id: allocationId },
    });

    if (!existingAllocation) {
      res.status(404).json({
        message: "Overhead allocation not found",
      });
      return;
    }

    await prisma.overhead_cost_allocations.delete({
      where: { id: allocationId },
    });

    res.status(200).json({
      message: "Overhead allocation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting overhead allocation:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      message: "Failed to delete overhead allocation",
      error: errMsg,
    });
  }
};
