import { Request, Response } from 'express';
import {
  getAllCustomersService,
  getCustomerByIdService,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
} from '../services/customerServices';
import { validateCustomerData } from '../utils/validation';

export async function getAllCustomers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const customers = await getAllCustomersService();

    res.status(200).json({
      success: true,
      data: customers,
      message: 'Data customers berhasil diambil',
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error fetching customers:', error);

    let message = 'Terjadi kesalahan saat mengambil data.';

    // Jika error berasal dari Prisma dan tabel tidak ditemukan
    if (error instanceof Error && error.message.includes('does not exist')) {
      message = 'Data belum tersedia di database.';
    }

    // Kirim respons error dengan status 500 ke client
    res.status(500).json({
      success: false,
      message,
    });
  }
}

export async function getCustomerById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID customer diperlukan',
      });
      return;
    }

    const customer = await getCustomerByIdService(id);

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer tidak ditemukan',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: customer,
      message: 'Data customer berhasil diambil',
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error fetching customer by ID:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data customer',
    });
  }
}

export async function createCustomer(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const customerData = req.body;

    // Validasi data
    const validation = validateCustomerData(customerData);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Data tidak valid',
        errors: validation.errors,
      });
      return;
    }

    const newCustomer = await createCustomerService(customerData);

    res.status(201).json({
      success: true,
      data: newCustomer,
      message: 'Customer berhasil dibuat',
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error creating customer:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat customer',
    });
  }
}

export async function updateCustomer(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const customerData = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID customer diperlukan',
      });
      return;
    }

    // Validasi data (untuk update, semua field bersifat opsional)
    const validation = validateCustomerData(customerData, true);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Data tidak valid',
        errors: validation.errors,
      });
      return;
    }

    const updatedCustomer = await updateCustomerService(id, customerData);

    if (!updatedCustomer) {
      res.status(404).json({
        success: false,
        message: 'Customer tidak ditemukan',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedCustomer,
      message: 'Customer berhasil diperbarui',
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error updating customer:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui customer',
    });
  }
}

export async function deleteCustomer(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID customer diperlukan',
      });
      return;
    }

    const deleted = await deleteCustomerService(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Customer tidak ditemukan',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Customer berhasil dihapus',
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error deleting customer:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus customer',
    });
  }
}
