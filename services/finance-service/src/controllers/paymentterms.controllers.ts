import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all payment terms
export const getAllPaymentTerms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { is_active } = req.query;
    
    const whereClause = is_active !== undefined 
      ? { is_active: is_active === 'true' }
      : {};

    const paymentTerms = await prisma.payment_terms.findMany({
      where: whereClause,
      orderBy: { days_until_due: "asc" },
    });

    res.status(200).json({
      success: true,
      message: "Payment terms fetched successfully",
      data: paymentTerms
    });
  } catch (error) {
    console.error("Error fetching payment terms:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Failed to fetch payment terms",
      error: errMsg,
    });
  }
};

// GET payment term by ID
export const getPaymentTermById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const termId = Number.parseInt(id);

    if (Number.isNaN(termId)) {
      res.status(400).json({
        success: false,
        message: "ID must be a number",
      });
      return;
    }

    const paymentTerm = await prisma.payment_terms.findUnique({
      where: { id: termId },
    });

    if (!paymentTerm) {
      res.status(404).json({
        success: false,
        message: "Payment term not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: paymentTerm
    });
  } catch (error) {
    console.error("Error fetching payment term:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Failed to fetch payment term",
      error: errMsg,
    });
  }
};

// GET payment term by code
export const getPaymentTermByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const paymentTerm = await prisma.payment_terms.findUnique({
      where: { term_code: code },
    });

    if (!paymentTerm) {
      res.status(404).json({
        success: false,
        message: "Payment term not found for this code",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: paymentTerm
    });
  } catch (error) {
    console.error("Error fetching payment term by code:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Failed to fetch payment term by code",
      error: errMsg,
    });
  }
};

// POST create new payment term
export const createPaymentTerm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      term_name, 
      term_code, 
      days_until_due, 
      discount_percentage, 
      discount_days, 
      description,
      is_active 
    } = req.body;

    // Validation
    if (!term_name || !term_code || days_until_due === undefined || days_until_due === null) {
      res.status(400).json({
        success: false,
        message: "Term name, code, and days until due are required",
      });
      return;
    }

    if (days_until_due < 0) {
      res.status(400).json({
        success: false,
        message: "Days until due cannot be negative",
      });
      return;
    }

    // Check if term_code already exists
    const existingTerm = await prisma.payment_terms.findUnique({
      where: { term_code },
    });

    if (existingTerm) {
      res.status(409).json({
        success: false,
        message: "Payment term with this code already exists",
      });
      return;
    }

    const newPaymentTerm = await prisma.payment_terms.create({
      data: {
        term_name,
        term_code,
        days_until_due,
        discount_percentage: discount_percentage || null,
        discount_days: discount_days || null,
        description: description || null,
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Payment term created successfully",
      data: newPaymentTerm,
    });
  } catch (error) {
    console.error("Error creating payment term:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Failed to create payment term",
      error: errMsg,
    });
  }
};

// PUT update payment term
export const updatePaymentTerm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const termId = Number.parseInt(id);

    if (Number.isNaN(termId)) {
      res.status(400).json({
        success: false,
        message: "ID must be a number",
      });
      return;
    }

    const { 
      term_name, 
      term_code, 
      days_until_due, 
      discount_percentage, 
      discount_days, 
      description,
      is_active 
    } = req.body;

    // Check if payment term exists
    const existingTerm = await prisma.payment_terms.findUnique({
      where: { id: termId },
    });

    if (!existingTerm) {
      res.status(404).json({
        success: false,
        message: "Payment term not found",
      });
      return;
    }

    // If term_code is being updated, check for duplicates
    if (term_code && term_code !== existingTerm.term_code) {
      const duplicateTerm = await prisma.payment_terms.findUnique({
        where: { term_code },
      });

      if (duplicateTerm) {
        res.status(409).json({
          success: false,
          message: "Payment term with this code already exists",
        });
        return;
      }
    }

    const updatedPaymentTerm = await prisma.payment_terms.update({
      where: { id: termId },
      data: {
        ...(term_name && { term_name }),
        ...(term_code && { term_code }),
        ...(days_until_due !== undefined && { days_until_due }),
        ...(discount_percentage !== undefined && { discount_percentage }),
        ...(discount_days !== undefined && { discount_days }),
        ...(description !== undefined && { description }),
        ...(is_active !== undefined && { is_active }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Payment term updated successfully",
      data: updatedPaymentTerm,
    });
  } catch (error) {
    console.error("Error updating payment term:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Failed to update payment term",
      error: errMsg,
    });
  }
};

// DELETE payment term
export const deletePaymentTerm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const termId = Number.parseInt(id);

    if (Number.isNaN(termId)) {
      res.status(400).json({
        success: false,
        message: "ID must be a number",
      });
      return;
    }

    // Check if payment term exists
    const existingTerm = await prisma.payment_terms.findUnique({
      where: { id: termId },
    });

    if (!existingTerm) {
      res.status(404).json({
        success: false,
        message: "Payment term not found",
      });
      return;
    }

    await prisma.payment_terms.delete({
      where: { id: termId },
    });

    res.status(200).json({
      success: true,
      message: "Payment term deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment term:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Failed to delete payment term",
      error: errMsg,
    });
  }
};
