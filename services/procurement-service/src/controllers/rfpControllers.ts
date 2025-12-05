import { Request, Response } from 'express';
import {
  getAllRFPsService,
  getRFPByIdService,
  createRFPService,
  updateRFPStatusService,
  deleteRFPService,
} from '../services/rfpServices';

/**
 * Get all RFPs
 * GET /api/procurement/rfp
 */
export async function getAllRFPs(req: Request, res: Response) {
  try {
    const result = await getAllRFPsService(req.query);
    res.json({
      success: true,
      message: 'RFPs retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Error getting RFPs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get RFPs',
      error: error.message,
    });
  }
}

/**
 * Get RFP by ID
 * GET /api/procurement/rfp/:id
 */
export async function getRFPById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const rfp = await getRFPByIdService(id);

    if (!rfp) {
      return res.status(404).json({
        success: false,
        message: 'RFP not found',
      });
    }

    res.json({
      success: true,
      message: 'RFP retrieved successfully',
      data: rfp,
    });
  } catch (error: any) {
    console.error('Error getting RFP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get RFP',
      error: error.message,
    });
  }
}

/**
 * Create new RFP
 * POST /api/procurement/rfp
 */
export async function createRFP(req: Request, res: Response) {
  try {
    const rfp = await createRFPService(req.body);
    res.status(201).json({
      success: true,
      message: 'RFP created successfully',
      data: rfp,
    });
  } catch (error: any) {
    console.error('Error creating RFP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create RFP',
      error: error.message,
    });
  }
}

/**
 * Update RFP status
 * PATCH /api/procurement/rfp/:id/status
 */
export async function updateRFPStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const rfp = await updateRFPStatusService(id, req.body);
    res.json({
      success: true,
      message: 'RFP status updated successfully',
      data: rfp,
    });
  } catch (error: any) {
    console.error('Error updating RFP status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update RFP status',
      error: error.message,
    });
  }
}

/**
 * Delete RFP
 * DELETE /api/procurement/rfp/:id
 */
export async function deleteRFP(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteRFPService(id);
    res.json({
      success: true,
      message: 'RFP deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting RFP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete RFP',
      error: error.message,
    });
  }
}
