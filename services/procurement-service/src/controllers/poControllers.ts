import { Request, Response } from 'express';
import {
  createPOService,
  createPOFromRFPService,
  getAllPOsService,
  getPOByIdService,
  updatePOStatusService,
  deletePOService,
} from '../services/poServices';

/**
 * Get all POs
 * GET /api/procurement/po
 */
export async function getAllPOs(req: Request, res: Response) {
  try {
    const result = await getAllPOsService(req.query);
    res.json({
      success: true,
      message: 'POs retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Error getting POs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get POs',
      error: error.message,
    });
  }
}

/**
 * Get PO by ID
 * GET /api/procurement/po/:id
 */
export async function getPOById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const po = await getPOByIdService(id);

    if (!po) {
      return res.status(404).json({
        success: false,
        message: 'PO not found',
      });
    }

    res.json({
      success: true,
      message: 'PO retrieved successfully',
      data: po,
    });
  } catch (error: any) {
    console.error('Error getting PO:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get PO',
      error: error.message,
    });
  }
}

/**
 * Create PO
 * POST /api/procurement/po
 */
export async function createPO(req: Request, res: Response) {
  try {
    const po = await createPOService(req.body);
    res.status(201).json({
      success: true,
      message: 'PO created successfully',
      data: po,
    });
  } catch (error: any) {
    console.error('Error creating PO:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create PO',
      error: error.message,
    });
  }
}

/**
 * Create PO from RFP
 * POST /api/procurement/rfp/:id/create-po
 */
export async function createPOFromRFP(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const po = await createPOFromRFPService({
      rfp_id: id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: 'PO created from RFP successfully',
      data: po,
    });
  } catch (error: any) {
    console.error('Error creating PO from RFP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create PO from RFP',
      error: error.message,
    });
  }
}

/**
 * Update PO status
 * PATCH /api/procurement/po/:id/status
 */
export async function updatePOStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const po = await updatePOStatusService(id, status);
    res.json({
      success: true,
      message: 'PO status updated successfully',
      data: po,
    });
  } catch (error: any) {
    console.error('Error updating PO status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update PO status',
      error: error.message,
    });
  }
}

/**
 * Delete PO
 * DELETE /api/procurement/po/:id
 */
export async function deletePO(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deletePOService(id);
    res.json({
      success: true,
      message: 'PO deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting PO:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete PO',
      error: error.message,
    });
  }
}
