import { Router } from 'express';
import * as assetController from '../controllers/assets.controller';

const router = Router();

// Get all assets
router.get('/', assetController.getAssets);

// Get asset summary
router.get('/summary', assetController.getAssetSummary);

// Generate asset code
router.get('/generate-code/:category', assetController.generateCode);

// Get asset by ID
router.get('/:id', assetController.getAssetById);

// Create new asset
router.post('/', assetController.createAsset);

// Update asset
router.put('/:id', assetController.updateAsset);

// Delete (dispose) asset
router.delete('/:id', assetController.deleteAsset);

// Run monthly depreciation
router.post('/depreciation/run', assetController.runDepreciation);

export default router;
