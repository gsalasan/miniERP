import { Request, Response } from 'express';
import taxonomyService from '../services/taxonomyService';

// Helpers
const ok = (res: Response, data: unknown, message = 'OK') =>
  res.status(200).json({ success: true, message, data });
const created = (res: Response, data: unknown, message = 'Created') =>
  res.status(201).json({ success: true, message, data });
const bad = (res: Response, message: string) => res.status(400).json({ success: false, message });
const notFound = (res: Response, message: string) =>
  res.status(404).json({ success: false, message });

// Service System Categories
export const listSystemCategories = async (req: Request, res: Response) => {
  const { search, page, limit } = req.query as {
    search?: string;
    page?: string;
    limit?: string;
  };
  const result = await taxonomyService.listSystemCategories({
    search,
    page: Number(page),
    limit: Number(limit),
  });
  return ok(res, result);
};

export const getSystemCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.getSystemCategory(id);
  if (!item) return notFound(res, 'System category not found');
  return ok(res, item);
};

export const createSystemCategory = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return bad(res, 'name is required');
  const item = await taxonomyService.createSystemCategory({ name });
  return created(res, item, 'System category created');
};

export const updateSystemCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const item = await taxonomyService.updateSystemCategory(id, { name });
  return ok(res, item, 'System category updated');
};

export const deleteSystemCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.deleteSystemCategory(id);
  return ok(res, item, 'System category deleted');
};

// Service Sub Systems
export const listSubSystems = async (req: Request, res: Response) => {
  const { system_category_id, search, page, limit } = req.query as {
    system_category_id?: string;
    search?: string;
    page?: string;
    limit?: string;
  };
  const result = await taxonomyService.listSubSystems({
    system_category_id,
    search,
    page: Number(page),
    limit: Number(limit),
  });
  return ok(res, result);
};

export const getSubSystem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.getSubSystem(id);
  if (!item) return notFound(res, 'Sub system not found');
  return ok(res, item);
};

export const createSubSystem = async (req: Request, res: Response) => {
  const { name, system_category_id } = req.body;
  if (!name || !system_category_id) return bad(res, 'name and system_category_id are required');
  const item = await taxonomyService.createSubSystem({ name, system_category_id });
  return created(res, item, 'Sub system created');
};

export const updateSubSystem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, system_category_id } = req.body;
  const item = await taxonomyService.updateSubSystem(id, { name, system_category_id });
  return ok(res, item, 'Sub system updated');
};

export const deleteSubSystem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.deleteSubSystem(id);
  return ok(res, item, 'Sub system deleted');
};

// Service Categories
export const listServiceCategories = async (req: Request, res: Response) => {
  const { search, page, limit } = req.query as {
    search?: string;
    page?: string;
    limit?: string;
  };
  const result = await taxonomyService.listServiceCategories({
    search,
    page: Number(page),
    limit: Number(limit),
  });
  return ok(res, result);
};

export const getServiceCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.getServiceCategory(id);
  if (!item) return notFound(res, 'Service category not found');
  return ok(res, item);
};

export const createServiceCategory = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return bad(res, 'name is required');
  const item = await taxonomyService.createServiceCategory({ name });
  return created(res, item, 'Service category created');
};

export const updateServiceCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const item = await taxonomyService.updateServiceCategory(id, { name });
  return ok(res, item, 'Service category updated');
};

export const deleteServiceCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.deleteServiceCategory(id);
  return ok(res, item, 'Service category deleted');
};

// Specific Types
export const listSpecificTypes = async (req: Request, res: Response) => {
  const { category_id, search, page, limit } = req.query as {
    category_id?: string;
    search?: string;
    page?: string;
    limit?: string;
  };
  const result = await taxonomyService.listSpecificTypes({
    category_id,
    search,
    page: Number(page),
    limit: Number(limit),
  });
  return ok(res, result);
};

export const getSpecificType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.getSpecificType(id);
  if (!item) return notFound(res, 'Specific type not found');
  return ok(res, item);
};

export const createSpecificType = async (req: Request, res: Response) => {
  const { name, category_id } = req.body;
  if (!name || !category_id) return bad(res, 'name and category_id are required');
  const item = await taxonomyService.createSpecificType({ name, category_id });
  return created(res, item, 'Specific type created');
};

export const updateSpecificType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category_id } = req.body;
  const item = await taxonomyService.updateSpecificType(id, { name, category_id });
  return ok(res, item, 'Specific type updated');
};

export const deleteSpecificType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.deleteSpecificType(id);
  return ok(res, item, 'Specific type deleted');
};

// Descriptions
export const listDescriptions = async (req: Request, res: Response) => {
  const { search, page, limit } = req.query as {
    search?: string;
    page?: string;
    limit?: string;
  };
  const result = await taxonomyService.listDescriptions({
    search,
    page: Number(page),
    limit: Number(limit),
  });
  return ok(res, result);
};

export const getDescription = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.getDescription(id);
  if (!item) return notFound(res, 'Description not found');
  return ok(res, item);
};

export const createDescription = async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) return bad(res, 'text is required');
  const item = await taxonomyService.createDescription({ text });
  return created(res, item, 'Description created');
};

export const updateDescription = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { text } = req.body;
  const item = await taxonomyService.updateDescription(id, { text });
  return ok(res, item, 'Description updated');
};

export const deleteDescription = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.deleteDescription(id);
  return ok(res, item, 'Description deleted');
};

// Team Recommendations
export const listTeamRecs = async (req: Request, res: Response) => {
  const { search, page, limit, type } = req.query as {
    search?: string;
    page?: string;
    limit?: string;
    type?: string;
  };
  const result = await taxonomyService.listTeamRecs({
    search,
    type,
    page: Number(page),
    limit: Number(limit),
  });
  return ok(res, result);
};

export const getTeamRec = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.getTeamRec(id);
  if (!item) return notFound(res, 'Team recommendation not found');
  return ok(res, item);
};

export const createTeamRec = async (req: Request, res: Response) => {
  const { name, type } = req.body;
  if (!name) return bad(res, 'name is required');
  const item = await taxonomyService.createTeamRec({ name, type });
  return created(res, item, 'Team recommendation created');
};

export const updateTeamRec = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, type } = req.body;
  const item = await taxonomyService.updateTeamRec(id, { name, type });
  return ok(res, item, 'Team recommendation updated');
};

export const deleteTeamRec = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.deleteTeamRec(id);
  return ok(res, item, 'Team recommendation deleted');
};

// FaseProyek
export const listFaseProyeks = async (req: Request, res: Response) => {
  const { search, page, limit } = req.query as {
    search?: string;
    page?: string;
    limit?: string;
  };
  const result = await taxonomyService.listFaseProyeks({
    search,
    page: Number(page),
    limit: Number(limit),
  });
  return ok(res, result);
};

export const getFaseProyek = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.getFaseProyek(id);
  if (!item) return notFound(res, 'Fase proyek not found');
  return ok(res, item);
};

export const createFaseProyek = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return bad(res, 'name is required');
  const item = await taxonomyService.createFaseProyek({ name });
  return created(res, item, 'Fase proyek created');
};

export const updateFaseProyek = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const item = await taxonomyService.updateFaseProyek(id, { name });
  return ok(res, item, 'Fase proyek updated');
};

export const deleteFaseProyek = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.deleteFaseProyek(id);
  return ok(res, item, 'Fase proyek deleted');
};

// SBU
export const listSBUs = async (req: Request, res: Response) => {
  const { search, page, limit } = req.query as {
    search?: string;
    page?: string;
    limit?: string;
  };
  const result = await taxonomyService.listSBUs({
    search,
    page: Number(page),
    limit: Number(limit),
  });
  return ok(res, result);
};

export const getSBU = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.getSBU(id);
  if (!item) return notFound(res, 'SBU not found');
  return ok(res, item);
};

export const createSBU = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return bad(res, 'name is required');
  const item = await taxonomyService.createSBU({ name });
  return created(res, item, 'SBU created');
};

export const updateSBU = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const item = await taxonomyService.updateSBU(id, { name });
  return ok(res, item, 'SBU updated');
};

export const deleteSBU = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await taxonomyService.deleteSBU(id);
  return ok(res, item, 'SBU deleted');
};

export default {
  listSystemCategories,
  getSystemCategory,
  createSystemCategory,
  updateSystemCategory,
  deleteSystemCategory,
  listSubSystems,
  getSubSystem,
  createSubSystem,
  updateSubSystem,
  deleteSubSystem,
  listServiceCategories,
  getServiceCategory,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  listSpecificTypes,
  getSpecificType,
  createSpecificType,
  updateSpecificType,
  deleteSpecificType,
  listDescriptions,
  getDescription,
  createDescription,
  updateDescription,
  deleteDescription,
  listTeamRecs,
  getTeamRec,
  createTeamRec,
  updateTeamRec,
  deleteTeamRec,
  listFaseProyeks,
  getFaseProyek,
  createFaseProyek,
  updateFaseProyek,
  deleteFaseProyek,
  listSBUs,
  getSBU,
  createSBU,
  updateSBU,
  deleteSBU,
};
