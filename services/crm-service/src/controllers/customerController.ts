import { Request, Response } from "express";
import { getAllCustomersService } from "../services/customerServices";

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
