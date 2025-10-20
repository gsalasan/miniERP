import { Request, Response } from "express";
import {
  getAllCustomersService,
  getCustomerByIdService,
  createCustomerService,
  updateCustomerService,
} from "../services/customerServices";

export async function getAllCustomers(req: Request, res: Response) {
  try {
    const customers = await getAllCustomersService();
    res.status(200).json({
      success: true,
      message: "Data customers berhasil diambil",
      data: customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function getCustomerById(req: Request, res: Response) {
  try {
    const customer = await getCustomerByIdService(req.params.id);
    res.status(200).json({
      success: true,
      message: "Customer ditemukan",
      data: customer,
    });
  } catch (error) {
    console.error("Error getCustomerById:", error);
    const err = error as any;
    if (err?.status && err?.message) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function createCustomer(req: Request, res: Response) {
  try {
    const payload = req.body;
    const created = await createCustomerService(payload);
    res.status(201).json({
      success: true,
      message: "Customer berhasil dibuat",
      data: created,
    });
  } catch (error) {
    console.error("Error createCustomer:", error);
    const err = error as any;
    if (err?.status && err?.message) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function updateCustomer(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const payload = req.body;
    const updated = await updateCustomerService(id, payload);
    res.status(200).json({
      success: true,
      message: "Customer berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error("Error updateCustomer:", error);
    const err = error as any;
    if (err?.status && err?.message) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
}
