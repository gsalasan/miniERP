import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { RfpService } from '../services/rfpService';

const rfpService = new RfpService();

export class RfpController {
  /**
   * Create RFP (Request for Purchase)
   */
  async createRfp(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;
      const { items, notes } = req.body;
      const loggedInUserId = req.user?.id;

      if (!loggedInUserId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Items array is required and must not be empty',
        });
      }

      const rfp = await rfpService.createRfp(projectId, { items, notes }, loggedInUserId);

      return res.status(201).json({
        success: true,
        data: rfp,
        message: `RFP ${rfp!.rfp_number} berhasil dibuat`,
      });
    } catch (error: any) {
      console.error('Error creating RFP:', error);

      if (error.message.includes('Forbidden')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Get RFPs for a project
   */
  async getRfpsByProject(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;

      const rfps = await rfpService.getRfpsByProject(projectId);

      return res.status(200).json({
        success: true,
        data: rfps,
      });
    } catch (error: any) {
      console.error('Error getting RFPs:', error);

      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Get RFP by ID
   */
  async getRfpById(req: AuthRequest, res: Response) {
    try {
      const { rfpId } = req.params;

      const rfp = await rfpService.getRfpById(rfpId);

      if (!rfp) {
        return res.status(404).json({
          success: false,
          message: 'RFP not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: rfp,
      });
    } catch (error: any) {
      console.error('Error getting RFP:', error);

      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Update RFP status
   */
  async updateRfpStatus(req: AuthRequest, res: Response) {
    try {
      const { rfpId } = req.params;
      const { status } = req.body;
      const loggedInUserId = req.user?.id;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required',
        });
      }

      const rfp = await rfpService.updateRfpStatus(rfpId, status, loggedInUserId);

      return res.status(200).json({
        success: true,
        data: rfp,
        message: 'RFP status updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating RFP status:', error);

      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }
}
