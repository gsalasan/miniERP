import { Request, Response } from 'express';
<<<<<<< HEAD
import prisma from '../prisma/client';

const getMaterials = async (req: Request, res: Response) => {
  try {
    const materials = await prisma.material.findMany();
    return res.json(materials);
  } catch (error) {
    console.error('Failed to fetch materials', error);
    return res.status(500).json({ message: 'Failed to fetch materials' });
  }
};

export default { getMaterials };
=======
import { PrismaClient } from '@prisma/client';
import materialsService from '../services/materialsService';

// Enum definitions to match database schema
enum MaterialStatus {
  Active = 'Active',
  EndOfLife = 'EndOfLife',
  Discontinue = 'Discontinue',
}

enum MaterialLocation {
  Local = 'Local',
  Import = 'Import',
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Get all materials with filtering, pagination, and search
const getMaterials = async (req: Request, res: Response) => {
  try {
    console.log('Attempting to fetch materials from database...');

    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchTerm = req.query.search as string;

    // Extract filters
    const filters = {
      sbu: req.query.sbu as string,
      system: req.query.system as string,
      subsystem: req.query.subsystem as string,
      status: req.query.status as MaterialStatus,
      location: req.query.location as MaterialLocation,
      vendor: req.query.vendor as string,
      brand: req.query.brand as string,
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const result = await materialsService.getAllMaterials(
      page,
      limit,
      filters,
      searchTerm
    );

    console.log(
      'Materials fetched successfully:',
      result.data.length,
      'records'
    );
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Failed to fetch materials - Detailed error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch materials',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get material by ID
const getMaterialById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Material ID is required',
      });
    }

    const material = await materialsService.getMaterialById(id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }

    return res.json({
      success: true,
      data: material,
    });
  } catch (error) {
    console.error('Failed to fetch material by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch material',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create new material
const createMaterial = async (req: Request, res: Response) => {
  try {
    const {
      sbu,
      system,
      subsystem,
      components,
      item_name,
      brand,
      owner_pn,
      vendor,
      status,
      location,
      cost_ori,
      curr,
      satuan,
      cost_rp,
      cost_validity,
    } = req.body;

    // Validate required fields
    if (!item_name) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required',
      });
    }

    // Validate enums if provided
    if (status && !Object.values(MaterialStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    if (location && !Object.values(MaterialLocation).includes(location)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location value',
      });
    }

    const materialData = {
      sbu,
      system,
      subsystem,
      components,
      item_name,
      brand,
      owner_pn,
      vendor,
      status,
      location,
      cost_ori: cost_ori ? parseFloat(cost_ori) : undefined,
      curr,
      satuan,
      cost_rp: cost_rp ? parseFloat(cost_rp) : undefined,
      cost_validity: cost_validity ? new Date(cost_validity) : undefined,
    };

    const newMaterial = await materialsService.createMaterial(materialData);

    return res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: newMaterial,
    });
  } catch (error) {
    console.error('Failed to create material:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create material',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update material
const updateMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      sbu,
      system,
      subsystem,
      components,
      item_name,
      brand,
      owner_pn,
      vendor,
      status,
      location,
      cost_ori,
      curr,
      satuan,
      cost_rp,
      cost_validity,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Material ID is required',
      });
    }

    // Validate enums if provided
    if (status && !Object.values(MaterialStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    if (location && !Object.values(MaterialLocation).includes(location)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location value',
      });
    }

    const updateData = {
      sbu,
      system,
      subsystem,
      components,
      item_name,
      brand,
      owner_pn,
      vendor,
      status,
      location,
      cost_ori: cost_ori ? parseFloat(cost_ori) : undefined,
      curr,
      satuan,
      cost_rp: cost_rp ? parseFloat(cost_rp) : undefined,
      cost_validity: cost_validity ? new Date(cost_validity) : undefined,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const updatedMaterial = await materialsService.updateMaterial(
      id,
      updateData
    );

    if (!updatedMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }

    return res.json({
      success: true,
      message: 'Material updated successfully',
      data: updatedMaterial,
    });
  } catch (error) {
    console.error('Failed to update material:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update material',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete material
const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Material ID is required',
      });
    }

    const deleted = await materialsService.deleteMaterial(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }

    return res.json({
      success: true,
      message: 'Material deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete material:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete material',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get materials statistics
const getMaterialsStats = async (req: Request, res: Response) => {
  try {
    const stats = await materialsService.getMaterialsStats();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Failed to fetch materials stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch materials statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get filter options
const getFilterOptions = async (req: Request, res: Response) => {
  try {
    const options = await materialsService.getFilterOptions();

    return res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch filter options',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Health check
const healthCheck = async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$connect();
    return res.json({
      status: 'healthy',
      service: 'engineering-service',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    console.error('Health check failed', error);
    return res.status(503).json({
      status: 'unhealthy',
      service: 'engineering-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed',
    });
  }
};

export default {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialsStats,
  getFilterOptions,
  healthCheck,
};
>>>>>>> main
