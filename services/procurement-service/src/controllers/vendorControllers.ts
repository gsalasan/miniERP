import { Request, Response } from 'express';
import {
  getAllVendorsService,
  getVendorByIdService,
  createVendorService,
  updateVendorService,
  deleteVendorService,
} from '../services/vendorServices';
import { validateVendorData } from '../utils/validation';

export async function getAllVendors(req: Request, res: Response): Promise<void> {
  try {
    const vendors = await getAllVendorsService();
    res.status(200).json({ success: true, data: vendors, message: 'Vendors retrieved' });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error fetching vendors:', error);
    res.status(500).json({ success: false, message: 'Error fetching vendors' });
  }
}

export async function getVendorById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID vendor diperlukan' });
      return;
    }

    const vendor = await getVendorByIdService(id);
    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor tidak ditemukan' });
      return;
    }

    res.status(200).json({ success: true, data: vendor, message: 'Vendor retrieved' });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error fetching vendor by id:', error);
    res.status(500).json({ success: false, message: 'Error fetching vendor' });
  }
}

export async function createVendor(req: Request, res: Response): Promise<void> {
  try {
    const vendorData = req.body;
    const validation = validateVendorData(vendorData);
    if (!validation.isValid) {
      res.status(400).json({ success: false, message: 'Data tidak valid', errors: validation.errors });
      return;
    }

    const created = await createVendorService(vendorData as any);
    res.status(201).json({ success: true, data: created, message: 'Vendor created' });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error creating vendor:', error);
    res.status(500).json({ success: false, message: 'Error creating vendor' });
  }
}

export async function updateVendor(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const vendorData = req.body;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID vendor diperlukan' });
      return;
    }

    const validation = validateVendorData(vendorData, true);
    if (!validation.isValid) {
      res.status(400).json({ success: false, message: 'Data tidak valid', errors: validation.errors });
      return;
    }

    const updated = await updateVendorService(id, vendorData as any);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Vendor tidak ditemukan' });
      return;
    }

    res.status(200).json({ success: true, data: updated, message: 'Vendor updated' });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error updating vendor:', error);
    res.status(500).json({ success: false, message: 'Error updating vendor' });
  }
}

export async function deleteVendor(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID vendor diperlukan' });
      return;
    }

    const deleted = await deleteVendorService(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Vendor tidak ditemukan' });
      return;
    }

    res.status(200).json({ success: true, message: 'Vendor deleted' });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error deleting vendor:', error);
    res.status(500).json({ success: false, message: 'Error deleting vendor' });
  }
}