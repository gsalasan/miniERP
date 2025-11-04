import { Request, Response, NextFunction } from 'express';

export const validateCreateEstimation = (req: Request, res: Response, next: NextFunction) => {
  const { project_id, version, status, total_direct_hpp, total_hpp, total_sell_price } = req.body;
  const errors: string[] = [];
  if (!project_id) errors.push('project_id wajib diisi');
  if (!version || isNaN(version)) errors.push('version wajib dan harus angka');
  if (!status) errors.push('status wajib diisi');
  if (!total_direct_hpp || isNaN(total_direct_hpp)) errors.push('total_direct_hpp wajib dan harus angka');
  if (!total_hpp || isNaN(total_hpp)) errors.push('total_hpp wajib dan harus angka');
  if (!total_sell_price || isNaN(total_sell_price)) errors.push('total_sell_price wajib dan harus angka');
  if (errors.length) return res.status(400).json({ errors });
  next();
};

export const validateUpdateEstimation = (req: Request, res: Response, next: NextFunction) => {
  // Validasi update, bisa lebih fleksibel
  next();
};

export const validateUUID = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-fA-F-]{36}$/;
  if (!uuidRegex.test(id)) return res.status(400).json({ error: 'ID harus UUID valid' });
  next();
};

export const handleErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: err.message || 'Internal server error' });
};
