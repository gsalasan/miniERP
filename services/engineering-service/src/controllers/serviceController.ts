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
      // taxonomy FKs
      kategori_sistem_id,
      sub_sistem_id,
      kategori_jasa_id,
      jenis_jasa_spesifik_id,
      deskripsi_id,
      deskripsi_text,
      rekomendasi_tim_ids,
      fase_proyek_id,
      sbu_id,
      unit,
      default_duration,
      is_active,
    } = req.body;

    // Validate required fields
    if (!service_name || !service_code || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: service_name, service_code, and unit are required',
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
      kategori_sistem_id,
      sub_sistem_id,
      kategori_jasa_id,
      jenis_jasa_spesifik_id,
      deskripsi_id,
      deskripsi_text,
      rekomendasi_tim_ids,
      fase_proyek_id,
      sbu_id,
      unit,
      default_duration: default_duration ? parseFloat(default_duration) : undefined,
      is_active,
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create service',
    });
  }
};

// Get all services with filtering, pagination, and search
const getServices = async (req: Request, res: Response) => {
  try {
    // eslint-disable-next-line no-console
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
      unit: req.query.unit as ServiceUnit,
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      item_type: req.query.item_type as string,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
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
    // eslint-disable-next-line no-console
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch services',
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format. Expected UUID.',
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
    // eslint-disable-next-line no-console
    console.error('Error fetching service by ID:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch service',
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
    // eslint-disable-next-line no-console
    console.error('Error fetching service by ID:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch service',
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
      sbu_id,
      fase_proyek_id,
      // taxonomy FKs
      kategori_sistem_id,
      sub_sistem_id,
      kategori_jasa_id,
      jenis_jasa_spesifik_id,
      deskripsi_id,
      deskripsi_text,
      rekomendasi_tim_ids,
      unit,
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

    const updateData: Record<string, unknown> = {};
    if (service_name !== undefined) updateData.service_name = service_name;
    if (service_code !== undefined) updateData.service_code = service_code;
    if (item_type !== undefined) updateData.item_type = item_type;
    if (sbu_id !== undefined) updateData.sbu_id = sbu_id;
    if (kategori_sistem_id !== undefined) updateData.kategori_sistem_id = kategori_sistem_id;
    if (sub_sistem_id !== undefined) updateData.sub_sistem_id = sub_sistem_id;
    if (fase_proyek_id !== undefined) updateData.fase_proyek_id = fase_proyek_id;
    if (kategori_jasa_id !== undefined) updateData.kategori_jasa_id = kategori_jasa_id;
    if (jenis_jasa_spesifik_id !== undefined)
      updateData.jenis_jasa_spesifik_id = jenis_jasa_spesifik_id;
    if (deskripsi_id !== undefined) updateData.deskripsi_id = deskripsi_id;
    if (deskripsi_text !== undefined) {
      updateData.deskripsi_text = deskripsi_text;
    }
    if (rekomendasi_tim_ids !== undefined) updateData.rekomendasi_tim_ids = rekomendasi_tim_ids;
    if (unit !== undefined) updateData.unit = unit;
    if (default_duration !== undefined) updateData.default_duration = parseFloat(default_duration);
    if (is_active !== undefined) updateData.is_active = is_active;

    const service = await serviceService.updateService(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update service',
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
    // eslint-disable-next-line no-console
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete service',
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
    // eslint-disable-next-line no-console
    console.error('Error permanently deleting service:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to permanently delete service',
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
    // eslint-disable-next-line no-console
    console.error('Error restoring service:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to restore service',
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
    // eslint-disable-next-line no-console
    console.error('Error fetching service statistics:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch service statistics',
    });
  }
};

// FITUR 3.2.B: Search services for autocomplete
const searchServices = async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query || query.length < 2) {
      return res.json([]);
    }

    const services = await serviceService.searchServices(query, limit);
    return res.json(services);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error searching services:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to search services',
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
  searchServices,
};
