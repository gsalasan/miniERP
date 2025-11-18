import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Helper to extract logged in user from a decoded token middleware (to be implemented)
interface AuthUser { id: string; name?: string; roles?: string[] }
declare module 'express-serve-static-core' {
  interface Request { user?: AuthUser }
}

export const getEstimations = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const estimations = await prisma.estimations.findMany({
      where: projectId ? { project_id: projectId as string } : undefined,
      orderBy: [{ created_at: 'desc' }],
    });
    res.json(estimations);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
};

export const getEstimationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const estimation = await prisma.estimations.findUnique({
      where: { id },
    });
    if (!estimation) return res.status(404).json({ error: 'Estimation not found' });
    res.json(estimation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
};

// Feature 3.1.D: Create estimation request (dipanggil dari CRM)
export const createEstimation = async (req: Request, res: Response) => {
  try {
    const { projectId, requestedByUserId, assignedToUserId, technicalBrief, attachmentUrls } = req.body;

    // Validasi basic
    if (!projectId || !technicalBrief) {
      return res.status(400).json({ message: 'projectId dan technicalBrief wajib diisi' });
    }

    // Fetch project untuk validasi + status check
    const project = await prisma.projects.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: 'Project tidak ditemukan' });

    // Business rule: hanya boleh membuat estimasi saat status PRE_SALES
    if (project.status !== 'PRE_SALES') {
      return res.status(400).json({ message: 'Permintaan estimasi hanya dapat dibuat saat proyek berada di tahap PRE_SALES' });
    }

    // Cek duplikasi v1
    const existing = await prisma.estimations.findFirst({ 
      where: { project_id: projectId, version: 1 } 
    });
    if (existing) {
      return res.status(409).json({ message: 'Estimasi untuk proyek ini sudah pernah dibuat.' });
    }

    // Create estimation request
    const newEstimation = await prisma.estimations.create({
      data: {
        id: randomUUID(),
        project_id: projectId,
        version: 1,
        status: 'PENDING',
        total_direct_hpp: 0,
        total_overhead_allocation: 0,
        total_hpp: 0,
        total_sell_price: 0,
        requested_by_user_id: requestedByUserId || null,
        assigned_to_user_id: assignedToUserId || null,
        technical_brief: technicalBrief,
        attachments: attachmentUrls && attachmentUrls.length ? attachmentUrls : undefined,
      },
    });

    return res.status(201).json(newEstimation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message: msg });
  }
};

export const updateEstimation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const estimation = await prisma.estimations.update({ where: { id }, data });
    res.json(estimation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message: msg });
  }
};

export const deleteEstimation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.estimations.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message: msg });
  }
};

// Get estimations by project (untuk CRM frontend)
export const getEstimationsByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const estimations = await prisma.estimations.findMany({
      where: { project_id: projectId },
      orderBy: [{ version: 'asc' }],
    });

    // Get project to use its sales_user_id as fallback requester
    const projectInfo = await prisma.projects.findUnique({
      where: { id: projectId },
      select: { sales_user_id: true },
    });

    // Build user name map (from users -> employees.full_name or email)
    const userIds = Array.from(
      new Set(
        estimations
          .flatMap(e => [e.requested_by_user_id, e.assigned_to_user_id])
          .filter((id): id is string => Boolean(id))
      )
    );

    // Also include the project's sales_user_id (requester fallback)
    if (projectInfo?.sales_user_id) {
      if (!userIds.includes(projectInfo.sales_user_id)) {
        userIds.push(projectInfo.sales_user_id);
      }
    }

    let userMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const users = await prisma.users.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          email: true,
          employee: { select: { full_name: true } },
        },
      });
      userMap = users.reduce<Record<string, string>>((acc, u) => {
        acc[u.id] = (u.employee?.full_name as string | undefined) || u.email;
        return acc;
      }, {});
    }

    const transformed = estimations.map(e => {
      const requesterId = e.requested_by_user_id || projectInfo?.sales_user_id || null;
      return {
        ...e,
        requested_by_user_name: requesterId ? userMap[requesterId] || null : null,
        assigned_to_user_name:
          e.assigned_to_user_id ? userMap[e.assigned_to_user_id] || null : null,
      };
    });

    res.json(transformed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message: msg });
  }
};

export const calculateEstimation = async (req: Request, res: Response) => {
  try {
    const {
      project_id,
      items,
      overhead_percentage,
      profit_margin_percentage,
      save_to_db,
      version,
      status,
    } = req.body;

    // Validasi input
    if (!project_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'project_id and items array are required',
      });
    }

    // Hitung estimasi menggunakan service
    const calculation = await estimationService.calculateEstimation({
      project_id,
      items,
      overhead_percentage: overhead_percentage || 0,
      profit_margin_percentage: profit_margin_percentage || 0,
      save_to_db: save_to_db || false,
      version: version || 1,
      status: status || 'DRAFT',
    });

    res.status(200).json(calculation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
};
