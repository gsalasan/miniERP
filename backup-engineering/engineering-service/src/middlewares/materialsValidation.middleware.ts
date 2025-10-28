import { Request, Response, NextFunction } from 'express';

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

// Validation middleware for creating materials
export const validateCreateMaterial = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { item_name, status, location, cost_ori, cost_rp, curr } = req.body;

  // Check required fields
  if (!item_name) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: ['item_name is required'],
    });
  }

  const errors: string[] = [];

  // Validate item_name length
  if (item_name.length < 2) {
    errors.push('item_name must be at least 2 characters long');
  }

  if (item_name.length > 255) {
    errors.push('item_name must not exceed 255 characters');
  }

  // Validate status enum if provided
  if (status && !Object.values(MaterialStatus).includes(status)) {
    errors.push(
      `status must be one of: ${Object.values(MaterialStatus).join(', ')}`
    );
  }

  // Validate location enum if provided
  if (location && !Object.values(MaterialLocation).includes(location)) {
    errors.push(
      `location must be one of: ${Object.values(MaterialLocation).join(', ')}`
    );
  }

  // Validate cost_ori if provided
  if (cost_ori !== undefined && cost_ori !== null) {
    const costNum = parseFloat(cost_ori);
    if (isNaN(costNum) || costNum < 0) {
      errors.push('cost_ori must be a positive number');
    }
  }

  // Validate cost_rp if provided
  if (cost_rp !== undefined && cost_rp !== null) {
    const costNum = parseFloat(cost_rp);
    if (isNaN(costNum) || costNum < 0) {
      errors.push('cost_rp must be a positive number');
    }
  }

  // Validate currency code if provided
  if (curr && curr.length !== 3) {
    errors.push('curr must be a 3-character currency code (e.g., USD, IDR)');
  }

  // Validate string field lengths
  const stringFields = [
    'sbu',
    'system',
    'subsystem',
    'components',
    'brand',
    'owner_pn',
    'vendor',
    'satuan',
  ];

  stringFields.forEach(field => {
    const value = req.body[field];
    if (value && typeof value === 'string' && value.length > 255) {
      errors.push(`${field} must not exceed 255 characters`);
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

// Validation middleware for updating materials
export const validateUpdateMaterial = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { item_name, status, location, cost_ori, cost_rp, curr } = req.body;

  const errors: string[] = [];

  // Validate item_name if provided
  if (item_name !== undefined) {
    if (!item_name || typeof item_name !== 'string') {
      errors.push('item_name must be a non-empty string');
    } else if (item_name.length < 2) {
      errors.push('item_name must be at least 2 characters long');
    } else if (item_name.length > 255) {
      errors.push('item_name must not exceed 255 characters');
    }
  }

  // Validate status enum if provided
  if (status && !Object.values(MaterialStatus).includes(status)) {
    errors.push(
      `status must be one of: ${Object.values(MaterialStatus).join(', ')}`
    );
  }

  // Validate location enum if provided
  if (location && !Object.values(MaterialLocation).includes(location)) {
    errors.push(
      `location must be one of: ${Object.values(MaterialLocation).join(', ')}`
    );
  }

  // Validate cost_ori if provided
  if (cost_ori !== undefined && cost_ori !== null) {
    const costNum = parseFloat(cost_ori);
    if (isNaN(costNum) || costNum < 0) {
      errors.push('cost_ori must be a positive number');
    }
  }

  // Validate cost_rp if provided
  if (cost_rp !== undefined && cost_rp !== null) {
    const costNum = parseFloat(cost_rp);
    if (isNaN(costNum) || costNum < 0) {
      errors.push('cost_rp must be a positive number');
    }
  }

  // Validate currency code if provided
  if (curr && (typeof curr !== 'string' || curr.length !== 3)) {
    errors.push('curr must be a 3-character currency code (e.g., USD, IDR)');
  }

  // Validate string field lengths
  const stringFields = [
    'sbu',
    'system',
    'subsystem',
    'components',
    'brand',
    'owner_pn',
    'vendor',
    'satuan',
  ];

  stringFields.forEach(field => {
    const value = req.body[field];
    if (
      value !== undefined &&
      value !== null &&
      typeof value === 'string' &&
      value.length > 255
    ) {
      errors.push(`${field} must not exceed 255 characters`);
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

// Validation middleware for UUID parameters
export const validateUUID = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'ID parameter is required',
    });
  }

  // UUID v4 regex pattern
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid UUID format',
    });
  }

  next();
};

// Validation middleware for query parameters
export const validateQueryParams = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { page, limit, status, location } = req.query;

  const errors: string[] = [];

  // Validate page parameter
  if (page !== undefined) {
    const pageNum = parseInt(page as string);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('page must be a positive integer');
    }
  }

  // Validate limit parameter
  if (limit !== undefined) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('limit must be a positive integer between 1 and 100');
    }
  }

  // Validate status parameter
  if (
    status &&
    !Object.values(MaterialStatus).includes(status as MaterialStatus)
  ) {
    errors.push(
      `status must be one of: ${Object.values(MaterialStatus).join(', ')}`
    );
  }

  // Validate location parameter
  if (
    location &&
    !Object.values(MaterialLocation).includes(location as MaterialLocation)
  ) {
    errors.push(
      `location must be one of: ${Object.values(MaterialLocation).join(', ')}`
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors,
    });
  }

  next();
};

// Error handling middleware
export const handleErrors = (
  err: Error & { code?: string; message: string },
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Unhandled error:', err);

  // Database connection errors
  if (err.code === 'P1001') {
    return res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: 'Service temporarily unavailable',
    });
  }

  // Unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      error: 'Duplicate entry',
    });
  }

  // Foreign key constraint violation
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference',
      error: 'Foreign key constraint failed',
    });
  }

  // Record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      error: 'Record does not exist',
    });
  }

  // Invalid UUID format
  if (
    err.message &&
    err.message.includes('invalid input syntax for type uuid')
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'ID must be a valid UUID',
    });
  }

  // Default error response
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong',
  });
};
