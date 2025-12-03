import { Router } from "express";
import * as assetsController from "../controllers/assets.controller";

const router = Router();

/**
 * FITUR 3.4.E - Asset Management & Depreciation
 * TSD: Manage fixed assets dengan automatic depreciation calculation
 * Connected to Database via Prisma
 */

// Get all assets
router.get("/", assetsController.getAssets);

// Get asset summary/statistics
router.get("/summary", assetsController.getAssetSummary);

// Generate asset code
router.get("/generate-code/:category", assetsController.generateCode);

// Get single asset by ID
router.get("/:id", assetsController.getAssetById);

// Create new asset
router.post("/", assetsController.createAsset);

// Run monthly depreciation for all assets (manual trigger)
router.post("/depreciation/run", assetsController.runDepreciation);

// Update asset
router.put("/:id", assetsController.updateAsset);

// Delete (dispose) asset
router.delete("/:id", assetsController.deleteAsset);

export default router;
