import { Request, Response } from 'express';
import * as assetService from '../services/assets.service';
import { AssetCategory, AssetStatus } from '@prisma/client';

/**
 * GET /api/assets
 * Get all assets with optional filters
 */
export async function getAssets(req: Request, res: Response) {
  try {
    const { category, status } = req.query;

    const filters: any = {};
    if (category) filters.category = category as AssetCategory;
    if (status) filters.status = status as AssetStatus;

    const result = await assetService.getAllAssets(filters);
    res.json(result);
  } catch (error: any) {
    console.error('Error in getAssets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assets',
      error: error.message
    });
  }
}

/**
 * GET /api/assets/summary
 * Get asset summary statistics
 */
export async function getAssetSummary(req: Request, res: Response) {
  try {
    const result = await assetService.getAssetSummary();
    res.json(result);
  } catch (error: any) {
    console.error('Error in getAssetSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset summary',
      error: error.message
    });
  }
}

/**
 * GET /api/assets/:id
 * Get asset by ID
 */
export async function getAssetById(req: Request, res: Response) {
  try {
    const assetId = parseInt(req.params.id);
    const result = await assetService.getAssetById(assetId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error: any) {
    console.error('Error in getAssetById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset',
      error: error.message
    });
  }
}

/**
 * POST /api/assets
 * Create new asset
 */
export async function createAsset(req: Request, res: Response) {
  try {
    const {
      asset_name,
      asset_code,
      category,
      acquisition_date,
      acquisition_cost,
      residual_value,
      useful_life_years,
      location,
      notes
    } = req.body;

    // Validation
    if (!asset_name || !category || !acquisition_date || !acquisition_cost || !useful_life_years) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: asset_name, category, acquisition_date, acquisition_cost, useful_life_years'
      });
    }

    // Generate asset code if not provided
    let finalAssetCode = asset_code;
    if (!finalAssetCode) {
      finalAssetCode = await assetService.generateAssetCode(category);
    }

    const result = await assetService.createAsset({
      asset_name,
      asset_code: finalAssetCode,
      category,
      acquisition_date: new Date(acquisition_date),
      acquisition_cost: parseFloat(acquisition_cost),
      residual_value: residual_value ? parseFloat(residual_value) : 0,
      useful_life_years: parseInt(useful_life_years),
      location,
      notes
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error in createAsset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create asset',
      error: error.message
    });
  }
}

/**
 * PUT /api/assets/:id
 * Update asset
 */
export async function updateAsset(req: Request, res: Response) {
  try {
    const assetId = parseInt(req.params.id);
    const { asset_name, category, location, notes, status } = req.body;

    const result = await assetService.updateAsset(assetId, {
      asset_name,
      category,
      location,
      notes,
      status
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error in updateAsset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update asset',
      error: error.message
    });
  }
}

/**
 * DELETE /api/assets/:id
 * Delete (dispose) asset
 */
export async function deleteAsset(req: Request, res: Response) {
  try {
    const assetId = parseInt(req.params.id);
    const result = await assetService.deleteAsset(assetId);
    res.json(result);
  } catch (error: any) {
    console.error('Error in deleteAsset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dispose asset',
      error: error.message
    });
  }
}

/**
 * POST /api/assets/depreciation/run
 * Manually trigger monthly depreciation
 */
export async function runDepreciation(req: Request, res: Response) {
  try {
    const { period } = req.body; // Optional: YYYY-MM format
    const result = await assetService.runMonthlyDepreciation(period);
    res.json(result);
  } catch (error: any) {
    console.error('Error in runDepreciation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run depreciation',
      error: error.message
    });
  }
}

/**
 * GET /api/assets/generate-code/:category
 * Generate next asset code for category
 */
export async function generateCode(req: Request, res: Response) {
  try {
    const category = req.params.category as AssetCategory;
    const code = await assetService.generateAssetCode(category);
    res.json({
      success: true,
      data: { code }
    });
  } catch (error: any) {
    console.error('Error in generateCode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate asset code',
      error: error.message
    });
  }
}
