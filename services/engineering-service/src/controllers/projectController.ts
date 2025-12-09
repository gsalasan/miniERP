import { Request, Response } from 'express';
import prisma from '../prisma/client';

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        customer: true,
        estimations: true,
        project_boms: true,
        project_milestones: true,
      },
    });
    res.json(projects);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        customer: true,
        estimations: true,
        project_boms: true,
        project_milestones: true,
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const project = await prisma.project.create({ data });
    res.status(201).json(project);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const project = await prisma.project.update({ where: { id }, data });
    res.json(project);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
};

export const getProjectEstimations = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get all estimations for this project
    const estimations = await prisma.estimations.findMany({
      where: { project_id: id },
      include: {
        requested_by: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                full_name: true,
              },
            },
          },
        },
        assigned_to: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    
    res.json({ data: estimations });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
};

