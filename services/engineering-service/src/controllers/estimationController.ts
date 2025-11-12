import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import * as estimationService from '../services/estimationService';

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
    if (!estimation) return res.status(404).json({ error: 'Estimation not found' });
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
