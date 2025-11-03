import { Request, Response, NextFunction } from 'express';

export const validateCreateProject = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { project_name, project_number, customer_id, contract_value } =
    req.body;

  const errors: string[] = [];
  if (!project_name || project_name.length < 2)
    errors.push('project_name minimal 2 karakter');
  if (!project_number) errors.push('project_number wajib diisi');
  if (!customer_id) errors.push('customer_id wajib diisi');
  if (!contract_value || isNaN(contract_value))
    errors.push('contract_value wajib dan harus angka');
  if (errors.length) return res.status(400).json({ errors });
  next();
};

export const validateUpdateProject = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Validasi update, bisa lebih fleksibel
  next();
};

export const validateUUID = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-fA-F-]{36}$/;
  if (!uuidRegex.test(id))
    return res.status(400).json({ error: 'ID harus UUID valid' });
  next();
};

export const handleErrors = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const msg = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ error: msg });
};
