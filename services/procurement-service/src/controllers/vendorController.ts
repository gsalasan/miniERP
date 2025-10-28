import { Request, Response } from 'express';
import { VendorService } from '../services/vendorServices';
import { createVendorSchema, updateVendorSchema, queryVendorSchema } from '../utils/validation';

const vendorService = new VendorService();

export class VendorController {
  async createVendor(req: Request, res: Response) {
    try {
      const validatedData = createVendorSchema.parse(req.body);
      
      const vendor = await vendorService.createVendor(validatedData);
      
      res.status(201).json({
        success: true,
        message: 'Vendor created successfully',
        data: vendor,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async getAllVendors(req: Request, res: Response) {
    try {
      const validatedQuery = queryVendorSchema.parse(req.query);
      
      const options = {
        page: parseInt(validatedQuery.page),
        limit: parseInt(validatedQuery.limit),
        search: validatedQuery.search,
        classification: validatedQuery.classification,
        is_preferred: validatedQuery.is_preferred ? validatedQuery.is_preferred === 'true' : undefined,
      };

      const result = await vendorService.getAllVendors(options);
      
      res.status(200).json({
        success: true,
        message: 'Vendors retrieved successfully',
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async getVendorById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const vendor = await vendorService.getVendorById(id);
      
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found',
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Vendor retrieved successfully',
        data: vendor,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async updateVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateVendorSchema.parse(req.body);
      
      const vendor = await vendorService.updateVendor(id, validatedData);
      
      res.status(200).json({
        success: true,
        message: 'Vendor updated successfully',
        data: vendor,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found',
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async deleteVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await vendorService.deleteVendor(id);
      
      res.status(200).json({
        success: true,
        message: 'Vendor deleted successfully',
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found',
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async getVendorStats(req: Request, res: Response) {
    try {
      const stats = await vendorService.getVendorStats();
      
      res.status(200).json({
        success: true,
        message: 'Vendor statistics retrieved successfully',
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}