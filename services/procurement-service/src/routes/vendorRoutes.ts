import express from "express";
import {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
} from "../controllers/vendorController";

const router = express.Router();

// GET /api/v1/vendors - Get all vendors
router.get("/", getAllVendors);

// GET /api/v1/vendors/:id - Get vendor by ID
router.get("/:id", getVendorById);

// POST /api/v1/vendors - Create new vendor
router.post("/", createVendor);

// PUT /api/v1/vendors/:id - Update vendor
router.put("/:id", updateVendor);

// DELETE /api/v1/vendors/:id - Delete vendor
router.delete("/:id", deleteVendor);

export default router;
