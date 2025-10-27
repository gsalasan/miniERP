import { Request, Response } from "express";
import {
  getAllVendorsService,
  getVendorByIdService,
  createVendorService,
  updateVendorService,
  deleteVendorService,
} from "../services/vendorServices";
import { validateVendorData } from "../utils/validation";

export async function getAllVendors(req: Request, res: Response): Promise<void> {
  try {
    const vendors = await getAllVendorsService();

    res.status(200).json({
      success: true,
      data: vendors,
      message: "Data vendors berhasil diambil",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error fetching vendors:", error);

    let message = "Terjadi kesalahan saat mengambil data.";

    // Jika error berasal dari Prisma dan tabel tidak ditemukan
    if (error instanceof Error && error.message.includes("does not exist")) {
      message = "Data belum tersedia di database.";
    }

    // Kirim respons error dengan status 500 ke client
    res.status(500).json({
      success: false,
      message,
    });
  }
}

export async function getVendorById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "ID vendor diperlukan",
      });
      return;
    }

    const vendor = await getVendorByIdService(id);

    if (!vendor) {
      res.status(404).json({
        success: false,
        message: "Vendor tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: vendor,
      message: "Data vendor berhasil diambil",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error fetching vendor by ID:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data vendor",
    });
  }
}

export async function createVendor(req: Request, res: Response): Promise<void> {
  try {
    const vendorData = req.body;

    // Validasi data
    const validation = validateVendorData(vendorData);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: "Data tidak valid",
        errors: validation.errors,
      });
      return;
    }

    const newVendor = await createVendorService(vendorData);

    res.status(201).json({
      success: true,
      data: newVendor,
      message: "Vendor berhasil dibuat",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error creating vendor:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membuat vendor",
    });
  }
}

export async function updateVendor(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const vendorData = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "ID vendor diperlukan",
      });
      return;
    }

    // Validasi data (untuk update, semua field bersifat opsional)
    const validation = validateVendorData(vendorData, true);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: "Data tidak valid",
        errors: validation.errors,
      });
      return;
    }

    const updatedVendor = await updateVendorService(id, vendorData);

    if (!updatedVendor) {
      res.status(404).json({
        success: false,
        message: "Vendor tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedVendor,
      message: "Vendor berhasil diperbarui",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error updating vendor:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memperbarui vendor",
    });
  }
}

export async function deleteVendor(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "ID vendor diperlukan",
      });
      return;
    }

    const deleted = await deleteVendorService(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Vendor tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Vendor berhasil dihapus",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error deleting vendor:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menghapus vendor",
    });
  }
}
