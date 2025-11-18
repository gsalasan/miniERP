import { Request, Response } from 'express';
import {
  getAllVendorCategories,
  createVendorCategory,
  deleteVendorCategory,
  getAllVendorClassifications,
  createVendorClassification,
  deleteVendorClassification,
} from '../services/vendorLookupServices';

export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const items = await getAllVendorCategories();
    res.status(200).json({ success: true, data: items });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
}

export async function postCategory(req: Request, res: Response): Promise<void> {
  try {
    const { value, label } = req.body;
    if (!value) {
      res.status(400).json({ success: false, message: 'value is required' });
      return;
    }
    const created = await createVendorCategory({ value, label: label || value });
    res.status(201).json({ success: true, data: created });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ success: false, message: (err as Error).message || 'Error creating category' });
  }
}

export async function removeCategory(req: Request, res: Response): Promise<void> {
  try {
    const { value } = req.params;
    if (!value) {
      res.status(400).json({ success: false, message: 'value required' });
      return;
    }
    const force = req.query.force === 'true' || req.query.force === '1';
    const result = await deleteVendorCategory(value, { force });
    if (result.success) {
      res.status(200).json({ success: true, forced: !!result.forced, affected: result.affected || 0 });
      return;
    }
    if (result.notFound) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }
    // not deleted because in use
    res.status(400).json({ success: false, message: 'Category is in use', refs: result.used });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(400).json({ success: false, message: (err as Error).message || 'Error deleting category' });
  }
}

export async function getClassifications(req: Request, res: Response): Promise<void> {
  try {
    const items = await getAllVendorClassifications();
    res.status(200).json({ success: true, data: items });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching classifications' });
  }
}

export async function postClassification(req: Request, res: Response): Promise<void> {
  try {
    const { value, label } = req.body;
    if (!value) {
      res.status(400).json({ success: false, message: 'value is required' });
      return;
    }
    const created = await createVendorClassification({ value, label: label || value });
    res.status(201).json({ success: true, data: created });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ success: false, message: (err as Error).message || 'Error creating classification' });
  }
}

export async function removeClassification(req: Request, res: Response): Promise<void> {
  try {
    const { value } = req.params;
    if (!value) {
      res.status(400).json({ success: false, message: 'value required' });
      return;
    }
    const force = req.query.force === 'true' || req.query.force === '1';
    const result = await deleteVendorClassification(value, { force });
    if (result.success) {
      // return whether it was forced and how many vendor refs were affected (if any)
      res.status(200).json({ success: true, forced: !!(result as any).forced, affected: (result as any).affected || 0 });
      return;
    }
    if ((result as any).error) {
      res.status(500).json({ success: false, message: `Failed to force-delete classification: ${(result as any).error}` });
      return;
    }
    if (result.notFound) {
      res.status(404).json({ success: false, message: 'Classification not found' });
      return;
    }
    res.status(400).json({ success: false, message: 'Classification is in use', refs: result.used });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(400).json({ success: false, message: (err as Error).message || 'Error deleting classification' });
  }
}
