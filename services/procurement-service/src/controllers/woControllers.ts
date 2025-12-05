import { Request, Response } from 'express';
import {
  createWOService,
  createWOFromRFPService,
  getAllWOsService,
  getWOByIdService,
  updateWOStatusService,
  deleteWOService,
} from '../services/woServices';

/**
 * Get all WOs
 * GET /api/procurement/wo
 */
export async function getAllWOs(req: Request, res: Response) {
  try {
    const result = await getAllWOsService(req.query);
    res.json({
      success: true,
      message: 'WOs retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Error getting WOs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get WOs',
      error: error.message,
    });
  }
}

/**
 * Get WO by ID
 * GET /api/procurement/wo/:id
 */
export async function getWOById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const wo = await getWOByIdService(id);

    if (!wo) {
      return res.status(404).json({
        success: false,
        message: 'WO not found',
      });
    }

    res.json({
      success: true,
      message: 'WO retrieved successfully',
      data: wo,
    });
  } catch (error: any) {
    console.error('Error getting WO:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get WO',
      error: error.message,
    });
  }
}

/**
 * Create WO
 * POST /api/procurement/wo
 */
export async function createWO(req: Request, res: Response) {
  try {
    const wo = await createWOService(req.body);
    res.status(201).json({
      success: true,
      message: 'WO created successfully',
      data: wo,
    });
  } catch (error: any) {
    console.error('Error creating WO:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create WO',
      error: error.message,
    });
  }
}

/**
 * Create WO from RFP
 * POST /api/procurement/rfp/:id/create-wo
 */
export async function createWOFromRFP(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const wo = await createWOFromRFPService({
      rfp_id: id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: 'WO created from RFP successfully',
      data: wo,
    });
  } catch (error: any) {
    console.error('Error creating WO from RFP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create WO from RFP',
      error: error.message,
    });
  }
}

/**
 * Update WO status
 * PATCH /api/procurement/wo/:id/status
 */
export async function updateWOStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const wo = await updateWOStatusService(id, status);
    res.json({
      success: true,
      message: 'WO status updated successfully',
      data: wo,
    });
  } catch (error: any) {
    console.error('Error updating WO status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update WO status',
      error: error.message,
    });
  }
}

/**
 * Delete WO
 * DELETE /api/procurement/wo/:id
 */
export async function deleteWO(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteWOService(id);
    res.json({
      success: true,
      message: 'WO deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting WO:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete WO',
      error: error.message,
    });
  }
}
