import { Request, Response } from 'express';
import serviceService from '../services/serviceService';

// Enum definitions to match database schema
enum ServiceUnit {
  Jam = 'Jam',
  Hari = 'Hari',
}

// Create a new service
const createService = async (req: Request, res: Response) => {
  try {
    const {
      service_name,
      service_code,
      item_type,
      category,
      unit,
      internal_cost_per_hour,
      freelance_cost_per_hour,
      default_duration,
      is_active,
    } = req.body;

    // Validate required fields
    if (!service_name || !service_code || !unit) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: service_name, service_code, and unit are required',
      });
    }

    // Validate unit enum
    if (!Object.values(ServiceUnit).includes(unit)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unit. Must be either "Jam" or "Hari"',
      });
    }

    // Check if service code already exists
    const existingService = await serviceService.getServiceByCode(service_code);
    if (existingService) {
      return res.status(409).json({
        success: false,
        message: 'Service code already exists',
      });
    }

    const service = await serviceService.createService({
      service_name,
      service_code,
      item_type,
      category,
      unit,
      internal_cost_per_hour: internal_cost_per_hour
        ? parseFloat(internal_cost_per_hour)
        : undefined,
      freelance_cost_per_hour: freelance_cost_per_hour
        ? parseFloat(freelance_cost_per_hour)
        : undefined,
      default_duration: default_duration
        ? parseFloat(default_duration)
        : undefined,
      is_active,
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to create service',
    });
  }
};

// Get all services with filtering, pagination, and search
const getServices = async (req: Request, res: Response) => {
  try {
    console.log('Attempting to fetch services from database...');

    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchTerm = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    // Extract filters
    const filters = {
      service_name: req.query.service_name as string,
      service_code: req.query.service_code as string,
      category: req.query.category as string,
      unit: req.query.unit as ServiceUnit,
      is_active: req.query.is_active
        ? req.query.is_active === 'true'
        : undefined,
      item_type: req.query.item_type as string,
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const result = await serviceService.getServices({
      page,
      limit,
      search: searchTerm,
      filters,
      sortBy,
      sortOrder,
    });

    res.status(200).json({
      success: true,
      message: 'Services fetched successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to fetch services',
    });
  }
};

// Get service by ID
const getServiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required',
      });
    }

    const service = await serviceService.getServiceById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service fetched successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error fetching service by ID:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to fetch service',
    });
  }
};

// Get service by service code
const getServiceByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Service code is required',
      });
    }

    const service = await serviceService.getServiceByCode(code);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service fetched successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error fetching service by code:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to fetch service',
    });
  }
};

// Update service by ID
const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      service_name,
      service_code,
      item_type,
      category,
      unit,
      internal_cost_per_hour,
      freelance_cost_per_hour,
      default_duration,
      is_active,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required',
      });
    }

    // Validate unit enum if provided
    if (unit && !Object.values(ServiceUnit).includes(unit)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unit. Must be either "Jam" or "Hari"',
      });
    }

    const updateData: any = {};
    if (service_name !== undefined) updateData.service_name = service_name;
    if (service_code !== undefined) updateData.service_code = service_code;
    if (item_type !== undefined) updateData.item_type = item_type;
    if (category !== undefined) updateData.category = category;
    if (unit !== undefined) updateData.unit = unit;
    if (internal_cost_per_hour !== undefined)
      updateData.internal_cost_per_hour = parseFloat(internal_cost_per_hour);
    if (freelance_cost_per_hour !== undefined)
      updateData.freelance_cost_per_hour = parseFloat(freelance_cost_per_hour);
    if (default_duration !== undefined)
      updateData.default_duration = parseFloat(default_duration);
    if (is_active !== undefined) updateData.is_active = is_active;

    const service = await serviceService.updateService(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to update service',
    });
  }
};

// Delete service by ID (soft delete)
const deleteService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required',
      });
    }

    const service = await serviceService.deleteService(id);

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to delete service',
    });
  }
};

// Hard delete service by ID
const hardDeleteService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required',
      });
    }

    const service = await serviceService.hardDeleteService(id);

    res.status(200).json({
      success: true,
      message: 'Service permanently deleted successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error permanently deleting service:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to permanently delete service',
    });
  }
};

// Restore service by ID
const restoreService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required',
      });
    }

    const service = await serviceService.restoreService(id);

    res.status(200).json({
      success: true,
      message: 'Service restored successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error restoring service:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to restore service',
    });
  }
};

// Get service statistics
const getServiceStats = async (req: Request, res: Response) => {
  try {
    const stats = await serviceService.getServiceStats();

    res.status(200).json({
      success: true,
      message: 'Service statistics fetched successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching service statistics:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to fetch service statistics',
    });
  }
};

export {
  createService,
  getServices,
  getServiceById,
  getServiceByCode,
  updateService,
  deleteService,
  hardDeleteService,
  restoreService,
  getServiceStats,
};
