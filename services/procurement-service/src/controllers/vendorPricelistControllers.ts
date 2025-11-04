import { Request, Response } from 'express';
import {
  getAllVendorPrices,
  getVendorPriceById,
  createVendorPrice,
  updateVendorPrice,
  deleteVendorPrice,
} from '../services/vendorPricelistServices';

export async function getAllPrices(req: Request, res: Response): Promise<void> {
  try {
    const data = await getAllVendorPrices();
    res.status(200).json({ success: true, data, message: 'Vendor pricelist fetched' });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error fetching vendor pricelist:', error);
    res.status(500).json({ success: false, message: 'Error fetching vendor pricelist' });
  }
}

export async function getPriceById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) { res.status(400).json({ success: false, message: 'ID diperlukan' }); return; }
    const item = await getVendorPriceById(id);
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.status(200).json({ success: true, data: item });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error fetching vendor pricelist by id:', error);
    res.status(500).json({ success: false, message: 'Error fetching vendor pricelist' });
  }
}

export async function createPrice(req: Request, res: Response): Promise<void> {
  try {
    const payload = req.body;
    console.log('Create vendor pricelist payload:', payload);
    // Basic validation
    if (!payload.material_id || !payload.vendor_id || payload.price == null || !payload.currency) {
      res.status(400).json({ success: false, message: 'material_id, vendor_id, price, currency required' });
      return;
    }

    const created = await createVendorPrice(payload);
    res.status(201).json({ success: true, data: created, message: 'Vendor price created' });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Error creating vendor price:', error);
    // Prisma error detail
    if (error.code && error.meta) {
      res.status(500).json({ success: false, message: error.message, code: error.code, meta: error.meta });
    } else {
      res.status(500).json({ success: false, message: error.message || 'Error creating vendor price' });
    }
  }
}

export async function updatePrice(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) { res.status(400).json({ success: false, message: 'ID diperlukan' }); return; }
    const payload = req.body;
    const updated = await updateVendorPrice(id, payload);
    if (!updated) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.status(200).json({ success: true, data: updated, message: 'Vendor price updated' });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error updating vendor price:', error);
    res.status(500).json({ success: false, message: 'Error updating vendor price' });
  }
}

export async function deletePrice(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) { res.status(400).json({ success: false, message: 'ID diperlukan' }); return; }
    const deleted = await deleteVendorPrice(id);
    if (!deleted) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.status(200).json({ success: true, message: 'Vendor price deleted' });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error deleting vendor price:', error);
    res.status(500).json({ success: false, message: 'Error deleting vendor price' });
  }
}
