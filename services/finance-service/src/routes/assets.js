const express = require('express');
const router = express.Router();
const assetsController = require('../controllers/assetsController');

/**
 * FITUR 3.4.E: Fixed Assets Management Routes
 * /api/assets
 */

// Get all assets with summary
router.get('/', assetsController.getAllAssets);

// Get asset summary/statistics
router.get('/summary', assetsController.getAssetSummary);

// Get single asset by ID
router.get('/:id', assetsController.getAssetById);

// Get depreciation history for an asset
router.get('/:id/depreciation-history', assetsController.getDepreciationHistory);

// Create new asset
router.post('/', assetsController.createAsset);

// Run depreciation for single asset (manual)
router.post('/:id/depreciate', assetsController.runDepreciationForAsset);

// Run depreciation for all assets (manual trigger)
router.post('/depreciation/run-all', assetsController.runMonthlyDepreciation);

// Update asset
router.patch('/:id', assetsController.updateAsset);

// Dispose asset
router.patch('/:id/dispose', assetsController.disposeAsset);

// Delete asset
router.delete('/:id', assetsController.deleteAsset);

module.exports = router;
