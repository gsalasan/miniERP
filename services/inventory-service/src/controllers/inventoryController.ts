import { Request, Response } from 'express';
import { inventoryService } from '../services/inventoryService';

export async function getProjectMaterials(req: Request, res: Response) {
  const { projectId } = req.query as any;
  try {
    const data = await inventoryService.getProjectMaterials(projectId);
    res.json({ success: true, data });
  } catch (err: any) {
    const status = err?.status || 500;
    res.status(status).json({ success: false, message: err?.message || 'Internal error' });
  }
}

export async function postAllocate(req: Request, res: Response) {
  const { projectId, materialId, quantity, need } = req.body;
  const userId = (req as any).user?.id || req.headers['x-user-id'] || null;
  try {
    const result = await inventoryService.allocateStock({ projectId, materialId, quantity, userId, need });
    // TODO: emit event or notify other services
    res.json({ success: true, allocation: result.allocation, stock: result.updatedStock });
  } catch (err: any) {
    const status = err?.status || 500;
    res.status(status).json({ success: false, message: err?.message || 'Internal error' });
  }
}

export async function postIssue(req: Request, res: Response) {
  const { projectId, materialId, quantity } = req.body;
  const userId = (req as any).user?.id || req.headers['x-user-id'] || null;
  try {
    const result = await inventoryService.issueMaterial({ projectId, materialId, quantity, userId });
    res.json({ success: true, issue: result.issue, stock: result.updatedStock });
  } catch (err: any) {
    const status = err?.status || 500;
    res.status(status).json({ success: false, message: err?.message || 'Internal error' });
  }
}
