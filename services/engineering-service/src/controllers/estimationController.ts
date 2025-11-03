import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getEstimations = async (req: Request, res: Response) => {
  try {
    const estimations = await prisma.estimation.findMany({
      include: { project: true, items: true },
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
    const estimation = await prisma.estimation.findUnique({
      where: { id },
      include: { project: true, items: true },
    });
    if (!estimation)
      return res.status(404).json({ error: 'Estimation not found' });
    res.json(estimation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
};

export const createEstimation = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const estimation = await prisma.estimation.create({ data });
    res.status(201).json(estimation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
};

export const updateEstimation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const estimation = await prisma.estimation.update({ where: { id }, data });
    res.json(estimation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
};

export const deleteEstimation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.estimation.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
};