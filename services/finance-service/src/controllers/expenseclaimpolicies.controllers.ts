import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all expense claim policies
export const getAllExpenseClaimPolicies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { is_active } = req.query;
    
    // Check if table exists first
    const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'expense_claim_policies'
      )
    `;

    if (!tableExists[0]?.exists) {
      console.warn('⚠️ expense_claim_policies table does not exist. Run migration: prisma/migrations/add_expense_claim_policies.sql');
      
      // Return mock data with warning
      const mockData = [
        { id: 1, policy_name: "Travel Expense", policy_code: "TRAVEL", max_claim_amount: 5000000, approval_required: true, requires_receipt: true, description: "Biaya perjalanan dinas karyawan", is_active: true },
        { id: 2, policy_name: "Meal Allowance", policy_code: "MEAL", max_claim_amount: 500000, approval_required: false, requires_receipt: true, description: "Uang makan karyawan", is_active: true },
        { id: 3, policy_name: "Transportation", policy_code: "TRANSPORT", max_claim_amount: 1000000, approval_required: false, requires_receipt: true, description: "Biaya transportasi karyawan", is_active: true },
        { id: 4, policy_name: "Accommodation", policy_code: "ACCOM", max_claim_amount: 3000000, approval_required: true, requires_receipt: true, description: "Biaya akomodasi hotel", is_active: true },
        { id: 5, policy_name: "Entertainment", policy_code: "ENTERTAIN", max_claim_amount: 2000000, approval_required: true, requires_receipt: true, description: "Biaya entertainment klien", is_active: true },
      ];

      return res.status(200).json({
        success: true,
        message: "Expense claim policies (Mock Data - Table not created yet)",
        data: mockData,
        warning: "Run SQL migration to create table: prisma/migrations/add_expense_claim_policies.sql"
      });
    }

    // Table exists, query data
    const whereFilter = is_active !== undefined ? `WHERE is_active = ${is_active === 'true'}` : '';
    const policies = await prisma.$queryRaw<any[]>`
      SELECT * FROM expense_claim_policies
      ${whereFilter ? prisma.$queryRaw([whereFilter]) : prisma.$queryRaw``}
      ORDER BY id ASC
    `;

    res.status(200).json({
      success: true,
      message: "Expense claim policies fetched successfully",
      data: policies
    });
  } catch (error) {
    console.error("Error fetching expense claim policies:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Failed to fetch expense claim policies",
      error: errMsg,
    });
  }
};

// GET expense claim policy by ID
export const getExpenseClaimPolicyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const policyId = Number.parseInt(id);

    if (Number.isNaN(policyId)) {
      res.status(400).json({
        success: false,
        message: "ID must be a number",
      });
      return;
    }

    const policy: any = await prisma.$queryRaw`
      SELECT * FROM expense_claim_policies WHERE id = ${policyId} LIMIT 1
    `;

    if (!policy || policy.length === 0) {
      res.status(404).json({
        success: false,
        message: "Expense claim policy not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: policy[0]
    });
  } catch (error) {
    console.error("Error fetching expense claim policy:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Failed to fetch expense claim policy",
      error: errMsg,
    });
  }
};

// POST create new expense claim policy
export const createExpenseClaimPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      policy_name, 
      policy_code, 
      max_claim_amount, 
      approval_required, 
      requires_receipt, 
      description,
      is_active 
    } = req.body;

    // Validation
    if (!policy_name || !policy_code || max_claim_amount === undefined || max_claim_amount === null) {
      res.status(400).json({
        success: false,
        message: "Policy name, code, and max claim amount are required",
      });
      return;
    }

    if (max_claim_amount < 0) {
      res.status(400).json({
        success: false,
        message: "Max claim amount cannot be negative",
      });
      return;
    }

    const newPolicy: any = await prisma.$queryRaw`
      INSERT INTO expense_claim_policies (
        policy_name, policy_code, max_claim_amount, 
        approval_required, requires_receipt, description, is_active
      ) VALUES (
        ${policy_name}, ${policy_code}, ${max_claim_amount},
        ${approval_required !== undefined ? approval_required : true},
        ${requires_receipt !== undefined ? requires_receipt : true},
        ${description || null},
        ${is_active !== undefined ? is_active : true}
      )
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: "Expense claim policy created successfully",
      data: newPolicy[0],
    });
  } catch (error: any) {
    console.error("Error creating expense claim policy:", error);
    
    if (error.code === '23505') { // Unique violation
      res.status(409).json({
        success: false,
        message: "Expense claim policy with this code already exists",
      });
      return;
    }

    const errMsg = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to create expense claim policy",
      error: errMsg,
    });
  }
};

// PUT update expense claim policy
export const updateExpenseClaimPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const policyId = Number.parseInt(id);

    if (Number.isNaN(policyId)) {
      res.status(400).json({
        success: false,
        message: "ID must be a number",
      });
      return;
    }

    const { 
      policy_name, 
      policy_code, 
      max_claim_amount, 
      approval_required, 
      requires_receipt, 
      description,
      is_active 
    } = req.body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (policy_name !== undefined) {
      updates.push(`policy_name = $${paramIndex++}`);
      values.push(policy_name);
    }
    if (policy_code !== undefined) {
      updates.push(`policy_code = $${paramIndex++}`);
      values.push(policy_code);
    }
    if (max_claim_amount !== undefined) {
      updates.push(`max_claim_amount = $${paramIndex++}`);
      values.push(max_claim_amount);
    }
    if (approval_required !== undefined) {
      updates.push(`approval_required = $${paramIndex++}`);
      values.push(approval_required);
    }
    if (requires_receipt !== undefined) {
      updates.push(`requires_receipt = $${paramIndex++}`);
      values.push(requires_receipt);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: "No fields to update",
      });
      return;
    }

    values.push(policyId);

    const updatedPolicy: any = await prisma.$queryRaw`
      UPDATE expense_claim_policies 
      SET ${prisma.$queryRaw(updates.join(', '))}
      WHERE id = ${policyId}
      RETURNING *
    `;

    if (!updatedPolicy || updatedPolicy.length === 0) {
      res.status(404).json({
        success: false,
        message: "Expense claim policy not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Expense claim policy updated successfully",
      data: updatedPolicy[0],
    });
  } catch (error) {
    console.error("Error updating expense claim policy:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Failed to update expense claim policy",
      error: errMsg,
    });
  }
};

// DELETE expense claim policy
export const deleteExpenseClaimPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const policyId = Number.parseInt(id);

    if (Number.isNaN(policyId)) {
      res.status(400).json({
        success: false,
        message: "ID must be a number",
      });
      return;
    }

    const deletedPolicy: any = await prisma.$queryRaw`
      DELETE FROM expense_claim_policies 
      WHERE id = ${policyId}
      RETURNING *
    `;

    if (!deletedPolicy || deletedPolicy.length === 0) {
      res.status(404).json({
        success: false,
        message: "Expense claim policy not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Expense claim policy deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting expense claim policy:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Failed to delete expense claim policy",
      error: errMsg,
    });
  }
};
