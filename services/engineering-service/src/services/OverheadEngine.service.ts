import prisma from '../prisma/client';

const FINANCE_SERVICE_URL = process.env.FINANCE_SERVICE_URL || 'http://localhost:8080';

async function fetchFromFinance<T>(path: string): Promise<T | null> {
  try {
    const url = `${FINANCE_SERVICE_URL}${path}`;
    const res: any = await (global as any).fetch(url);
    if (!res || !res.ok) return null;
    const json = await res.json();
    return json as T;
  } catch {
    return null;
  }
}

export interface OverheadCalculationInput {
  total_direct_hpp: number;
  project_type?: string;
  use_default_percentage?: boolean;
  custom_percentage?: number;
}

export interface OverheadCalculationResult {
  total_direct_hpp: number;
  overhead_percentage: number;
  overhead_allocation: number;
  total_hpp_with_overhead: number;
  overhead_breakdown: OverheadCategoryBreakdown[];
  policy_applied: string;
  calculation_date: Date;
}

export interface OverheadCategoryBreakdown {
  category: string;
  target_percentage: number;
  allocation_percentage_to_hpp: number;
  allocated_amount: number;
  description?: string;
}

export interface OverheadPolicy {
  id: number;
  cost_category: string;
  target_percentage: number | null;
  allocation_percentage_to_hpp: number;
  created_at: Date;
  updated_at: Date;
}

export interface OverheadValidationResult {
  is_valid: boolean;
  total_allocation_percentage: number;
  max_allowed_percentage: number;
  breakdown: OverheadCategoryBreakdown[];
  warnings: string[];
  message: string;
}

export interface TargetVsActualComparison {
  category: string;
  target_percentage: number;
  actual_percentage: number;
  variance: number;
  variance_percentage: number;
  status: 'ON_TARGET' | 'OVER' | 'UNDER';
}

export interface ComparisonResult {
  total_target: number;
  total_actual: number;
  total_variance: number;
  categories: TargetVsActualComparison[];
  summary: {
    on_target_count: number;
    over_target_count: number;
    under_target_count: number;
  };
}

// ==================== CUSTOM ERRORS ====================

export class OverheadEngineError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'OverheadEngineError';
  }
}

export class InvalidOverheadPercentageError extends OverheadEngineError {
  constructor(percentage: number, max_allowed: number = 100) {
    super(
      `Invalid overhead percentage: ${percentage}%. Must be between 0 and ${max_allowed}%`,
      'INVALID_OVERHEAD_PERCENTAGE',
      { percentage, max_allowed }
    );
    this.name = 'InvalidOverheadPercentageError';
  }
}

export class OverheadPolicyNotFoundError extends OverheadEngineError {
  constructor(detail?: string) {
    super(
      `Overhead policies not found${detail ? ': ' + detail : ''}`,
      'OVERHEAD_POLICY_NOT_FOUND',
      { detail }
    );
    this.name = 'OverheadPolicyNotFoundError';
  }
}

export class InvalidDirectHppError extends OverheadEngineError {
  constructor(hpp: number) {
    super(
      `Invalid direct HPP: ${hpp}. Must be a positive number`,
      'INVALID_DIRECT_HPP',
      { hpp }
    );
    this.name = 'InvalidDirectHppError';
  }
}

// ==================== CACHE MANAGEMENT ====================

class OverheadPoliciesCache {
  private cache: Map<string, OverheadPolicy> = new Map();
  private totalAllocationCache: number | null = null;
  private lastRefresh: Date | null = null;
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  set(category: string, policy: OverheadPolicy): void {
    this.cache.set(category.toLowerCase(), policy);
  }

  get(category: string): OverheadPolicy | undefined {
    return this.cache.get(category.toLowerCase());
  }

  getAll(): OverheadPolicy[] {
    return Array.from(this.cache.values());
  }

  setTotalAllocation(percentage: number): void {
    this.totalAllocationCache = percentage;
  }

  getTotalAllocation(): number | null {
    return this.totalAllocationCache;
  }

  clear(): void {
    this.cache.clear();
    this.totalAllocationCache = null;
    this.lastRefresh = null;
  }

  isExpired(): boolean {
    if (!this.lastRefresh) return true;
    const now = new Date();
    return (now.getTime() - this.lastRefresh.getTime()) > this.CACHE_TTL_MS;
  }

  markRefreshed(): void {
    this.lastRefresh = new Date();
  }

  getStats() {
    return {
      size: this.cache.size,
      lastRefresh: this.lastRefresh,
      isExpired: this.isExpired(),
      totalAllocation: this.totalAllocationCache,
      categories: Array.from(this.cache.keys())
    };
  }
}

const overheadCache = new OverheadPoliciesCache();

// ==================== CONSTANTS ====================

const DEFAULT_OVERHEAD_PERCENTAGE = 15.0; // 15% default
const MAX_OVERHEAD_PERCENTAGE = 100.0; // Maximum 100%
const VARIANCE_TOLERANCE = 5.0; // 5% tolerance untuk variance

// ==================== CORE OVERHEAD ENGINE METHODS ====================

/**
 * 1. Calculate Overhead Allocation
 * 
 * Menghitung alokasi overhead ke HPP berdasarkan total direct HPP
 * 
 * @param input - OverheadCalculationInput
 * @returns OverheadCalculationResult
 */
export async function calculateOverheadAllocation(
  input: OverheadCalculationInput
): Promise<OverheadCalculationResult> {
  try {
    const {
      total_direct_hpp,
      project_type,
      use_default_percentage = false,
      custom_percentage
    } = input;

    // Validasi input
    if (total_direct_hpp < 0) {
      throw new InvalidDirectHppError(total_direct_hpp);
    }

    // Tentukan overhead percentage
    let overheadPercentage: number;
    let policyApplied: string;

    if (custom_percentage !== undefined && custom_percentage !== null) {
      // Gunakan custom percentage jika disediakan
      if (custom_percentage < 0 || custom_percentage > MAX_OVERHEAD_PERCENTAGE) {
        throw new InvalidOverheadPercentageError(custom_percentage, MAX_OVERHEAD_PERCENTAGE);
      }
      overheadPercentage = custom_percentage;
      policyApplied = `Custom (${custom_percentage}%)`;
    } else if (use_default_percentage) {
      // Gunakan default
      overheadPercentage = DEFAULT_OVERHEAD_PERCENTAGE;
      policyApplied = `Default (${DEFAULT_OVERHEAD_PERCENTAGE}%)`;
    } else {
      // Ambil dari total allocation policy
      overheadPercentage = await getOverheadAllocationPercentage();
      policyApplied = `System Policy (${overheadPercentage}%)`;
    }

    // Hitung overhead allocation
    const overheadAllocation = total_direct_hpp * (overheadPercentage / 100);
    const totalHppWithOverhead = total_direct_hpp + overheadAllocation;

    // Dapatkan breakdown per kategori
    const breakdown = await getOverheadBreakdownByCategory(total_direct_hpp);

    return {
      total_direct_hpp: Math.round(total_direct_hpp * 100) / 100,
      overhead_percentage: overheadPercentage,
      overhead_allocation: Math.round(overheadAllocation * 100) / 100,
      total_hpp_with_overhead: Math.round(totalHppWithOverhead * 100) / 100,
      overhead_breakdown: breakdown,
      policy_applied: policyApplied,
      calculation_date: new Date()
    };
  } catch (error) {
    if (error instanceof OverheadEngineError) {
      throw error;
    }
    throw new OverheadEngineError(
      `Failed to calculate overhead allocation: ${error.message}`,
      'CALCULATION_ERROR',
      { input, original_error: error.message }
    );
  }
}

/**
 * 2. Get Overhead Allocation Percentage
 * 
 * Ambil total % alokasi overhead dari database atau cache
 * 
 * @returns Total overhead allocation percentage
 */
export async function getOverheadAllocationPercentage(): Promise<number> {
  try {
    // Cek cache dulu
    if (!overheadCache.isExpired()) {
      const cachedTotal = overheadCache.getTotalAllocation();
      if (cachedTotal !== null) {
        return cachedTotal;
      }
    }

    // Refresh cache jika expired
    await refreshOverheadPoliciesCache();

    // Ambil dari cache yang sudah di-refresh
    const total = overheadCache.getTotalAllocation();
    if (total !== null) {
      return total;
    }

    // Fallback ke default jika tidak ada data
    console.warn(`No overhead policies found, using default: ${DEFAULT_OVERHEAD_PERCENTAGE}%`);
    return DEFAULT_OVERHEAD_PERCENTAGE;
  } catch (error) {
    console.error('Error getting overhead allocation percentage:', error);
    return DEFAULT_OVERHEAD_PERCENTAGE;
  }
}

/**
 * 3. Get Overhead Breakdown By Category
 * 
 * Detail alokasi overhead per kategori (Gaji, Sewa, Utilitas, dll)
 * 
 * @param total_direct_hpp - Total Direct HPP
 * @returns Array of OverheadCategoryBreakdown
 */
export async function getOverheadBreakdownByCategory(
  total_direct_hpp: number
): Promise<OverheadCategoryBreakdown[]> {
  try {
    if (total_direct_hpp < 0) {
      throw new InvalidDirectHppError(total_direct_hpp);
    }

    // Refresh cache jika expired
    if (overheadCache.isExpired()) {
      await refreshOverheadPoliciesCache();
    }

    // Ambil semua policies dari cache
    const policies = overheadCache.getAll();

    if (policies.length === 0) {
      console.warn('No overhead policies found for breakdown');
      return [];
    }

    // Hitung alokasi untuk setiap kategori
    const breakdown: OverheadCategoryBreakdown[] = policies.map(policy => {
      const allocatedAmount = total_direct_hpp * (policy.allocation_percentage_to_hpp / 100);

      return {
        category: policy.cost_category,
        target_percentage: policy.target_percentage || 0,
        allocation_percentage_to_hpp: policy.allocation_percentage_to_hpp,
        allocated_amount: Math.round(allocatedAmount * 100) / 100,
        description: getCategoryDescription(policy.cost_category)
      };
    });

    // Sort berdasarkan allocated_amount descending
    breakdown.sort((a, b) => b.allocated_amount - a.allocated_amount);

    return breakdown;
  } catch (error) {
    if (error instanceof OverheadEngineError) {
      throw error;
    }
    throw new OverheadEngineError(
      `Failed to get overhead breakdown: ${error.message}`,
      'BREAKDOWN_ERROR',
      { total_direct_hpp, error: error.message }
    );
  }
}

/**
 * 4. Validate Overhead Policy
 * 
 * Validasi total alokasi overhead ≤ 100% dan reasonable
 * 
 * @returns OverheadValidationResult
 */
export async function validateOverheadPolicy(): Promise<OverheadValidationResult> {
  try {
    // Refresh cache untuk data terbaru
    await refreshOverheadPoliciesCache();

    const policies = overheadCache.getAll();
    const warnings: string[] = [];

    if (policies.length === 0) {
      return {
        is_valid: false,
        total_allocation_percentage: 0,
        max_allowed_percentage: MAX_OVERHEAD_PERCENTAGE,
        breakdown: [],
        warnings: ['No overhead policies found'],
        message: 'No overhead allocation policies configured'
      };
    }

    // Hitung total allocation
    const totalAllocation = policies.reduce(
      (sum, policy) => sum + policy.allocation_percentage_to_hpp,
      0
    );

    // Validasi total tidak melebihi max
    const isValid = totalAllocation > 0 && totalAllocation <= MAX_OVERHEAD_PERCENTAGE;

    // Generate warnings
    if (totalAllocation > MAX_OVERHEAD_PERCENTAGE) {
      warnings.push(`Total allocation ${totalAllocation.toFixed(2)}% exceeds maximum ${MAX_OVERHEAD_PERCENTAGE}%`);
    }

    if (totalAllocation === 0) {
      warnings.push('Total allocation is 0%, no overhead will be applied');
    }

    if (totalAllocation < 5) {
      warnings.push('Total allocation is very low (< 5%), consider reviewing policies');
    }

    if (totalAllocation > 50) {
      warnings.push('Total allocation is high (> 50%), this may affect pricing competitiveness');
    }

    // Check individual policies
    for (const policy of policies) {
      if (policy.allocation_percentage_to_hpp > 20) {
        warnings.push(`Category "${policy.cost_category}" has high allocation: ${policy.allocation_percentage_to_hpp}%`);
      }
      if (policy.allocation_percentage_to_hpp === 0) {
        warnings.push(`Category "${policy.cost_category}" has 0% allocation`);
      }
    }

    // Create breakdown dengan contoh HPP
    const exampleHpp = 1000000; // Rp 1.000.000 untuk contoh
    const breakdown = await getOverheadBreakdownByCategory(exampleHpp);

    return {
      is_valid: isValid,
      total_allocation_percentage: Math.round(totalAllocation * 100) / 100,
      max_allowed_percentage: MAX_OVERHEAD_PERCENTAGE,
      breakdown,
      warnings,
      message: isValid
        ? `Overhead policy is valid. Total allocation: ${totalAllocation.toFixed(2)}%`
        : `Overhead policy validation failed. Issues: ${warnings.join('; ')}`
    };
  } catch (error) {
    throw new OverheadEngineError(
      `Failed to validate overhead policy: ${error.message}`,
      'VALIDATION_ERROR',
      { error: error.message }
    );
  }
}

/**
 * 5. Compare Target vs Actual Allocation
 * 
 * Bandingkan target vs actual allocation untuk analisis biaya
 * Berguna untuk cost control dan budgeting
 * 
 * @param actual_costs - Actual costs per category
 * @returns ComparisonResult
 */
export async function compareTargetVsActual(
  actual_costs: Record<string, number>
): Promise<ComparisonResult> {
  try {
    // Refresh cache untuk data terbaru
    if (overheadCache.isExpired()) {
      await refreshOverheadPoliciesCache();
    }

    const policies = overheadCache.getAll();

    if (policies.length === 0) {
      throw new OverheadPolicyNotFoundError('Cannot compare without policies');
    }

    // Hitung total actual
    const totalActual = Object.values(actual_costs).reduce((sum, cost) => sum + cost, 0);

    // Compare untuk setiap kategori
    const comparisons: TargetVsActualComparison[] = policies.map(policy => {
      const actualCost = actual_costs[policy.cost_category] || 0;
      const actualPercentage = totalActual > 0 ? (actualCost / totalActual) * 100 : 0;
      const targetPercentage = policy.target_percentage || 0;
      const variance = actualPercentage - targetPercentage;
      const variancePercentage = targetPercentage > 0 
        ? (variance / targetPercentage) * 100 
        : 0;

      // Determine status
      let status: 'ON_TARGET' | 'OVER' | 'UNDER';
      if (Math.abs(variance) <= VARIANCE_TOLERANCE) {
        status = 'ON_TARGET';
      } else if (variance > 0) {
        status = 'OVER';
      } else {
        status = 'UNDER';
      }

      return {
        category: policy.cost_category,
        target_percentage: Math.round(targetPercentage * 100) / 100,
        actual_percentage: Math.round(actualPercentage * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        variance_percentage: Math.round(variancePercentage * 100) / 100,
        status
      };
    });

    // Hitung total target
    const totalTarget = policies.reduce(
      (sum, policy) => sum + (policy.target_percentage || 0),
      0
    );

    const totalVariance = 100 - totalTarget; // Assuming actual is 100% of costs

    // Count status
    const onTargetCount = comparisons.filter(c => c.status === 'ON_TARGET').length;
    const overTargetCount = comparisons.filter(c => c.status === 'OVER').length;
    const underTargetCount = comparisons.filter(c => c.status === 'UNDER').length;

    return {
      total_target: Math.round(totalTarget * 100) / 100,
      total_actual: 100,
      total_variance: Math.round(totalVariance * 100) / 100,
      categories: comparisons,
      summary: {
        on_target_count: onTargetCount,
        over_target_count: overTargetCount,
        under_target_count: underTargetCount
      }
    };
  } catch (error) {
    if (error instanceof OverheadEngineError) {
      throw error;
    }
    throw new OverheadEngineError(
      `Failed to compare target vs actual: ${error.message}`,
      'COMPARISON_ERROR',
      { error: error.message }
    );
  }
}

/**
 * 6. Refresh Overhead Policies Cache
 * 
 * Refresh cache dengan data terbaru dari database
 * Optional: untuk performance optimization
 * 
 * @returns Number of policies loaded
 */
export async function refreshOverheadPoliciesCache(): Promise<number> {
  try {
    // Try finance-service API first
    const apiResult = await fetchFromFinance<any>(`/api/overhead-allocations`);
    const policies: any[] = apiResult && (apiResult as any).data
      ? (apiResult as any).data
      : await prisma.overhead_cost_allocations.findMany({
          orderBy: { cost_category: 'asc' }
        });

    overheadCache.clear();

    let totalAllocation = 0;

    for (const policy of policies) {
      const overheadPolicy: OverheadPolicy = {
        id: policy.id,
        cost_category: policy.cost_category,
        target_percentage: policy.target_percentage ? Number(policy.target_percentage) : null,
        allocation_percentage_to_hpp: Number(policy.allocation_percentage_to_hpp),
        created_at: policy.created_at,
        updated_at: policy.updated_at
      };

      overheadCache.set(policy.cost_category, overheadPolicy);
      totalAllocation += overheadPolicy.allocation_percentage_to_hpp;
    }

    overheadCache.setTotalAllocation(totalAllocation);
    overheadCache.markRefreshed();

    console.log(`✅ Overhead policies cache refreshed: ${policies.length} policies loaded, total allocation: ${totalAllocation.toFixed(2)}%`);
    return policies.length;
  } catch (error) {
    console.error('❌ Failed to refresh overhead policies cache:', error);
    throw new OverheadEngineError(
      `Failed to refresh overhead policies cache: ${error.message}`,
      'CACHE_REFRESH_ERROR',
      { error: error.message }
    );
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get category description for better readability
 */
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    'GAJI_OVERHEAD': 'Gaji indirect staff (admin, support)',
    'SEWA_KANTOR': 'Sewa gedung dan fasilitas kantor',
    'UTILITAS': 'Listrik, air, internet, telepon',
    'DEPRESIASI': 'Penyusutan aset perusahaan',
    'ASURANSI': 'Asuransi karyawan dan aset',
    'PEMELIHARAAN': 'Maintenance peralatan dan gedung',
    'ADMINISTRASI': 'Biaya administrasi umum',
    'MARKETING': 'Biaya marketing dan promosi',
    'LAIN_LAIN': 'Overhead lainnya'
  };

  return descriptions[category] || category;
}

// ==================== UTILITY METHODS ====================

/**
 * Get Cache Statistics
 * 
 * Untuk monitoring dan debugging
 */
export function getCacheStats() {
  return overheadCache.getStats();
}

/**
 * Clear Cache
 * 
 * Untuk force refresh atau cleanup
 */
export function clearCache(): void {
  overheadCache.clear();
  console.log('✅ Overhead policies cache cleared');
}

/**
 * Get All Policies
 * 
 * Retrieve all overhead policies (dari cache atau database)
 */
export async function getAllPolicies(force_refresh: boolean = false): Promise<OverheadPolicy[]> {
  if (force_refresh || overheadCache.isExpired()) {
    await refreshOverheadPoliciesCache();
  }

  return overheadCache.getAll();
}

/**
 * Calculate Overhead For Specific Category
 * 
 * Hitung overhead untuk kategori tertentu saja
 */
export async function calculateOverheadForCategory(
  category: string,
  total_direct_hpp: number
): Promise<number> {
  try {
    if (total_direct_hpp < 0) {
      throw new InvalidDirectHppError(total_direct_hpp);
    }

    if (overheadCache.isExpired()) {
      await refreshOverheadPoliciesCache();
    }

    const policy = overheadCache.get(category);
    if (!policy) {
      throw new OverheadPolicyNotFoundError(`Category: ${category}`);
    }

    const overhead = total_direct_hpp * (policy.allocation_percentage_to_hpp / 100);
    return Math.round(overhead * 100) / 100;
  } catch (error) {
    if (error instanceof OverheadEngineError) {
      throw error;
    }
    throw new OverheadEngineError(
      `Failed to calculate overhead for category: ${error.message}`,
      'CATEGORY_CALCULATION_ERROR',
      { category, total_direct_hpp, error: error.message }
    );
  }
}

/**
 * Simulate Overhead Allocation
 * 
 * Simulasi dengan berbagai percentage untuk what-if analysis
 */
export async function simulateOverheadAllocation(
  total_direct_hpp: number,
  percentages: number[]
): Promise<Array<{ percentage: number; overhead: number; total_hpp: number }>> {
  try {
    if (total_direct_hpp < 0) {
      throw new InvalidDirectHppError(total_direct_hpp);
    }

    return percentages.map(percentage => {
      if (percentage < 0 || percentage > MAX_OVERHEAD_PERCENTAGE) {
        throw new InvalidOverheadPercentageError(percentage, MAX_OVERHEAD_PERCENTAGE);
      }

      const overhead = total_direct_hpp * (percentage / 100);
      const totalHpp = total_direct_hpp + overhead;

      return {
        percentage,
        overhead: Math.round(overhead * 100) / 100,
        total_hpp: Math.round(totalHpp * 100) / 100
      };
    });
  } catch (error) {
    throw new OverheadEngineError(
      `Failed to simulate overhead allocation: ${error.message}`,
      'SIMULATION_ERROR',
      { total_direct_hpp, percentages, error: error.message }
    );
  }
}

// ==================== EXPORTS ====================

export const OverheadEngine = {
  calculateOverheadAllocation,
  getOverheadAllocationPercentage,
  getOverheadBreakdownByCategory,
  validateOverheadPolicy,
  compareTargetVsActual,
  refreshOverheadPoliciesCache,
  getCacheStats,
  clearCache,
  getAllPolicies,
  calculateOverheadForCategory,
  simulateOverheadAllocation
};

export default OverheadEngine;
