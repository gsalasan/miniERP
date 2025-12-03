import { PrismaClient, Prisma, AssetCategory, AssetStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateAssetInput {
  asset_name: string;
  asset_code: string;
  category: AssetCategory;
  acquisition_date: Date;
  acquisition_cost: number;
  residual_value?: number;
  useful_life_years: number;
  location?: string;
  notes?: string;
}

interface UpdateAssetInput {
  asset_name?: string;
  category?: AssetCategory;
  location?: string;
  notes?: string;
  status?: AssetStatus;
}

/**
 * Calculate monthly depreciation using straight-line method
 */
function calculateMonthlyDepreciation(
  acquisitionCost: number,
  residualValue: number,
  usefulLifeYears: number
): number {
  const depreciableAmount = acquisitionCost - residualValue;
  const totalMonths = usefulLifeYears * 12;
  return depreciableAmount / totalMonths;
}

/**
 * Get all assets with optional filters
 */
export async function getAllAssets(filters?: {
  category?: AssetCategory;
  status?: AssetStatus;
}) {
  try {
    const where: any = {};
    
    if (filters?.category) {
      where.category = filters.category;
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }

    const assets = await prisma.fixed_assets.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      },
      include: {
        depreciation_history: {
          orderBy: {
            period: 'desc'
          },
          take: 1 // Get latest depreciation only
        }
      }
    });

    return {
      success: true,
      data: assets
    };
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
}

/**
 * Get asset by ID
 */
export async function getAssetById(assetId: number) {
  try {
    const asset = await prisma.fixed_assets.findUnique({
      where: { id: assetId },
      include: {
        depreciation_history: {
          orderBy: {
            period: 'desc'
          }
        }
      }
    });

    if (!asset) {
      return {
        success: false,
        message: 'Asset not found'
      };
    }

    return {
      success: true,
      data: asset
    };
  } catch (error) {
    console.error('Error fetching asset:', error);
    throw error;
  }
}

/**
 * Create new asset
 */
export async function createAsset(data: CreateAssetInput) {
  try {
    const residualValue = data.residual_value || 0;
    
    // Calculate monthly depreciation
    const monthlyDepreciation = calculateMonthlyDepreciation(
      data.acquisition_cost,
      residualValue,
      data.useful_life_years
    );

    // Create asset
    const asset = await prisma.fixed_assets.create({
      data: {
        asset_name: data.asset_name,
        asset_code: data.asset_code,
        category: data.category,
        acquisition_date: data.acquisition_date,
        acquisition_cost: new Prisma.Decimal(data.acquisition_cost),
        residual_value: new Prisma.Decimal(residualValue),
        useful_life_years: data.useful_life_years,
        depreciation_method: 'STRAIGHT_LINE',
        monthly_depreciation_amount: new Prisma.Decimal(monthlyDepreciation),
        current_book_value: new Prisma.Decimal(data.acquisition_cost),
        accumulated_depreciation: new Prisma.Decimal(0),
        status: 'ACTIVE',
        location: data.location,
        notes: data.notes
      }
    });

    // TODO: Trigger journal entry for asset acquisition
    // publishEvent('asset.acquired', { assetId: asset.id, cost: asset.acquisition_cost, acquisitionDate: asset.acquisition_date });

    return {
      success: true,
      message: 'Asset created successfully',
      data: asset
    };
  } catch (error) {
    console.error('Error creating asset:', error);
    throw error;
  }
}

/**
 * Update asset
 */
export async function updateAsset(assetId: number, data: UpdateAssetInput) {
  try {
    const asset = await prisma.fixed_assets.update({
      where: { id: assetId },
      data: {
        ...data,
        updated_at: new Date()
      }
    });

    return {
      success: true,
      message: 'Asset updated successfully',
      data: asset
    };
  } catch (error) {
    console.error('Error updating asset:', error);
    throw error;
  }
}

/**
 * Delete asset (soft delete by setting status to DISPOSED)
 */
export async function deleteAsset(assetId: number) {
  try {
    const asset = await prisma.fixed_assets.update({
      where: { id: assetId },
      data: {
        status: 'DISPOSED',
        updated_at: new Date()
      }
    });

    return {
      success: true,
      message: 'Asset disposed successfully',
      data: asset
    };
  } catch (error) {
    console.error('Error disposing asset:', error);
    throw error;
  }
}

/**
 * Get asset summary statistics
 */
export async function getAssetSummary() {
  try {
    const assets = await prisma.fixed_assets.findMany({
      where: {
        status: 'ACTIVE'
      }
    });

    const totalAcquisitionCost = assets.reduce(
      (sum, asset) => sum + Number(asset.acquisition_cost),
      0
    );

    const totalAccumulatedDepreciation = assets.reduce(
      (sum, asset) => sum + Number(asset.accumulated_depreciation),
      0
    );

    const totalBookValue = assets.reduce(
      (sum, asset) => sum + Number(asset.current_book_value),
      0
    );

    return {
      success: true,
      data: {
        totalAcquisitionCost,
        totalAccumulatedDepreciation,
        totalBookValue,
        totalAssets: assets.length
      }
    };
  } catch (error) {
    console.error('Error fetching asset summary:', error);
    throw error;
  }
}

/**
 * Run monthly depreciation for all active assets
 * Should be called by cron job on the 1st of each month
 */
export async function runMonthlyDepreciation(period?: string) {
  try {
    const currentPeriod = period || new Date().toISOString().substring(0, 7); // YYYY-MM
    
    const activeAssets = await prisma.fixed_assets.findMany({
      where: {
        status: 'ACTIVE'
      }
    });

    let totalDepreciationExpense = 0;
    const depreciationRecords = [];

    for (const asset of activeAssets) {
      // Check if depreciation already recorded for this period
      const existingRecord = await prisma.asset_depreciation_history.findFirst({
        where: {
          asset_id: asset.id,
          period: currentPeriod
        }
      });

      // Skip if already processed for this period
      if (existingRecord) {
        console.log(`Asset ${asset.asset_code} already depreciated for period ${currentPeriod}, skipping...`);
        continue;
      }

      // Check if asset still has value to depreciate
      if (Number(asset.current_book_value) > Number(asset.residual_value)) {
        const depreciationAmount = Number(asset.monthly_depreciation_amount);
        
        // Calculate new values
        const newAccumulatedDepreciation = Number(asset.accumulated_depreciation) + depreciationAmount;
        let newBookValue = Number(asset.acquisition_cost) - newAccumulatedDepreciation;
        
        // Ensure book value doesn't go below residual value
        if (newBookValue < Number(asset.residual_value)) {
          newBookValue = Number(asset.residual_value);
        }

        // Update asset
        await prisma.fixed_assets.update({
          where: { id: asset.id },
          data: {
            accumulated_depreciation: new Prisma.Decimal(newAccumulatedDepreciation),
            current_book_value: new Prisma.Decimal(newBookValue),
            updated_at: new Date()
          }
        });

        // Create depreciation history record
        await prisma.asset_depreciation_history.create({
          data: {
            asset_id: asset.id,
            period: currentPeriod,
            depreciation_expense: new Prisma.Decimal(depreciationAmount),
            accumulated_depreciation: new Prisma.Decimal(newAccumulatedDepreciation),
            book_value: new Prisma.Decimal(newBookValue)
          }
        });

        totalDepreciationExpense += depreciationAmount;
        depreciationRecords.push({
          assetId: asset.id,
          assetName: asset.asset_name,
          depreciationAmount
        });
      }
    }

    // TODO: Trigger journal entry for depreciation
    // if (totalDepreciationExpense > 0) {
    //   publishEvent('depreciation.posted', { totalAmount: totalDepreciationExpense, period: currentPeriod });
    // }

    const message = depreciationRecords.length === 0 
      ? `All assets already depreciated for period ${currentPeriod}`
      : `Depreciation for period ${currentPeriod} completed`;

    return {
      success: true,
      message,
      data: {
        period: currentPeriod,
        totalDepreciationExpense,
        assetsProcessed: depreciationRecords.length,
        totalAssets: activeAssets.length,
        details: depreciationRecords
      }
    };
  } catch (error) {
    console.error('Error running monthly depreciation:', error);
    throw error;
  }
}

/**
 * Generate next asset code based on category
 */
export async function generateAssetCode(category: AssetCategory): Promise<string> {
  const prefix: Record<AssetCategory, string> = {
    BUILDING: 'BLD',
    EQUIPMENT: 'EQP',
    VEHICLE: 'VEH',
    FURNITURE: 'FUR',
    COMPUTER: 'COM',
    OTHER: 'OTH'
  };

  const lastAsset = await prisma.fixed_assets.findFirst({
    where: {
      asset_code: {
        startsWith: prefix[category]
      }
    },
    orderBy: {
      asset_code: 'desc'
    }
  });

  let nextNumber = 1;
  if (lastAsset) {
    const lastNumber = parseInt(lastAsset.asset_code.split('-')[1]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix[category]}-${nextNumber.toString().padStart(4, '0')}`;
}
