import { Request, Response } from 'express';

type Material = {
  id: number;
  name: string;
  [key: string]: unknown;
};

const getMaterials = (req: Request, res: Response) => {
  const materials: Material[] = [];
  res.json(materials);
};

export default { getMaterials };
