import { Request, Response } from 'express';
import prisma from '../prisma/client';

const getMaterials = async (req: Request, res: Response) => {
  try {
    const materials = await prisma.material.findMany();
    return res.json(materials);
  } catch (error) {
    console.error('Failed to fetch materials', error);
    return res.status(500).json({ message: 'Failed to fetch materials' });
  }
};

export default { getMaterials };
